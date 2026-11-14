// Límite de intentos de login/registro: solo cuentan los fallos, por matrícula + IP (no por IP sola).
process.env.DB_FILE = ':memory:'; delete process.env.TRUST_PROXY;
const test = require('node:test'), assert = require('node:assert');
const app = require('../server'); require('../seed')(app.db);
let srv, base;
const post = async (url, body, headers = {}) => {
  const r = await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return r.status;
};
const login = (m, p, h) => post('/api/login', { matricula: m, password: p }, h);
test.before(() => new Promise(ok => { srv = app.listen(0, () => { base = 'http://localhost:' + srv.address().port; ok(); }); }));
test.after(() => srv.close());

test('8 fallos de una persona NO bloquean a otra que comparte la IP (el caso de la red de la facultad)', async () => {
  for (let i = 0; i < 8; i++) assert.equal(await login('DOC001', 'mala' + i), 401);
  assert.equal(await login('DOC001', 'otra-mala'), 429, 'la cuenta con 8 fallos queda frenada');
  assert.equal(await login('DOC002', 'Docente2026'), 200, 'otra matrícula desde la misma IP entra sin problema');
  assert.equal(await login('SEC001', 'Secretaria2026'), 200);
});

test('una cuenta frenada no entra ni con la contraseña correcta hasta que pase la ventana', async () => {
  assert.equal(await login('DOC001', 'Docente2026'), 429);
});

test('los accesos correctos no gastan el cupo (más de 8 seguidos)', async () => {
  for (let i = 0; i < 15; i++) assert.equal(await login('DOC003', 'Docente2026'), 200, 'login correcto #' + (i + 1));
});

test('un acceso correcto limpia los fallos anteriores de esa cuenta', async () => {
  for (let i = 0; i < 6; i++) assert.equal(await login('24100002', 'no-existe' + i), 401);
  await post('/api/registro', { matricula: '24100002', email: 'd@uan.edu.mx', password: 'segura1234' });   // registro correcto limpia el historial
  for (let i = 0; i < 6; i++) assert.equal(await login('24100002', 'mala' + i), 401, 'tras el éxito se vuelve a contar desde cero');
});

test('el registro con matrícula inválida también se frena, pero solo para esa matrícula', async () => {
  for (let i = 0; i < 8; i++) assert.equal(await post('/api/registro', { matricula: '99999999', email: 'a@b.mx', password: '12345678' }), 403);
  assert.equal(await post('/api/registro', { matricula: '99999999', email: 'a@b.mx', password: '12345678' }), 429);
  assert.equal(await post('/api/registro', { matricula: '24100003', email: 'm@uan.edu.mx', password: 'segura1234' }), 200, 'otra matrícula registra normal');
});

test('la matrícula se normaliza (mayúsculas y espacios) para no esquivar el límite', async () => {
  for (let i = 0; i < 8; i++) await login(i % 2 ? ' sec001 ' : 'SEC001', 'mala' + i);
  assert.equal(await login('sec001', 'x'), 429);
});

test('X-Forwarded-For se ignora si TRUST_PROXY no está activo (no se puede esquivar el límite falsificándolo)', async () => {
  for (let i = 0; i < 8; i++) assert.equal(await login('24100001', 'mala' + i, { 'X-Forwarded-For': '10.0.0.' + i }), 401);
  assert.equal(await login('24100001', 'mala', { 'X-Forwarded-For': '10.9.9.9' }), 429);
});

test('pasada la ventana de 10 minutos se vuelve a permitir', async t => {
  const now = Date.now(); t.mock.method(Date, 'now', () => now + 601e3);
  assert.equal(await login('DOC001', 'Docente2026'), 200);
});

test('los intentos mientras estás bloqueado no alargan el bloqueo (a los 10 min desde el último FALLO se libera)', async t => {
  const t0 = Date.now();
  for (let i = 0; i < 8; i++) assert.equal(await login('Z1', 'x'), 401);
  const clock = t.mock.method(Date, 'now', () => t0 + 300e3);                     // a los 5 min sigue bloqueada y la insisten
  for (let i = 0; i < 10; i++) assert.equal(await login('Z1', 'x'), 429);
  clock.mock.mockImplementation(() => t0 + 601e3);                                // a los 10 min del último fallo real ya no
  assert.equal(await login('Z1', 'x'), 401, 'ya no está bloqueada (responde 401 por contraseña mala, no 429)');
});
