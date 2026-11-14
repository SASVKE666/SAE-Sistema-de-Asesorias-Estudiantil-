// Tope amplio por IP: contra quien prueba muchas matrículas distintas desde un mismo lugar.
process.env.DB_FILE = ':memory:'; delete process.env.TRUST_PROXY;
const test = require('node:test'), assert = require('node:assert');
const app = require('../server'); require('../seed')(app.db);
let srv, base;
const login = async (m, p) => (await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula: m, password: p }) })).status;
test.before(() => new Promise(ok => { srv = app.listen(0, () => { base = 'http://localhost:' + srv.address().port; ok(); }); }));
test.after(() => srv.close());

test('100 fallos desde una IP (matrículas distintas) frenan a esa IP, pero 99 no', async () => {
  for (let i = 0; i < 99; i++) assert.equal(await login('M' + i, 'x'), 401);
  assert.equal(await login('DOC001', 'Docente2026'), 200, 'con 99 fallos de otros todavía se puede entrar');
  assert.equal(await login('M99', 'x'), 401);                                 // fallo #100
  assert.equal(await login('DOC001', 'Docente2026'), 429, 'con 100 fallos la IP queda frenada');
});
