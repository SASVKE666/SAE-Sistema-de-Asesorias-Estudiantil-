// Un horario que ya empezó o ya pasó no se puede reservar, y los listados usan el mismo criterio (hora LOCAL de la facultad, no UTC).
process.env.DB_FILE = ':memory:'; delete process.env.ZONA_HORARIA;
const test = require('node:test'), assert = require('node:assert');
const app = require('../server'); require('../seed')(app.db);
let srv, base, cookie;
const call = async (url, method = 'GET', body) => {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie: cookie || '' }, body: body && JSON.stringify(body) });
  const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
  return { status: r.status, json: await r.json() };
};
const db = app.db, DOC = 1;
const horario = (fecha, hora) => { db.prepare('INSERT OR IGNORE INTO horarios(docente_id,fecha,hora) VALUES(?,?,?)').run(DOC, fecha, hora); return db.prepare('SELECT id FROM horarios WHERE docente_id=? AND fecha=? AND hora=?').get(DOC, fecha, hora).id; };
const reservar = id => call('/api/asesorias', 'POST', { horario_id: id, materia: 'Estadística', duda: 'Duda de prueba' });
const libre = id => db.prepare('SELECT libre FROM horarios WHERE id=?').get(id).libre;
const lista = async () => (await call(`/api/docentes/${DOC}/horarios`)).json.map(h => `${h.fecha} ${h.hora}`);
// Mazatlán/Nayarit es UTC-7 todo el año: 2026-11-13T20:00Z = 13:00 locales del 13 de noviembre.
const ahora = (t, iso) => t.mock.method(Date, 'now', () => Date.parse(iso));
test.before(async () => { await new Promise(ok => { srv = app.listen(0, () => { base = 'http://localhost:' + srv.address().port; ok(); }); });
  assert.equal((await call('/api/registro', 'POST', { matricula: '24100001', email: 'ana@uan.edu.mx', password: 'segura1234' })).status, 200); });
test.after(() => srv.close());

test('un horario de 2020 se rechaza con 400, no se consume y no genera notificaciones', async () => {
  const id = horario('2020-01-01', '10:00'), notis = db.prepare('SELECT COUNT(*) n FROM notificaciones').get().n;
  const r = await reservar(id);
  assert.equal(r.status, 400); assert.match(r.json.error, /ya pasó/);
  assert.equal(libre(id), 1, 'el horario sigue libre'); assert.equal(db.prepare('SELECT COUNT(*) n FROM asesorias').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM notificaciones').get().n, notis);
});

test('hoy: el que ya empezó o empieza justo ahora se rechaza; el que empieza después se acepta', async t => {
  ahora(t, '2026-11-13T20:00:00Z');                                              // 13:00 local
  const antes = horario('2026-11-13', '12:00'), justo = horario('2026-11-13', '13:00'), despues = horario('2026-11-13', '15:00');
  assert.equal((await reservar(antes)).status, 400, '12:00 ya pasó');
  assert.equal((await reservar(justo)).status, 400, '13:00 es ahora mismo');
  assert.equal(libre(antes) + libre(justo), 2);
  assert.equal((await reservar(despues)).status, 200, '15:00 todavía no llega');
});

test('los listados usan el mismo criterio: no ofrecen horarios pasados y el conteo coincide', async t => {
  ahora(t, '2026-11-13T20:00:00Z');
  horario('2026-11-13', '12:00'); horario('2026-11-13', '13:00'); horario('2026-11-13', '16:00'); horario('2026-11-14', '09:00'); horario('2020-01-01', '11:00');
  const l = await lista();
  assert.ok(l.includes('2026-11-13 16:00') && l.includes('2026-11-14 09:00'), 'ofrece los futuros');
  for (const p of ['2026-11-13 12:00', '2026-11-13 13:00', '2020-01-01 10:00', '2020-01-01 11:00']) assert.ok(!l.includes(p), 'no ofrece ' + p);
  const doc = (await call('/api/docentes')).json.find(d => d.id === DOC);
  assert.equal(doc.libres, l.length, 'libres del catálogo = horarios ofrecidos');
});

test('manda la hora local, no la UTC: a las 19:00 locales del 13 todavía se reserva el de las 20:00 (en UTC ya es el 14)', async t => {
  ahora(t, '2026-11-14T02:00:00Z');                                              // 19:00 local del 13 de noviembre
  const tarde = horario('2026-11-13', '20:00'), pasado = horario('2026-11-13', '18:00');
  assert.ok((await lista()).includes('2026-11-13 20:00'), 'se ofrece el de las 20:00');
  assert.ok(!(await lista()).includes('2026-11-13 18:00'));
  assert.equal((await reservar(pasado)).status, 400);
  assert.equal((await reservar(tarde)).status, 200);
});

test('ZONA_HORARIA cambia el cálculo y una zona inválida vuelve a la de por defecto sin fallar', async t => {
  ahora(t, '2026-11-13T20:00:00Z');                                              // Nayarit 13:00 del 13; Tokio 05:00 del 14
  const noche = horario('2026-11-13', '23:00');
  process.env.ZONA_HORARIA = 'Asia/Tokyo';
  try {
    assert.equal((await reservar(noche)).status, 400, 'en hora de Tokio las 23:00 del 13 ya pasaron');
    process.env.ZONA_HORARIA = 'No/Existe';
    assert.equal((await reservar(horario('2026-11-13', '12:30'))).status, 400, 'zona inválida: usa Nayarit, 12:30 ya pasó');
    assert.equal((await reservar(noche)).status, 200, 'zona inválida: usa Nayarit, 23:00 aún no llega');
  } finally { delete process.env.ZONA_HORARIA; }
});

test('pasada la medianoche local (00:30) se razona bien: el de 00:15 ya pasó y el de 01:00 no', async t => {
  ahora(t, '2026-11-14T07:30:00Z');                                              // 00:30 local del 14 de noviembre
  assert.equal((await reservar(horario('2026-11-14', '00:15'))).status, 400);
  assert.equal((await reservar(horario('2026-11-14', '01:00'))).status, 200);
});
