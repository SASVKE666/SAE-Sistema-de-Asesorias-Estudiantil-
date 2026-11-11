// Prueba integral del flujo completo (actividad 1.4.2 del EDT) con una BD temporal en memoria.
process.env.DB_FILE = ':memory:';
const test = require('node:test'), assert = require('node:assert');
const app = require('../server'); require('../seed')(app.db);
let srv, base; const jar = {};
const call = async (who, url, method = 'GET', body) => {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie: jar[who] || '' }, body: body && JSON.stringify(body) });
  const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0];
  return { status: r.status, json: await r.json() };
};
test.before(() => new Promise(ok => { srv = app.listen(0, () => { base = 'http://localhost:' + srv.address().port; ok(); }); }));
test.after(() => srv.close());

test('matrícula fuera del padrón es rechazada', async () =>
  assert.equal((await call('x', '/api/registro', 'POST', { matricula: '99999999', email: 'a@b.mx', password: '12345678' })).status, 403));
test('flujo: registro, agendar, doble reserva, confirmar, cancelar', async () => {
  assert.equal((await call('est', '/api/registro', 'POST', { matricula: '24100001', email: 'ana@uan.edu.mx', password: 'segura1234' })).status, 200);
  const docs = (await call('est', '/api/docentes?q=Estad')).json; assert.equal(docs.length, 1);
  const hs = (await call('est', `/api/docentes/${docs[0].id}/horarios`)).json;
  const r1 = await call('est', '/api/asesorias', 'POST', { horario_id: hs[0].id, materia: 'Estadística', duda: 'Intervalos de confianza' });
  assert.equal(r1.status, 200);
  assert.equal((await call('est', '/api/asesorias', 'POST', { horario_id: hs[0].id, materia: 'x', duda: 'y' })).status, 409, 'no debe permitir doble reserva');
  await call('doc', '/api/login', 'POST', { matricula: 'DOC003', password: 'Docente2026' });
  assert.equal((await call('doc', `/api/asesorias/${r1.json.id}`, 'PATCH', { estado: 'confirmada' })).status, 200);
  assert.equal((await call('est', `/api/asesorias/${r1.json.id}`, 'PATCH', { estado: 'confirmada' })).status, 400, 'el estudiante no confirma');
  await call('sec', '/api/login', 'POST', { matricula: 'SEC001', password: 'Secretaria2026' });
  assert.ok((await call('sec', '/api/notificaciones')).json.length >= 6, 'estudiante, docente y secretaría reciben copia');
  assert.equal((await call('est', `/api/asesorias/${r1.json.id}`, 'PATCH', { estado: 'cancelada' })).status, 200);
  assert.equal((await call('est', `/api/docentes/${docs[0].id}/horarios`)).json.length, hs.length, 'el horario se libera');
});
test('rutas protegidas', async () => assert.equal((await call('anon', '/api/asesorias')).status, 401));
