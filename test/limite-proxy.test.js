// Con TRUST_PROXY=1 (Nginx delante) el límite usa la IP real que manda el proxy en X-Forwarded-For.
process.env.DB_FILE = ':memory:'; process.env.TRUST_PROXY = '1';
const test = require('node:test'), assert = require('node:assert');
const app = require('../server'); require('../seed')(app.db);
let srv, base;
const login = async (m, p, ip) => (await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ matricula: m, password: p }) })).status;
test.before(() => new Promise(ok => { srv = app.listen(0, () => { base = 'http://localhost:' + srv.address().port; ok(); }); }));
test.after(() => srv.close());

test('detrás del proxy cada IP real lleva su propia cuenta de fallos', async () => {
  for (let i = 0; i < 8; i++) assert.equal(await login('DOC001', 'mala' + i, '201.1.1.1'), 401);
  assert.equal(await login('DOC001', 'mala', '201.1.1.1'), 429, 'la IP 201.1.1.1 queda frenada para esa matrícula');
  assert.equal(await login('DOC001', 'Docente2026', '201.2.2.2'), 200, 'la misma matrícula desde otra IP real no está frenada');
});
