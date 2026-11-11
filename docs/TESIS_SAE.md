# Sistema de Asesorías Estudiantil (SAE)
**Por qué existe, qué necesidad atiende y cómo la resuelve**

Universidad Autónoma de Nayarit · Unidad Académica de Economía · Octubre de 2026

**Integrantes:** Obed Moncada Contreras, Christian Gael Ortiz Ramírez, Lenni Naím Abarca Nava, Fabián Enrique Real Ramírez, Nerick Bryan Rodríguez Ramírez.

---

## Índice
1. Introducción · 2. Objetivos · 3. Situación problemática · 4. Antecedentes · 5. Justificación · 6. Mercado objetivo · 7. Metodología y planeación · 8. Desarrollo y pruebas · 9. Resultados: el producto · 10. Impacto · 11. Conclusión · 12. Referencias

## 1. Introducción
Las asesorías académicas son una de las estrategias de acompañamiento más directas que tiene una universidad: permiten resolver dudas específicas antes de una evaluación y reforzar lo aprendido en clase. En la Unidad Académica de Economía (UAE) de la Universidad Autónoma de Nayarit (UAN) el servicio existe: los docentes tienen carga horaria destinada a asesorías, hay horarios y formatos oficiales. Sin embargo, el servicio se usa poco porque **nadie sabe con claridad cómo, cuándo ni con quién solicitarlo**.

Este trabajo presenta el **Sistema de Asesorías Estudiantil (SAE)**, una plataforma web gratuita que concentra en un solo lugar el catálogo de docentes, su disponibilidad, el agendamiento de citas, las confirmaciones automáticas y el historial de asesorías. El documento explica el problema que le da origen, la evidencia que lo respalda, el método con que se planeó y construyó, y lo que entrega.

## 2. Objetivos
**Objetivo general.** Desarrollar una plataforma web para administrar las asesorías académicas en la UAE de la UAN, que facilite la comunicación entre estudiantes, docentes y el área administrativa, optimice el proceso de solicitud y registro de asesorías, reduzca la desinformación y fortalezca el acompañamiento académico.

**Objetivos específicos.**
1. Permitir al estudiante consultar docentes y materias, ver horarios disponibles y agendar una asesoría indicando su duda específica.
2. Dar al docente información previa de cada solicitud para que organice su tiempo y confirme o cancele la cita.
3. Enviar confirmaciones automáticas al estudiante, al docente y a la secretaría, para eliminar la falta de información.
4. Conservar un historial de asesorías que dé control administrativo y evidencia del uso de las horas asignadas.
5. Facilitar el acceso desde teléfono móvil o mediante códigos QR colocados en la facultad.

## 3. Situación problemática
El problema no es la ausencia del servicio, sino la forma en que se comunica y administra. Hoy las asesorías se gestionan de manera verbal: avisos en clase, mensajes informales o buscar al docente en su cubículo. Esto produce:

- **Desinformación:** el estudiante no sabe que puede pedir asesoría ni dónde.
- **Desorganización:** sin horario confirmado hay citas olvidadas, inasistencias y esperas en vano.
- **Falta de seguimiento:** no queda registro de qué asesorías se pidieron ni cuáles se realizaron.
- **Desaprovechamiento institucional:** las horas que la universidad ya paga para asesorías no se usan plenamente.

## 4. Antecedentes
Los documentos revisados por el equipo (SDP, encuestas, diagnóstico previo, matriz de oferta, análisis de demanda, comercialización y estudio técnico) muestran que ya existen horarios docentes, formatos oficiales y espacios de atención estudiantil, pero que **no son suficientemente visibles ni están integrados en una herramienta práctica**. SAE se plantea entonces como una capa de organización sobre recursos que la institución ya tiene, no como un servicio nuevo que deba crearse desde cero.

## 5. Justificación: la evidencia
En el primer estudio de campo se encuestó a **24 estudiantes y 12 docentes**:

| Hallazgo | Resultado |
|---|---|
| Estudiantes que han solicitado una asesoría alguna vez | 33.3 % |
| Estudiantes que nunca han asistido a una asesoría | 66.6 % |
| Desconocían el servicio o no sabían dónde se toman | 25 % |
| Falta de tiempo o dificultad para acudir | 20.8 % |
| Docentes que sí imparten asesorías | 91.7 % |
| Docentes que no las imparten (falta de tiempo o baja demanda) | 8.3 % |

**Lectura.** Casi todos los docentes ofrecen el servicio, pero dos de cada tres estudiantes nunca lo han usado. La brecha no se explica por falta de disposición docente, sino por la ausencia de un canal claro, formal y organizado. Eso es exactamente lo que SAE aporta. Conviene recordar que la muestra es pequeña (24 y 12 personas): los porcentajes son indicativos del diagnóstico y no deben generalizarse a toda la UAN.

## 6. Mercado objetivo
SAE conecta dos segmentos, según la tabla de segmentación del equipo:

| Criterio | Segmento A: estudiantes (demanda) | Segmento B: docentes (oferta) |
|---|---|---|
| Geográfico | Alumnos inscritos en la UAE, UAN (Tepic, Nayarit) | Docentes activos de la UAE |
| Demográfico | Niveles socioeconómicos variados | Profesionales de 22 a 65 años con conocimientos técnicos del área económico-administrativa |
| Psicográfico | Deseo de superación, estrés por materias complejas, búsqueda de mejor promedio para becas | Vocación de enseñanza, interés en actualizarse |
| Conductual | Buscan soluciones rápidas y personalizadas; usan tecnología para estudiar | Dispuestos a compartir conocimiento; valoran organizar su tiempo y contactar fácilmente al alumno |

## 7. Metodología y planeación
**Tipo de investigación:** descriptiva, documental y de campo. Se observó la dinámica académica, se aplicaron encuestas, se revisaron los documentos previos y se definió la propuesta: plataforma web, acceso por QR, disponibilidad docente, formulario de solicitud, confirmaciones automáticas, uso gratuito y supervisión institucional.

**Estructura de Desglose del Trabajo (EDT).** El alcance llega hasta Pruebas; Implementación y Operación quedan fuera del alcance vigente.

| Fase | Actividades |
|---|---|
| 1.1 Análisis y Documentación | Revisión de documentación · Requisitos funcionales y no funcionales · Recursos y entorno · Propuesta y validación |
| 1.2 Diseño del Sistema | Interfaz web · Base de datos · Lógica de negocio · Seguridad y accesibilidad |
| 1.3 Desarrollo del Prototipo | Registro y acceso · Catálogo de docentes · Agendamiento · Confirmaciones automáticas · Historial |
| 1.4 Pruebas | Unitarias · Integrales · Aceptación de usuario |

**Ruta crítica.** Con duraciones en días hábiles y dependencias directas, el análisis (pasada hacia adelante y hacia atrás) dio una duración total de **54 días hábiles (unas 11 semanas)**. La ruta crítica es: 1.1.1 → 1.1.2 → 1.1.4 → 1.2.2 → 1.2.4 → 1.3.1 → 1.3.3 → 1.3.4 → 1.4.1 → 1.4.2 → 1.4.3. Tienen holgura el Catálogo de Docentes (4 días), Recursos y Entorno (2), Interfaz Web (2), Lógica de Negocio (1) e Historial (1). Las duraciones y responsables son estimaciones del equipo.

**Recursos.** Tecnológicos (HTML, CSS, JavaScript, base de datos SQL, hosting, dominio, certificado SSL), humanos (estudiantes desarrolladores, docentes, personal de seguimiento) y materiales (carteles y stickers con QR).

## 8. Desarrollo y pruebas
La guía técnica detallada está en [`CONSTRUCCION_E_INSTALACION.md`](CONSTRUCCION_E_INSTALACION.md). En resumen, el prototipo se construyó con **Node.js + Express**, **SQLite** y una interfaz en **HTML, CSS y JavaScript** sin frameworks pesados, de modo que corra en un hosting modesto.

**Pruebas automatizadas realizadas** (`npm test`, ejecutadas con éxito): (1) una matrícula fuera del padrón no puede registrarse; (2) flujo completo: registro, búsqueda, agendamiento, rechazo de doble reserva del mismo horario, confirmación por el docente, imposibilidad de que el estudiante confirme su propia cita, copia a secretaría y liberación del horario al cancelar; (3) las rutas protegidas rechazan visitantes sin sesión.

**Pendiente de documentar por el equipo** (requiere datos reales): resultados de las pruebas de aceptación con estudiantes y docentes de la UAE (actividad 1.4.3), con número de participantes, observaciones y ajustes realizados.

## 9. Resultados: el producto
| Módulo | Qué resuelve | Necesidad que atiende |
|---|---|---|
| Registro y acceso | Solo entra quien tiene matrícula válida o clave de docente | Control institucional |
| Catálogo de docentes | Búsqueda por docente o materia, con cubículo y horarios libres | "No sé con quién ni dónde" |
| Agendamiento | Elegir horario, materia y duda; la reserva es atómica y evita choques | Citas olvidadas y desorden |
| Confirmaciones | Correo a estudiante, docente y copia a secretaría; bitácora de envíos | Falta de confirmación |
| Historial | Registro de asesorías por estado (pendiente, confirmada, realizada, cancelada) | Falta de seguimiento |
| Código QR | Entrada directa desde carteles de la facultad | Visibilidad del servicio |

**Resultados esperados:** mayor visibilidad del servicio, menos desorganización, mejor comunicación entre estudiante, docente y secretaría, mejor aprovechamiento de las horas asignadas y menos citas no atendidas. Son metas que deberán medirse tras la puesta en marcha (por ejemplo, comparando el 33.3 % de uso inicial contra el uso posterior).

## 10. Impacto
- **Académico:** acceso más simple y oportuno a asesorías antes de evaluaciones.
- **Administrativo:** control claro de solicitudes y asistencia mediante registros y confirmaciones.
- **Institucional:** mejor uso de recursos que la UAE ya tiene, sin costo para el estudiante.
- **Tecnológico:** el proceso se adapta a los hábitos móviles de los estudiantes.

## 11. Conclusión
SAE existe porque el problema de las asesorías en la UAE es de **comunicación y organización**, no de falta de servicio ni de docentes dispuestos. La evidencia del diagnóstico (66.6 % sin uso frente a 91.7 % de docentes que sí asesoran) respalda construir un canal único, gratuito y trazable. El prototipo cubre el alcance definido hasta pruebas; su valor real se confirmará con la aceptación de usuarios y la medición del uso tras la implementación, que son los siguientes pasos.

## 12. Referencias
*Pendiente: agregar en formato APA las fuentes que el equipo citó en su SDP, encuestas y estudios previos (normativa de la UAN sobre carga horaria y asesorías, bibliografía sobre tutoría y asesoría académica, documentación de las tecnologías usadas). No se incluyen referencias inventadas.*
