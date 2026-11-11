# SAE · Construcción de la página e instalación

## 1. Cómo está construido
**Stack:** Node.js 22.5+ · Express · SQLite (módulo `node:sqlite` incluido en Node) · HTML/CSS/JavaScript sin frameworks · bcryptjs · nodemailer · qrcode.

Se eligió así porque la propuesta del proyecto pide HTML, CSS, JavaScript y base de datos SQL, y porque no requiere instalar servidor de base de datos aparte: la base es un archivo (`data/sae.db`).

### Flujo general
```
Navegador (public/index.html)
   │  fetch /api/...
   ▼
Express (server.js): sesión → permisos por rol → validación
   ▼
SQLite (data/sae.db)  +  notificaciones (SMTP o bitácora)
```

### Archivos
| Archivo | Función |
|---|---|
| `server.js` | API, sesiones, permisos, correos, QR |
| `seed.js` | Datos de demostración (padrón, docentes, horarios) |
| `public/index.html` | Interfaz completa (login, catálogo, agendar, historial, disponibilidad, QR) |
| `test/flujo.test.js` | Prueba integral automatizada |
| `docs/` | Este documento y la tesis |

### Base de datos
| Tabla | Contenido |
|---|---|
| `padron` | Matrículas válidas (valida el registro) |
| `users` | Estudiantes, docentes y secretaría (`rol`), contraseña en hash |
| `docentes` | Materias, cubículo, foto (1 a 1 con `users`) |
| `horarios` | Franjas por docente; `libre` = 1 o 0; única por docente/fecha/hora |
| `asesorias` | Estudiante, docente, horario, materia, duda, estado |
| `notificaciones` | Copia de cada correo y si se envió |

### Decisiones de diseño y seguridad
- **Registro solo con matrícula del padrón** (actividad 1.3.1). Docentes y secretaría se dan de alta desde `seed.js`.
- **Contraseñas** con bcrypt; **sesión** en cookie firmada, `httpOnly`, 8 horas; freno a fuerza bruta (8 intentos por 10 min por IP).
- **Consultas parametrizadas** (evita inyección SQL) y escape de HTML en la interfaz (evita XSS).
- **Reserva atómica:** `UPDATE horarios SET libre=0 WHERE id=? AND libre=1`; si dos estudiantes pulsan a la vez, solo uno gana.
- **Permisos por rol:** el estudiante agenda y cancela las suyas; el docente confirma, realiza o cancela las suyas; la secretaría ve todo y la bitácora.
- **Correos:** si hay SMTP configurado se envían; si no, se guardan en la bitácora con "pendiente" para que el sistema funcione igual en pruebas.

### Correspondencia con el EDT
| EDT | Dónde está |
|---|---|
| 1.3.1 Registro y acceso | `/api/registro`, `/api/login`, `padron` |
| 1.3.2 Catálogo de docentes | `/api/docentes?q=` |
| 1.3.3 Agendamiento | `/api/asesorias` (POST), `/api/horarios` |
| 1.3.4 Confirmaciones | función `notificar()`, tabla `notificaciones` |
| 1.3.5 Historial | `/api/asesorias` (GET), vista "Historial" |
| 1.2.4 Seguridad y accesibilidad | roles, cookie segura, diseño responsivo, foco visible |
| 1.4.2 Pruebas integrales | `npm test` |

## 2. Instalación local (Windows, macOS o Linux)
1. Instala **Node.js 22.5 o superior** desde https://nodejs.org (LTS reciente). Verifica: `node -v`.
2. Instala **Git** y clona el repositorio:
   ```bash
   git clone https://github.com/SASVKE666/SAE-Sistema-de-Asesorias-Estudiantil-.git
   cd SAE-Sistema-de-Asesorias-Estudiantil-
   ```
3. Instala dependencias: `npm install`
4. (Opcional) copia `.env.example` a `.env` y ajusta valores; en PowerShell puedes definirlos con `$env:SESSION_SECRET="..."`.
5. Inicia: `npm start` → abre http://localhost:3000
6. Verifica con las pruebas: `npm test` (debe mostrar 3 pruebas correctas).

**Cuentas de demostración** (cámbialas antes de publicar):
| Rol | Usuario | Contraseña |
|---|---|---|
| Estudiante | Se registra con matrícula `24100001`, `24100002` o `24100003` | La que elija |
| Docente | `DOC001`, `DOC002`, `DOC003` | `Docente2026` |
| Secretaría | `SEC001` | `Secretaria2026` |

## 3. Variables de entorno
| Variable | Para qué | Por defecto |
|---|---|---|
| `PORT` | Puerto | 3000 |
| `BASE_URL` | URL pública (la usa el QR y activa cookie `secure` si empieza con `https`) | http://localhost:PORT |
| `SESSION_SECRET` | Firma de sesiones. **Obligatorio cambiarlo en producción** | valor de ejemplo |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Correo real | sin SMTP: solo bitácora |
| `DB_FILE` | Ruta de la base | `data/sae.db` |

## 4. Puesta en producción (resumen)
1. Servidor con Node 22.5+ (VPS o hosting con Node). Dominio y **certificado SSL** (por ejemplo con Nginx + Let's Encrypt como proxy hacia el puerto 3000).
2. Define `BASE_URL=https://tu-dominio`, un `SESSION_SECRET` largo y aleatorio y las variables SMTP (el correo institucional o un servicio SMTP).
3. **Sustituye los datos de demostración:** edita `seed.js` con el padrón real y los docentes reales antes del primer arranque (o elimina `data/sae.db` y vuelve a iniciar). Cambia las contraseñas de demostración.
4. Mantén el proceso activo con `pm2 start server.js --name sae`. Respalda `data/sae.db` periódicamente.
5. Genera el QR desde la sección "Código QR" e imprímelo para carteles.

## 5. Publicar este proyecto en GitHub
```bash
git init -b main
git add .
git commit -m "SAE: primera versión (EDT hasta pruebas)"
git remote add origin https://github.com/SASVKE666/SAE-Sistema-de-Asesorias-Estudiantil-.git
git push -u origin main
```
Si GitHub pide contraseña, usa un *Personal Access Token* (Settings → Developer settings) o GitHub Desktop.

## 6. Límites conocidos y siguientes pasos
- No hay carga de fotos de docentes (se muestran iniciales); el campo `foto` ya existe en la base.
- Alta de docentes y padrón se hace por `seed.js`; un panel de administración sería la siguiente mejora.
- Sin recuperación de contraseña por correo.
- Las pruebas de aceptación con usuarios reales (1.4.3) están por realizarse.
