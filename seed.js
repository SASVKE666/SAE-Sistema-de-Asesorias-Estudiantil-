// Datos iniciales de DEMOSTRACIÓN. Sustituir el padrón y los docentes por los reales de la UA de Economía.
const bcrypt = require('bcryptjs');
module.exports = db => {
  if (db.prepare('SELECT COUNT(*) n FROM users').get().n) return;
  const run = (s, ...p) => db.prepare(s).run(...p), h = p => bcrypt.hashSync(p, 10);
  [['24100001', 'Ana Lucía Torres'], ['24100002', 'Diego Ramos Ortiz'], ['24100003', 'Marisol Pérez Cruz']].forEach(p => run('INSERT INTO padron VALUES(?,?)', ...p));
  run("INSERT INTO users(matricula,nombre,email,rol,pass_hash) VALUES('SEC001','Secretaría de Economía','secretaria@uan.edu.mx','secretaria',?)", h('Secretaria2026'));
  const docs = [['DOC001', 'Dr. Héctor Salazar', 'Microeconomía, Economía Matemática', 'Cubículo 4'],
    ['DOC002', 'Mtra. Patricia Lugo', 'Contabilidad, Finanzas Corporativas', 'Cubículo 7'], ['DOC003', 'Dr. Ramón Villaseñor', 'Estadística, Econometría', 'Cubículo 2']];
  const hoy = new Date();
  docs.forEach(([m, n, mat, cub], i) => {
    const u = run("INSERT INTO users(matricula,nombre,email,rol,pass_hash) VALUES(?,?,?,'docente',?)", m, n, `${m.toLowerCase()}@uan.edu.mx`, h('Docente2026'));
    const d = run('INSERT INTO docentes(user_id,materias,cubiculo) VALUES(?,?,?)', u.lastInsertRowid, mat, cub);
    for (let k = 1; k <= 14; k++) { const f = new Date(hoy.getTime() + k * 864e5); if ([0, 6].includes(f.getDay())) continue;
      for (const hr of ['10:00', '12:00', '16:00'].slice(0, 2 + (i % 2))) run('INSERT INTO horarios(docente_id,fecha,hora) VALUES(?,?,?)', d.lastInsertRowid, f.toISOString().slice(0, 10), hr); }
  });
  console.log('Base inicializada con datos de demostración.');
};
