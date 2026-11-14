// SAE - Sistema de Asesorías Estudiantil · UAN, Unidad Académica de Economía
const express = require('express'), bcrypt = require('bcryptjs'), crypto = require('crypto');
const nodemailer = require('nodemailer'), QRCode = require('qrcode'), path = require('path');
const { DatabaseSync } = require('node:sqlite');
const PORT = process.env.PORT || 3000, BASE = process.env.BASE_URL || `http://localhost:${PORT}`;
const SECRET = process.env.SESSION_SECRET || 'cambia-este-secreto-en-produccion';
const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'data', 'sae.db'));
db.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS padron(matricula TEXT PRIMARY KEY, nombre TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, matricula TEXT UNIQUE NOT NULL, nombre TEXT NOT NULL,
  email TEXT NOT NULL, rol TEXT NOT NULL CHECK(rol IN('estudiante','docente','secretaria')), pass_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS docentes(id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id),
  materias TEXT NOT NULL, cubiculo TEXT, foto TEXT);
CREATE TABLE IF NOT EXISTS horarios(id INTEGER PRIMARY KEY, docente_id INTEGER NOT NULL REFERENCES docentes(id),
  fecha TEXT NOT NULL, hora TEXT NOT NULL, libre INTEGER NOT NULL DEFAULT 1, UNIQUE(docente_id,fecha,hora));
CREATE TABLE IF NOT EXISTS asesorias(id INTEGER PRIMARY KEY, estudiante_id INTEGER NOT NULL REFERENCES users(id),
  docente_id INTEGER NOT NULL REFERENCES docentes(id), horario_id INTEGER NOT NULL REFERENCES horarios(id),
  materia TEXT NOT NULL, duda TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente', creada TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notificaciones(id INTEGER PRIMARY KEY, asesoria_id INTEGER, destinatario TEXT, asunto TEXT,
  cuerpo TEXT, enviado INTEGER DEFAULT 0, fecha TEXT DEFAULT CURRENT_TIMESTAMP);`);
// Las fechas y horas de los horarios son hora local de la Unidad Académica (no UTC): "ahora" se calcula en esa zona (ZONA_HORARIA, por defecto Nayarit/Pacífico).
const ZONA_DEFECTO = 'America/Mazatlan';
function ahoraLocal() {
  const parte = {};
  const fmt = z => new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let f; try { f = fmt(process.env.ZONA_HORARIA || ZONA_DEFECTO); } catch { f = fmt(ZONA_DEFECTO); }   // zona inválida: se usa la de por defecto
  for (const x of f.formatToParts(new Date(Date.now()))) parte[x.type] = x.value;
  return { fecha: `${parte.year}-${parte.month}-${parte.day}`, hora: `${parte.hour}:${parte.minute}` };
}
const yaPaso = (fecha, hora) => { const n = ahoraLocal(); return `${fecha} ${hora}` <= `${n.fecha} ${n.hora}`; };   // vigente solo si empieza después de ahora
const futuro = al => `(${al}.fecha > ? OR (${al}.fecha = ? AND ${al}.hora > ?))`;       // condición SQL "empieza después de ahora" ...
const paramsFuturo = () => { const n = ahoraLocal(); return [n.fecha, n.fecha, n.hora]; };  // ... y sus 3 parámetros
const q = (s, ...p) => db.prepare(s).all(...p), one = (s, ...p) => db.prepare(s).get(...p), run = (s, ...p) => db.prepare(s).run(...p);

// ---- Correo: SMTP real si hay variables; si no, queda registrado en la bitácora (enviado=0) ----
const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }) : null;
async function notificar(asesoriaId, destinatarios, asunto, cuerpo) {
  for (const to of destinatarios) {
    let ok = 0;
    try { if (mailer) { await mailer.sendMail({ from: process.env.SMTP_FROM || 'SAE <no-reply@uan.edu.mx>', to, subject: asunto, text: cuerpo }); ok = 1; } }
    catch (e) { console.error('Correo falló:', e.message); }
    run('INSERT INTO notificaciones(asesoria_id,destinatario,asunto,cuerpo,enviado) VALUES(?,?,?,?,?)', asesoriaId, to, asunto, cuerpo, ok);
  }
}
const detalle = id => one(`SELECT a.*, h.fecha, h.hora, e.nombre est_nombre, e.email est_email, u.nombre doc_nombre, u.email doc_email
  FROM asesorias a JOIN horarios h ON h.id=a.horario_id JOIN users e ON e.id=a.estudiante_id
  JOIN docentes d ON d.id=a.docente_id JOIN users u ON u.id=d.user_id WHERE a.id=?`, id);
const secretarias = () => q("SELECT email FROM users WHERE rol='secretaria'").map(r => r.email);

// ---- Sesión: cookie firmada (HMAC) httpOnly ----
const sign = d => { const p = Buffer.from(JSON.stringify(d)).toString('base64url'); return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url'); };
const verify = t => { try { const [p, s] = t.split('.'); const ok = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  if (s.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(ok))) return null;
  const d = JSON.parse(Buffer.from(p, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch { return null; } };
const app = express();
// Detrás de Nginx/proxy, req.ip sería la del proxy. Actívalo solo si hay proxy de confianza (ej. TRUST_PROXY=1); si no, X-Forwarded-For se podría falsificar.
if (process.env.TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? +process.env.TRUST_PROXY : process.env.TRUST_PROXY);
app.use(express.json({ limit: '20kb' }));
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  const m = /sae=([^;]+)/.exec(req.headers.cookie || ''); const s = m && verify(m[1]); req.user = s ? one('SELECT id,matricula,nombre,email,rol FROM users WHERE id=?', s.uid) : null; next(); });
const auth = (...roles) => (req, res, next) => !req.user ? res.status(401).json({ error: 'Inicia sesión.' }) :
  roles.length && !roles.includes(req.user.rol) ? res.status(403).json({ error: 'No tienes permiso para esta acción.' }) : next();
const abrir = (res, u) => res.cookie('sae', sign({ uid: u.id, exp: Date.now() + 8 * 3600e3 }), { httpOnly: true, sameSite: 'lax', secure: BASE.startsWith('https'), maxAge: 8 * 3600e3 });
// Freno a fuerza bruta: solo cuentan los intentos FALLIDOS (login o registro con respuesta de error), por matrícula + IP.
// Así una persona que se equivoca no bloquea a las demás aunque compartan IP (red de la facultad, NAT) y los accesos correctos no gastan el cupo.
const VENTANA = 600e3, MAX_POR_CUENTA = 8, MAX_POR_IP = 100; // 8 fallos / 10 min por matrícula+IP; tope amplio por IP contra probar muchas matrículas
const fallos = new Map(); // clave -> marcas de tiempo de los fallos recientes
const recientes = k => { const n = (fallos.get(k) || []).filter(t => Date.now() - t < VENTANA); n.length ? fallos.set(k, n) : fallos.delete(k); return n; };
const limite = (req, res, next) => {
  const ip = req.ip || '', cuenta = `${ip}|${String(req.body?.matricula ?? '').trim().toUpperCase().slice(0, 40)}`;
  if (recientes(cuenta).length >= MAX_POR_CUENTA || recientes(ip).length >= MAX_POR_IP)
    return res.status(429).json({ error: 'Demasiados intentos. Espera 10 minutos.' });
  res.on('finish', () => {
    if (res.statusCode < 400) return fallos.delete(cuenta);                       // acceso correcto: se limpia el historial de esa cuenta
    for (const k of [cuenta, ip]) fallos.set(k, [...recientes(k), Date.now()]);   // fallo: cuenta contra la cuenta y contra la IP
    if (fallos.size > 5000) for (const k of fallos.keys()) recientes(k);          // limpieza de claves vencidas para no crecer sin límite
  });
  next();
};
app.post('/api/registro', limite, (req, res) => {
  const { matricula, email, password } = req.body || {};
  if (!matricula || !email || !password || password.length < 8) return res.status(400).json({ error: 'Completa matrícula, correo y una contraseña de 8+ caracteres.' });
  const p = one('SELECT * FROM padron WHERE matricula=?', String(matricula).trim());
  if (!p) return res.status(403).json({ error: 'Matrícula no válida: no aparece en el padrón de la Unidad Académica.' });
  if (one('SELECT 1 FROM users WHERE matricula=?', p.matricula)) return res.status(409).json({ error: 'Esa matrícula ya tiene cuenta.' });
  const r = run("INSERT INTO users(matricula,nombre,email,rol,pass_hash) VALUES(?,?,?,'estudiante',?)", p.matricula, p.nombre, String(email).trim().toLowerCase(), bcrypt.hashSync(password, 10));
  const u = { id: Number(r.lastInsertRowid) }; abrir(res, u); res.json({ ok: true });
});
app.post('/api/login', limite, (req, res) => {
  const { matricula, password } = req.body || {}; const u = one('SELECT * FROM users WHERE matricula=?', String(matricula || '').trim());
  if (!u || !bcrypt.compareSync(String(password || ''), u.pass_hash)) return res.status(401).json({ error: 'Matrícula o contraseña incorrecta.' });
  abrir(res, u); res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.clearCookie('sae'); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json({ user: req.user }));

app.get('/api/docentes', auth(), (req, res) => {
  const t = `%${(req.query.q || '').trim()}%`;
  res.json(q(`SELECT d.id, u.nombre, d.materias, d.cubiculo, d.foto,
    (SELECT COUNT(*) FROM horarios h WHERE h.docente_id=d.id AND h.libre=1 AND ${futuro('h')}) libres
    FROM docentes d JOIN users u ON u.id=d.user_id WHERE u.nombre LIKE ? OR d.materias LIKE ? ORDER BY u.nombre`, ...paramsFuturo(), t, t));
});
app.get('/api/docentes/:id/horarios', auth(), (req, res) =>
  res.json(q(`SELECT h.id,h.fecha,h.hora FROM horarios h WHERE h.docente_id=? AND h.libre=1 AND ${futuro('h')} ORDER BY h.fecha,h.hora`, req.params.id, ...paramsFuturo())));

app.post('/api/asesorias', auth('estudiante'), async (req, res) => {
  const { horario_id, materia, duda } = req.body || {};
  if (!horario_id || !materia?.trim() || !duda?.trim()) return res.status(400).json({ error: 'Indica horario, materia y tu duda.' });
  const h = one('SELECT * FROM horarios WHERE id=?', horario_id);
  if (!h) return res.status(404).json({ error: 'Horario inexistente.' });
  if (yaPaso(h.fecha, h.hora)) return res.status(400).json({ error: 'Ese horario ya pasó. Elige otro.' });   // antes de reservarlo: no consume el horario
  // Validación de disponibilidad atómica: solo se reserva si sigue libre
  const r = run('UPDATE horarios SET libre=0 WHERE id=? AND libre=1', horario_id);
  if (!r.changes) return res.status(409).json({ error: 'Ese horario ya fue ocupado. Elige otro.' });
  const a = run('INSERT INTO asesorias(estudiante_id,docente_id,horario_id,materia,duda) VALUES(?,?,?,?,?)', req.user.id, h.docente_id, h.id, materia.trim().slice(0, 120), duda.trim().slice(0, 1000));
  const d = detalle(Number(a.lastInsertRowid));
  const txt = `Asesoría #${d.id} de ${d.materia}\nFecha: ${d.fecha} ${d.hora}\nEstudiante: ${d.est_nombre}\nDocente: ${d.doc_nombre}\nDuda: ${d.duda}\nEstado: pendiente de confirmación del docente.`;
  await notificar(d.id, [d.est_email, d.doc_email, ...secretarias()], `SAE · Solicitud de asesoría #${d.id}`, txt);
  res.json({ ok: true, id: d.id });
});
app.get('/api/asesorias', auth(), (req, res) => {
  const u = req.user, f = u.rol === 'estudiante' ? ['a.estudiante_id=?', u.id] : u.rol === 'docente' ? ['a.docente_id=(SELECT id FROM docentes WHERE user_id=?)', u.id] : ['1=?', 1];
  res.json(q(`SELECT a.id,a.materia,a.duda,a.estado,h.fecha,h.hora,e.nombre estudiante,du.nombre docente FROM asesorias a
    JOIN horarios h ON h.id=a.horario_id JOIN users e ON e.id=a.estudiante_id JOIN docentes d ON d.id=a.docente_id
    JOIN users du ON du.id=d.user_id WHERE ${f[0]} ORDER BY h.fecha DESC,h.hora DESC`, f[1]));
});
app.patch('/api/asesorias/:id', auth('estudiante', 'docente'), async (req, res) => {
  const d = detalle(req.params.id), est = req.body?.estado;
  const permitido = req.user.rol === 'docente' ? ['confirmada', 'realizada', 'cancelada'] : ['cancelada'];
  if (!d || !permitido.includes(est)) return res.status(400).json({ error: 'Cambio de estado no permitido.' });
  const mia = req.user.rol === 'estudiante' ? d.estudiante_id === req.user.id : d.doc_email === req.user.email;
  if (!mia) return res.status(403).json({ error: 'Esta asesoría no es tuya.' });
  run('UPDATE asesorias SET estado=? WHERE id=?', est, d.id);
  if (est === 'cancelada') run('UPDATE horarios SET libre=1 WHERE id=?', d.horario_id); // libera el horario
  await notificar(d.id, [d.est_email, d.doc_email, ...secretarias()], `SAE · Asesoría #${d.id} ${est}`, `La asesoría de ${d.materia} (${d.fecha} ${d.hora}) quedó ${est}.`);
  res.json({ ok: true });
});
app.post('/api/horarios', auth('docente'), (req, res) => {
  const { fecha, hora } = req.body || {}; const d = one('SELECT id FROM docentes WHERE user_id=?', req.user.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || !/^\d{2}:\d{2}$/.test(hora || '')) return res.status(400).json({ error: 'Fecha u hora inválida.' });
  try { run('INSERT INTO horarios(docente_id,fecha,hora) VALUES(?,?,?)', d.id, fecha, hora); res.json({ ok: true }); }
  catch { res.status(409).json({ error: 'Ya registraste ese horario.' }); }
});
app.get('/api/notificaciones', auth('secretaria'), (req, res) => res.json(q('SELECT * FROM notificaciones ORDER BY id DESC LIMIT 100')));
app.get('/api/qr', async (req, res) => res.json({ url: BASE, png: await QRCode.toDataURL(BASE, { margin: 1, width: 320 }) }));
app.use(express.static(path.join(__dirname, 'public')));
if (require.main === module) { require('./seed')(db); app.listen(PORT, () => console.log(`SAE en ${BASE}`)); }
app.db = db; module.exports = app;
