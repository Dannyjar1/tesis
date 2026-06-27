# 📚 PROJECT.md — Documentación Técnica del Sistema

---

# Aplicación Web con Inteligencia Artificial para la Gestión y Seguimiento de Actividades del Personal Docente y Administrativo
## Universidad Internacional del Ecuador — Campus Loja

| Campo | Detalle |
|---|---|
| **Autor** | Danny Francisco Jaramillo Guachón |
| **Email** | dajaramillogu@uide.edu.ec |
| **Universidad** | Universidad Internacional del Ecuador (UIDE) — Campus Loja |
| **Carrera** | Ingeniería en Tecnologías de la Información |
| **Metodología** | SCRUM (desarrollo iterativo e incremental) |
| **Marco normativo** | LOES (Reforma 2024), Reglamento CES 2021 (RPC-SE-19-No.055-2021), CACES |
| **Estado** | Sprint 5-6 en curso — Mayo 2026 |

---

## TABLA DE CONTENIDOS

1. [Descripción General](#1-descripción-general)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Requerimientos Funcionales](#3-requerimientos-funcionales)
4. [Requerimientos No Funcionales](#4-requerimientos-no-funcionales)
5. [Vistas Principales del Sistema](#5-vistas-principales-del-sistema)
6. [Módulos del Sistema](#6-módulos-del-sistema)
7. [Reglas de Negocio](#7-reglas-de-negocio)
8. [Reglas de Cálculo del Distributivo Académico](#8-reglas-de-cálculo-del-distributivo-académico)
9. [Colecciones de Base de Datos](#9-colecciones-de-base-de-datos)
10. [Métricas de Evaluación](#10-métricas-de-evaluación-del-sistema)
    - [Datos de validación — instrumentos aplicados](#-datos-de-validación--instrumentos-aplicados)
11. [Plan de Sprints](#11-plan-de-sprints-scrum)
12. [Correcciones y Decisiones Técnicas](#12-correcciones-y-decisiones-técnicas)
13. [Dependencias y Tecnologías](#13-dependencias-y-tecnologías)
14. [Glosario](#14-glosario)

---

## 1. 📌 DESCRIPCIÓN GENERAL

### Propósito del Sistema

Este sistema es una aplicación web institucional desarrollada como trabajo de titulación de pregrado, cuyo propósito es **automatizar la generación, gestión y seguimiento del distributivo académico** del personal docente y administrativo de la Universidad Internacional del Ecuador (UIDE), campus Loja, mediante el uso de inteligencia artificial aplicada al procesamiento de lenguaje natural en español.

### Problema que Resuelve

Actualmente, la UIDE campus Loja gestiona el distributivo académico y la matriz de productividad de forma **completamente manual**, utilizando hojas de cálculo en Excel y documentos Word que se comparten por Google Drive. Este proceso genera:

- Errores frecuentes en el cálculo de las 40 horas semanales obligatorias por docente
- Pérdida de tiempo significativa en tareas administrativas repetitivas
- Falta de visibilidad en tiempo real del cumplimiento docente
- Dificultad para generar reportes de acreditación para el CACES
- Inconsistencias en la asignación de actividades por categoría
- Ausencia de alertas ante incumplimientos del distributivo

El 53% del personal docente dedica entre 12 y 20 horas semanales a actividades administrativas, y el 82% considera insuficiente el tiempo disponible para cumplir sus objetivos académicos (Villa Villa et al., 2025).

### Actores Principales

El sistema define **4 niveles de rol** jerárquicos. El rol `docente` es la base de todos los usuarios; director, coordinador y admin añaden permisos sobre esa base.

| Nivel | Rol | Actor representativo | Alcance |
|---|---|---|---|
| 1 | `admin` | Pro-Rector (Pro Rectorado Ext. Loja) | Todas las carreras, todos los períodos, configuración global |
| 2 | `director` | Director/a de Carrera | Solo su carrera: gestiona docentes, distributivos y períodos |
| 3 | `coordinador` | Coordinador/a Académico/a | Solo su carrera: gestión de usuarios y reportes, sin aprobación |
| 4 | `docente` | Docente (TC / MT / TP / Honorario) | Solo sus propios datos: distributivo, actividades, horario |

> **Nota:** El tipo de contrato (TC, MT, TP, Honorario) es un atributo del usuario (`tipo_contrato`), no un rol separado del sistema. Un docente puede tener contrato `tiempo_completo`, `medio_tiempo`, `tiempo_parcial` o `honorario` y sigue teniendo el mismo rol `docente` en el sistema.

### Carreras — UIDE Campus Loja

| ID de carrera | Nombre oficial | Escuela |
|---|---|---|
| `administracion-empresas` | Administración de Empresas | — |
| `arquitectura` | Arquitectura | — |
| `derecho` | Derecho | — |
| `sistemas-informacion` | Ingeniería en Sistemas de la Información | Escuela de Tecnologías de la Información |
| `psicologia-clinica` | Psicología Clínica | — |
| `marketing` | Marketing | — |
| `negocios-internacionales` | Negocios Internacionales | — |

### Usuarios de Prueba — Ingeniería en Sistemas de la Información

> Estos son los únicos usuarios de prueba autorizados. No agregar usuarios ficticios fuera de esta lista.

| Rol | Nombre completo | Correo institucional | Tipo contrato |
|---|---|---|---|
| `admin` | Pablo Ruiz Aguirre | paruizag@uide.edu.ec | — (cargo directivo: Pro-Rector) |
| `director` | Lorena Elizabeth Conde Zhingre | locondezh@uide.edu.ec | `tiempo_completo` |
| `coordinador` | Darío Javier Valarezo León | davalarezole@uide.edu.ec | `tiempo_completo` |
| `docente` | Milton Ricardo Palacios Morocho | mipalaciosmo@uide.edu.ec | `tiempo_completo` |
| `docente` | Yeferson Mauricio Torres Berru | yetorresbe@uide.edu.ec | `medio_tiempo` |


### Contexto Normativo

El sistema se alinea con los siguientes marcos regulatorios vigentes:

- **LOES (Reforma 2024):** Ley Orgánica de Educación Superior — establece la obligatoriedad de las funciones sustantivas
- **Reglamento CES 2021 (RPC-SE-19-No.055-2021):** Arts. 6, 7 y 8 — regulan la distribución de la carga horaria docente
- **CACES:** Consejo de Aseguramiento de la Calidad — exige evidencia documentada del cumplimiento académico

### Beneficios Esperados

- Reducción del 80% del tiempo invertido en generación manual del distributivo
- Eliminación de errores de cálculo en la distribución de las 40 horas semanales
- Dashboard de cumplimiento en tiempo real para autoridades académicas
- Reportes automáticos listos para procesos de acreditación CACES
- Clasificación automática de actividades docentes mediante IA con precisión ≥ 80%
- Alertas proactivas ante incumplimientos del distributivo académico

> 📝 **Nota de implementación:** El sistema debe desplegarse en Firebase Hosting bajo el dominio institucional de la UIDE. Coordinar con el área de TIC del campus Loja para configurar el proveedor de identidad Microsoft Azure AD con las cuentas @uide.edu.ec antes de iniciar el desarrollo del módulo de autenticación.

---

## 2. 🗂️ ESTRUCTURA DE CARPETAS

```plaintext
uide-distributivo-app/
│
├── 📁 public/                          # Archivos estáticos públicos
│   ├── index.html                      # Punto de entrada HTML
│   ├── favicon.ico                     # Ícono del sistema
│   └── manifest.json                   # Configuración PWA
│
├── 📁 src/                             # Código fuente React (SPA)
│   │
│   ├── 📁 assets/                      # Recursos estáticos (imágenes, íconos, logos)
│   │   ├── logo-uide.png
│   │   └── icons/
│   │
│   ├── 📁 components/                  # Componentes reutilizables globales
│   │   ├── Navbar.jsx                  # Barra de navegación con rol del usuario
│   │   ├── Sidebar.jsx                 # Menú lateral por rol
│   │   ├── icons.jsx                   # Set compartido de íconos SVG (sin emojis en UI)
│   │   ├── LoadingSpinner.jsx          # Indicador de carga
│   │   ├── AlertBanner.jsx             # Banners de alerta de incumplimiento
│   │   ├── Modal.jsx                   # Modal genérico con efecto Liquid Glass (fondo desenfocado + oscurecido)
│   │   └── NotificationBell.jsx        # Campana de notificaciones
│   │
│   ├── 📁 modules/                     # Módulos funcionales del sistema
│   │   │
│   │   ├── 📁 auth/                    # MOD-01: Autenticación
│   │   │   ├── LoginPage.jsx           # Página de inicio de sesión Microsoft
│   │   │   ├── AuthContext.jsx         # Contexto global de autenticación
│   │   │   ├── useAuth.js              # Hook personalizado de autenticación
│   │   │   └── RoleGuard.jsx           # Componente de control de acceso por rol
│   │   │
│   │   ├── 📁 dashboard/               # MOD-05: Dashboard e indicadores
│   │   │   ├── DashboardPage.jsx       # Página principal del panel de control
│   │   │   ├── DocenteCard.jsx         # Tarjeta de cumplimiento por docente
│   │   │   ├── CumplimientoChart.jsx   # Gráfico de cumplimiento de horas
│   │   │   ├── AlertasPanel.jsx        # Panel de alertas activas
│   │   │   └── ResumenHoras.jsx        # Resumen de horas por categoría
│   │   │
│   │   ├── 📁 distributivo/            # MOD-02: Gestión del distributivo
│   │   │   ├── DistributivoPage.jsx    # Vista personal del docente (Mi Distributivo)
│   │   │   ├── GestionDistributivoPage.jsx # Vista de gestión para Director/Coordinador
│   │   │   ├── DistributivoForm.jsx    # Formulario de creación/edición (se abre en Modal)
│   │   │   ├── DistributivoTable.jsx   # Tabla de actividades del distributivo
│   │   │   ├── CalendarioDistributivo.jsx # Vista gráfica semanal L–S, 07:00–22:00 con bloques por actividad
│   │   │   ├── CalculoHoras.js         # Lógica de cálculo automático de horas
│   │   │   ├── ValidacionDistributivo.js # Validaciones de las 40h y detección de cruces horarios
│   │   │   └── PeriodoSelector.jsx     # Selector de período académico activo
│   │   │
│   │   ├── 📁 calendario/              # MOD-03: Sincronización calendarios
│   │   │   ├── CalendarioPage.jsx      # Vista de agenda del docente
│   │   │   ├── SyncOutlookButton.jsx   # Botón de sincronización Outlook
│   │   │   ├── EventoCard.jsx          # Tarjeta de evento con clasificación IA
│   │   │   └── CalendarioConfig.jsx    # Configuración de permisos de calendario
│   │   │
│   │   ├── 📁 ia/                      # MOD-04: Clasificación IA con NLP
│   │   │   ├── ClasificacionPage.jsx   # Panel de clasificación de actividades
│   │   │   ├── EventoClasificado.jsx   # Componente de evento con etiqueta IA
│   │   │   ├── CorreccionManual.jsx    # Interfaz de corrección manual
│   │   │   └── FeedbackPanel.jsx       # Panel de retroalimentación al modelo
│   │   │
│   │   ├── 📁 reportes/                # MOD-06: Reportes y exportación
│   │   │   ├── ReportesPage.jsx        # Página de generación de reportes
│   │   │   ├── ReportePDF.jsx          # Componente de reporte en PDF con plantilla institucional
│   │   │   ├── ReporteExcel.jsx        # Exportación a Excel
│   │   │   ├── PrevisualizacionPDF.jsx # Pantalla de previsualización y edición antes de descargar
│   │   │   └── FiltrosReporte.jsx      # Filtros por período, docente, carrera
│   │   │
│   │   ├── 📁 notificaciones/          # MOD-07: Notificaciones automáticas
│   │   │   ├── NotificacionesPage.jsx  # Bandeja de notificaciones
│   │   │   └── NotificacionItem.jsx    # Item individual de notificación
│   │   │
│   │   ├── 📁 admin/                   # MOD-08: Administración del sistema
│   │   │   ├── AdminPage.jsx           # Panel de administración
│   │   │   ├── UsuariosTable.jsx       # Gestión de usuarios y roles
│   │   │   ├── PeriodosAdmin.jsx       # Gestión de períodos: crear, activar, cerrar
│   │   │   ├── HistorialPeriodos.jsx   # Vista navegable de últimos 5 períodos con sus datos
│   │   │   ├── AuditoriaLog.jsx        # Historial de cambios del sistema
│   │   │   └── ConfiguracionSistema.jsx # Configuración general
│   │   │
│   │   ├── 📁 misactividades/          # MOD-09: Mis Actividades — Tablero Kanban
│   │   │   ├── MisActividadesPage.jsx  # Página principal con toggle Tablero | Estadísticas
│   │   │   ├── KanbanColumna.jsx       # Columna Kanban con drag & drop nativo HTML5
│   │   │   ├── ActividadCard.jsx       # Tarjeta de actividad; edición en Modal Liquid Glass
│   │   │   └── ActividadForm.jsx       # Formulario de creación/edición de actividad
│   │   │
│   │   └── 📁 planet/                  # MOD-10: Resumen visual — componentes reutilizables
│   │       ├── PlanetCategoria.jsx     # Bloque visual de progreso por categoría CES
│   │       └── PlanetSemanaChart.jsx   # Gráfico de actividades acumuladas por semana
│   │
│   ├── 📁 services/                    # Servicios de comunicación con Firebase
│   │   ├── firebase.js                 # Configuración e inicialización Firebase
│   │   ├── authService.js              # Servicio de autenticación Microsoft
│   │   ├── distributivoService.js      # CRUD del distributivo en Firestore
│   │   ├── actividadesService.js       # Gestión de actividades
│   │   ├── calendarioService.js        # Integración Microsoft Graph API
│   │   ├── iaService.js                # Llamadas a Cloud Functions de clasificación
│   │   ├── reportesService.js          # Generación y descarga de reportes
│   │   ├── notificacionesService.js    # Gestión de notificaciones push
│   │   ├── misActividadesService.js    # CRUD de actividades del módulo Mis Actividades
│   │   ├── periodoService.js           # Gestión de períodos: crear, activar, cerrar, historial
│   │   ├── horarioService.js           # Gestión de bloques de horario semanal por docente
│   │   └── outlookLabelsService.js     # Extracción de correos etiquetados Outlook (DIST/*)
│   │
│   ├── 📁 hooks/                       # Hooks personalizados de React
│   │   ├── useDistributivo.js          # Hook para gestión del distributivo
│   │   ├── useCalendario.js            # Hook para sincronización Outlook
│   │   ├── useNotificaciones.js        # Hook para notificaciones en tiempo real
│   │   └── useReportes.js              # Hook para generación de reportes
│   │
│   ├── 📁 context/                     # Contextos globales de React
│   │   ├── AuthContext.jsx             # Estado global de autenticación y rol
│   │   ├── PeriodoContext.jsx          # Período académico activo global
│   │   └── NotificacionContext.jsx     # Estado global de notificaciones
│   │
│   ├── 📁 utils/                       # Funciones utilitarias reutilizables
│   │   ├── calculos.js                 # Fórmulas de cálculo del distributivo
│   │   ├── validaciones.js             # Validadores de formularios y horas
│   │   ├── formatters.js               # Formateadores de fechas y horas
│   │   ├── constants.js                # Constantes del sistema (roles, categorías)
│   │   └── exportPDF.js                # Utilidad de generación PDF con pdfmake
│   │
│   ├── 📁 router/                      # Configuración de rutas React Router
│   │   └── AppRouter.jsx               # Rutas protegidas por rol
│   │
│   ├── App.jsx                         # Componente raíz de la aplicación
│   ├── main.jsx                        # Punto de entrada React (Vite)
│   └── index.css                       # Estilos globales Tailwind CSS
│
├── 📁 functions/                       # Firebase Cloud Functions (Python)
│   │
│   ├── 📁 clasificacion/               # MOD-04: Clasificación NLP con BETO
│   │   ├── main.py                     # Función principal de clasificación
│   │   ├── modelo_beto.py              # Carga y uso del modelo BETO
│   │   ├── preprocesamiento.py         # Pipeline de preprocesamiento de texto
│   │   └── categorias.py               # Definición de categorías y etiquetas
│   │
│   ├── 📁 calendario/                  # Sincronización Microsoft Graph API
│   │   ├── sync_outlook.py             # Función de sincronización de eventos
│   │   ├── graph_client.py             # Cliente HTTP para Microsoft Graph API
│   │   └── token_manager.py            # Manejo de tokens OAuth 2.0
│   │
│   ├── 📁 notificaciones/              # Envío automático de alertas
│   │   ├── alertas_cumplimiento.py     # Función de alertas por incumplimiento
│   │   └── email_sender.py             # Envío de correos institucionales
│   │
│   ├── 📁 reportes/                    # Generación de reportes en backend
│   │   └── generar_reporte.py          # Generación de reportes PDF/Excel
│   │
│   ├── requirements.txt                # Dependencias Python de Cloud Functions
│   └── .env.functions                  # Variables de entorno para Cloud Functions
│
├── 📁 docs/                            # Documentación del proyecto
│   ├── PROJECT.md                      # Este archivo — documentación técnica
│   ├── REFERENCIA_DESARROLLO.md        # Referencia rápida para desarrollo
│   ├── INSTRUMENTOS/                   # Instrumentos de investigación aplicados
│   │   ├── entrevista_semiestructurada.docx
│   │   └── encuesta_docentes.pdf
│   └── diagramas/                      # Diagramas de arquitectura y flujos
│       ├── arquitectura_sistema.png
│       ├── modelo_datos_firestore.png
│       └── flujo_clasificacion_ia.png
│
├── 📁 tests/                           # Pruebas del sistema
│   ├── 📁 unit/                        # Pruebas unitarias
│   │   ├── calculos.test.js            # Tests de fórmulas del distributivo
│   │   └── validaciones.test.js        # Tests de validaciones
│   ├── 📁 integration/                 # Pruebas de integración
│   │   └── auth.test.js                # Tests de autenticación
│   └── 📁 e2e/                         # Pruebas end-to-end
│       └── distributivo.e2e.js         # Flujo completo del distributivo
│
├── firestore.rules                     # Reglas de seguridad de Firestore
├── firestore.indexes.json              # Índices compuestos de Firestore
├── firebase.json                       # Configuración de Firebase CLI
├── .firebaserc                         # Proyecto Firebase vinculado
├── .env.example                        # Variables de entorno de ejemplo
├── .env.local                          # Variables de entorno locales (no commitear)
├── .gitignore                          # Archivos ignorados por Git
├── vite.config.js                      # Configuración de Vite (bundler)
├── tailwind.config.js                  # Configuración de Tailwind CSS
├── package.json                        # Dependencias y scripts npm
└── README.md                           # Descripción general del repositorio
```

> 📝 **Nota de implementación:** El archivo `.env.local` y `.env.functions` NUNCA deben subirse al repositorio. Asegúrate de que `.gitignore` los incluya. Usa `.env.example` como plantilla documentada con los nombres de las variables pero sin valores reales.

---

## 3. ✅ REQUERIMIENTOS FUNCIONALES (IEEE 830)

### 3.1 Tabla de Requerimientos Funcionales

| ID | Nombre | Descripción | Prioridad | Módulo |
|---|---|---|---|---|
| RF-001 | Autenticación Microsoft OAuth 2.0 | El sistema debe permitir el inicio de sesión exclusivamente mediante cuentas institucionales @uide.edu.ec a través del proveedor Microsoft Azure AD con flujo OAuth 2.0. | Alta | MOD-01 |
| RF-002 | Gestión de roles de usuario | El sistema debe asignar y gestionar 4 niveles de rol: `admin` (Pro-Rector, acceso global), `director` (su carrera, aprueba distributivos), `coordinador` (su carrera, solo lectura en distributivos), `docente` (sus propios datos). El tipo de contrato (tiempo_completo/medio_tiempo/tiempo_parcial/honorario) es un atributo del usuario, no un rol separado. Cada director y coordinador está vinculado a exactamente una carrera mediante `carrera_id`. | Alta | MOD-01 |
| RF-003 | Cierre de sesión seguro | El sistema debe permitir el cierre de sesión revocando el token de autenticación activo e invalidando la sesión en Firebase Authentication. | Alta | MOD-01 |
| RF-004 | Creación del distributivo académico | El sistema debe permitir al Director crear el distributivo académico para cada docente por período, asignando actividades en las cuatro categorías oficiales: DOCENCIA (incluye tutorías como subcategoría 1.2), INVESTIGACIÓN, VINCULACIÓN CON LA SOCIEDAD y GESTIÓN ACADÉMICA. | Alta | MOD-02 |
| RF-005 | Edición del distributivo académico | El sistema debe permitir editar el distributivo en estado borrador. Una vez aprobado, solo el Director puede realizar modificaciones registradas en auditoría. | Alta | MOD-02 |
| RF-006 | Visualización del distributivo por docente | Cada docente debe poder visualizar únicamente su propio distributivo activo del período vigente, con el desglose de horas por actividad y categoría. | Alta | MOD-02 |
| RF-007 | Cálculo automático de horas de tutoría | El sistema debe calcular automáticamente las horas de tutoría según el número de materias: 1h para 1-2 materias, 2h para 3-4 materias, 3h para 5-6 materias, conforme al Reglamento CES 2021. | Alta | MOD-02 |
| RF-008 | Cálculo automático de preparación de clases | El sistema debe calcular automáticamente las horas de preparación equivalentes al 60% de las horas de docencia directa asignadas al docente en el período. | Alta | MOD-02 |
| RF-009 | Cálculo automático de horas de vinculación | El sistema debe calcular automáticamente las horas de vinculación: 1h por cada 10 estudiantes en prácticas comunitarias y 1h por cada 15 estudiantes en PPP. | Alta | MOD-02 |
| RF-010 | Horas de titulación dentro de Gestión Académica | Las actividades de dirección/tribunal de titulación NO son un bloque propio: forman parte de GESTIÓN ACADÉMICA, subcategoría 4.9 (Tutores, Lectores y Grados). El director registra estas horas en ese bloque. | Alta | MOD-02 |
| RF-011 | Validación de cierre del distributivo | El sistema debe validar que la suma total de horas de todas las actividades del distributivo sea exactamente igual a las horas del contrato (40h TC, 20h MT) antes de permitir su aprobación. | Alta | MOD-02 |
| RF-012 | Gestión de períodos académicos | El sistema debe permitir crear, activar y cerrar períodos académicos con nombre personalizado, fecha de inicio y fecha de fin. Solo puede existir un período en estado activo simultáneamente. Cada período gestiona su propia lista de docentes, distributivos y actividades de forma completamente independiente de otros períodos. | Alta | MOD-02, MOD-08 |
| RF-013 | Autorización individual de calendario | El sistema debe permitir al docente autorizar individualmente el acceso a su calendario Microsoft 365/Outlook mediante flujo OAuth 2.0 sin requerir permisos administrativos institucionales. | Alta | MOD-03 |
| RF-014 | Sincronización automática de eventos Outlook | El sistema debe sincronizar automáticamente los eventos del calendario Outlook del docente (título, descripción, fecha, hora, duración) con el módulo de seguimiento de actividades mediante Microsoft Graph API. | Alta | MOD-03 |
| RF-015 | Clasificación automática de actividades con IA | El sistema debe clasificar automáticamente cada evento sincronizado del calendario en una de las cuatro categorías oficiales del distributivo utilizando el modelo BETO de procesamiento de lenguaje natural en español. | Alta | MOD-04 |
| RF-016 | Corrección manual de clasificación IA | El sistema debe permitir al docente revisar y corregir manualmente la categoría asignada por la IA a cada evento, registrando la corrección en la colección de feedback para el reentrenamiento del modelo. | Media | MOD-04 |
| RF-017 | Dashboard de cumplimiento en tiempo real | El sistema debe presentar un panel de control con indicadores en tiempo real: porcentaje de cumplimiento por docente, distribución de horas por categoría, alertas activas y estado del distributivo por carrera. | Alta | MOD-05 |
| RF-018 | Generación de reportes exportables en PDF | El sistema debe generar reportes de cumplimiento del distributivo exportables en formato PDF con formato institucional UIDE que incluya: encabezado con logo UIDE y campus, datos del docente (nombre, tipo de contrato, carrera, período académico), tabla de actividades por categoría CES con horas, sección de firmas de validación cruzada (Directora + Docente) y código único de verificación para auditoría CACES (conforme RN-017). | Alta | MOD-06 |
| RF-019 | Notificaciones automáticas de incumplimiento | El sistema debe enviar notificaciones automáticas al Coordinador cuando el porcentaje de cumplimiento semanal de un docente caiga por debajo del umbral configurado (por defecto 80%). | Media | MOD-07 |
| RF-020 | Administración de usuarios y roles | El sistema debe permitir al Administrador crear, editar, activar y desactivar cuentas de usuario, asignando el rol correspondiente según la categoría del personal. | Alta | MOD-08 |
| RF-021 | Registro de auditoría de cambios | El sistema debe registrar automáticamente en la colección de auditoría cada modificación realizada al distributivo: quién realizó el cambio, qué campo se modificó, valor anterior y valor nuevo, con marca de tiempo. | Alta | MOD-08 |
| RF-022 | Archivado de distributivos históricos | El sistema debe permitir archivar distributivos de períodos anteriores para consulta histórica sin posibilidad de eliminación permanente, garantizando la trazabilidad documental. | Media | MOD-02 |
| RF-023 | Extracción de actividades desde etiquetas Outlook | El sistema debe leer los correos etiquetados por el docente en Outlook con la nomenclatura DIST/* (DIST/Docencia, DIST/Investigación, DIST/Vinculación, DIST/Gestión, DIST/TP-Horas) mediante Microsoft Graph API y registrar automáticamente las actividades correspondientes en Firestore. Esta funcionalidad reemplaza cualquier integración de Gmail. | Alta | MOD-03 |
| RF-024 | Gestión de tareas en módulo To Do interno | El sistema debe ofrecer un módulo propio de gestión de tareas pendientes donde el docente cree, edite, complete y elimine tareas ligadas a sus actividades del distributivo. Cada tarea debe incluir: título, categoría CES, fecha límite y estado (pendiente/completada). Las tareas deben sincronizarse con la colección /actividades en Firestore. | Media | MOD-09 |
| RF-025 | Vista de resumen visual por categoría en módulo Planet | El sistema debe presentar un módulo visual de resumen semanal (Planet) que muestre las horas acumuladas por cada categoría oficial (Docencia, Investigación, Vinculación con la Sociedad, Gestión Académica) en formato de bloques visuales por semana. Es un módulo interno del sistema, no una integración externa. | Media | MOD-10 |
| RF-026 | Control de horas para docentes Tiempo Parcial | El sistema debe restringir el ingreso de horas para docentes TP a valores enteros con un máximo de 12 horas semanales sin autorización. Si el docente ingresa más de 12 horas, el sistema debe bloquear el guardado y activar un flujo de autorización en dos niveles: Nivel 1 (Directora de Carrera) y Nivel 2 (Autoridad Superior), donde el Nivel 2 solo se habilita si el Nivel 1 ya aprobó. | Alta | MOD-02 |
| RF-027 | Validación cruzada del distributivo | El sistema debe implementar una validación cruzada donde el distributivo quede en estado "aprobado" únicamente cuando tanto la Directora de Carrera como el docente propietario hayan confirmado su revisión. Si cualquiera de los dos observa el distributivo, este regresa automáticamente a estado "en_revision". | Alta | MOD-02 |
| RF-028 | Vista gráfica semanal del distributivo (horario) | El sistema debe presentar una vista de horario gráfico tipo calendario semanal (lunes a sábado, 07:00–22:00) donde se visualicen las actividades del docente distribuidas en bloques de tiempo. La franja 13:00–14:00 (almuerzo) debe estar bloqueada visualmente y no ser asignable. El director puede cambiar de docente; el docente ve solo el propio. | Alta | MOD-02 |
| RF-029 | Creación de distributivo desde interfaz mediante Modal | El sistema debe permitir al Director crear un nuevo distributivo para cualquier docente del período activo desde la interfaz web, a través de un Modal con efecto Liquid Glass, sin necesidad de navegar a una página separada. | Alta | MOD-02 |
| RF-030 | Previsualización editable obligatoria antes de descarga PDF/Excel | El sistema debe mostrar siempre una pantalla de previsualización del reporte antes de la descarga definitiva, tanto para el Director como para el docente. En esta pantalla se puede editar el contenido visible antes de generar el archivo final. La descarga solo ocurre después de que el usuario confirma la previsualización. | Alta | MOD-06 |
| RF-031 | Historial navegable de períodos académicos | El sistema debe mostrar los últimos 5 períodos académicos en la sección de historial/reportes de forma estándar, permitiendo al Director seleccionar cualquier período pasado para ver sus distributivos, docentes asignados y estadísticas de cumplimiento en modo solo lectura. | Alta | MOD-08 |
| RF-032 | Creación automática del período siguiente al finalizar el activo | Al cerrar o finalizar el período activo, el sistema debe crear automáticamente el siguiente período en estado "Próximo", completamente vacío (sin docentes, sin distributivos, sin actividades). El Director configura manualmente el nombre, fechas y docentes del nuevo período. | Alta | MOD-08 |
| RF-033 | Independencia de datos entre períodos | Cada período académico debe gestionar su propia lista de docentes, distributivos y actividades de forma completamente independiente. Los docentes asignados a un período no se transfieren automáticamente al siguiente. | Alta | MOD-02, MOD-08 |
| RF-034 | Descarga del propio PDF por el docente | El sistema debe permitir al docente descargar el PDF de su propio distributivo activo con formato institucional UIDE, con previsualización obligatoria previa. Esta acción está disponible desde la vista "Mi Distributivo". | Media | MOD-06 |
| RF-035 | Modales con Liquid Glass para todos los formularios | Todos los formularios del sistema (crear actividad, agregar docente, asignar período, crear distributivo, etc.) deben abrirse en Modales con efecto Liquid Glass (fondo desenfocado y oscurecido). Este patrón aplica a todos los roles y vistas del sistema. | Media | Transversal |
| RF-036 | Tablero Kanban con vista Estadísticas integrada | El módulo Mis Actividades debe presentar un tablero Kanban de tres columnas (Por hacer, En progreso, Completadas) con cambio de estado por drag and drop, y una vista de Estadísticas que muestre KPIs globales, progreso por categoría CES y gráfico semanal. Ambas vistas se alimentan del mismo estado React sin fetch adicional (RN-027). | Media | MOD-09 |
| RF-037 | Plan de mejoras por incumplimiento de horas | Cuando un docente no cumple las horas asignadas en su distributivo, el sistema debe registrar un **plan de mejoras** formal asociado al docente y al período, con fecha de registro, fecha compromiso de subsanación y responsable de seguimiento. No se limita a una notificación: genera un registro accionable y verificable en el sistema. | Alta | MOD-05, MOD-07 |
| RF-038 | Notificaciones in-app o WhatsApp asistidas por IA | El sistema debe enviar avisos de actividades pendientes y fechas límite al docente mediante notificaciones in-app y/o WhatsApp asistidas por IA. La modalidad definitiva (in-app, WhatsApp o ambas) queda **pendiente de decisión institucional**. | Media | MOD-07 |
| RF-039 | Módulo de ayuda por rol (/ayuda) | El sistema debe ofrecer un módulo `/ayuda` con preguntas frecuentes (FAQ), guías y tutoriales segmentados por rol (Admin, Director, Coordinador, Docente), presentados como **acordeones desplegables por sección**. | Media | Transversal |
| RF-040 | Diferenciación visual por rol y área en el panel de control | El panel de control debe diferenciar visualmente los bloques según el rol y el área del usuario, de modo que cada rol (Admin, Director, Coordinador, Docente) vea una composición de bloques visualmente distinta y adaptada a sus funciones. | Media | MOD-05 |
| RF-041 | Registro de actividades imprevistas con anticipación mínima | El sistema debe permitir registrar actividades imprevistas validando un mínimo de **2 semanas de anticipación** entre la fecha de registro y la fecha de ejecución de la actividad. Si no se cumple la anticipación mínima, el sistema bloquea el registro. | Media | MOD-09 |
| RF-042 | Docentes compartidos entre carreras | El sistema debe permitir que un docente sea asignado en más de una carrera, garantizando que la **suma de horas en todas sus carreras no supere el límite total** de su contrato. No se debe duplicar la carga horaria entre carreras. | Alta | MOD-02 |
| RF-043 | Matriz de Productividad como paso previo al distributivo | El sistema debe gestionar una **Matriz de Productividad** previa al distributivo. La carga de investigación llega **pre-asignada desde Rectorado** y es de **solo lectura para todos los roles excepto Admin**. El distributivo solo puede elaborarse a partir de una Matriz de Productividad aprobada. | Alta | MOD-02 |
| RF-044 | Notificación formal de incumplimiento vía Outlook u oficio | Ante un incumplimiento, el sistema debe permitir emitir una notificación formal al docente, ya sea por correo institucional Outlook (Microsoft Graph API) o mediante un oficio registrado y archivado en el sistema para respaldo documental. | Media | MOD-07, MOD-03 |
| RF-045 | Vista de reportes globales consolidados | El sistema debe ofrecer una vista consolidada con todos los docentes de la carrera, disponible de forma inmediata, sin tiempos de espera perceptibles para el usuario. | Alta | MOD-05, MOD-06 |

> 📝 **Nota de implementación:** Los requerimientos RF-007 al RF-010 deben implementarse como funciones puras en `src/utils/calculos.js` con pruebas unitarias obligatorias. Cada fórmula debe estar documentada con JSDoc indicando la referencia al artículo del Reglamento CES 2021 correspondiente.

---

## 4. 🔒 REQUERIMIENTOS NO FUNCIONALES

| ID | Categoría | Descripción | Métrica / Criterio |
|---|---|---|---|
| RNF-001 | Rendimiento | El dashboard principal debe cargar y renderizar todos los indicadores de cumplimiento en tiempo real. | Tiempo de respuesta ≤ 3 segundos para hasta 50 usuarios concurrentes |
| RNF-002 | Rendimiento | El sistema debe obtener una puntuación mínima en la herramienta Lighthouse de Google para la métrica de rendimiento. | Lighthouse Performance Score ≥ 85 |
| RNF-003 | Disponibilidad | El sistema debe mantenerse operativo de forma continua aprovechando la infraestructura serverless de Firebase Hosting con alta disponibilidad. | Uptime mensual ≥ 98% (objetivo ideal ≥ 99.5%) |
| RNF-004 | Seguridad | Todos los datos transmitidos entre el cliente React y los servicios Firebase deben estar cifrados en tránsito con protocolo TLS. | TLS 1.2 o superior en todas las comunicaciones |
| RNF-005 | Seguridad | Los tokens de acceso a los calendarios Microsoft 365 de los docentes deben almacenarse cifrados en Firestore con expiración automática y nunca en texto plano. | Tokens cifrados con TTL ≤ 1 hora, renovación automática |
| RNF-006 | Seguridad | Las reglas de seguridad de Firestore deben implementar control de acceso basado en roles, rechazando cualquier lectura o escritura no autorizada a nivel de documento. | 0 accesos no autorizados en pruebas de penetración básica |
| RNF-007 | Usabilidad | El sistema debe ser evaluado con usuarios reales del campus Loja usando la escala System Usability Scale (SUS) y obtener una puntuación mínima aceptable. | SUS score ≥ 70 puntos (con mínimo 5 usuarios evaluadores) |
| RNF-008 | Usabilidad | La interfaz debe ser completamente responsiva y funcional en todos los dispositivos utilizados por el personal docente y administrativo de la UIDE. | Compatible con resoluciones desde 320px (móvil) hasta 1920px (escritorio) sin pérdida de funcionalidad |
| RNF-009 | Precisión IA | El módulo de clasificación automática con BETO debe alcanzar métricas mínimas de rendimiento del modelo en el conjunto de validación. | Precision ≥ 80%, Recall ≥ 80%, F1-score ≥ 80% en clasificación multiclase |
| RNF-010 | Escalabilidad | La arquitectura serverless de Firebase Cloud Functions debe escalar automáticamente ante incrementos en la demanda de usuarios sin intervención manual. | Auto-scaling de 0 a 1000 instancias concurrentes según demanda Firebase |
| RNF-011 | Mantenibilidad | El código fuente debe estar organizado en componentes reutilizables y documentado con comentarios JSDoc en todas las funciones públicas del sistema. | Cobertura de documentación JSDoc ≥ 80% y cobertura de pruebas unitarias ≥ 60% |
| RNF-012 | Compatibilidad | El sistema debe funcionar correctamente en los navegadores web más utilizados en su versión estable más reciente. | Compatible con Google Chrome, Mozilla Firefox y Microsoft Edge (versiones estables 2026) |
| RNF-013 | Privacidad | El sistema debe cumplir con la normativa ecuatoriana de protección de datos personales. Los datos del personal docente y administrativo no pueden compartirse con terceros. | 0 datos personales expuestos a terceros; cumplimiento verificable con auditoría de Firestore rules |
| RNF-014 | Precisión del distributivo | El motor de cálculo automático del distributivo no debe producir errores de cálculo en la distribución de horas respecto al Reglamento CES 2021. | 0 errores de cálculo en pruebas con 100 casos de distribución real |
| RNF-015 | Cobertura de pruebas | El sistema debe contar con una cobertura mínima de pruebas funcionales sobre los requerimientos identificados en la fase de análisis. | ≥ 80% de RF validados mediante pruebas funcionales documentadas |
| RNF-016 | Validación de cruces horarios | El motor de asignación de horario gráfico no debe permitir que dos actividades del mismo docente se solapen en la misma franja horaria. La franja 13:00–14:00 (almuerzo) es siempre no asignable. | 0 cruces de horario permitidos; error visible inmediato al detectar solapamiento |
| RNF-017 | Rendimiento de la vista de horario | La vista gráfica semanal del distributivo debe renderizar todos los bloques de actividad sin retraso perceptible. | Tiempo de renderizado < 1 segundo para hasta 40 bloques de actividad por semana |
| RNF-018 | Usabilidad | La interfaz debe ser simple, intuitiva y amigable para usuarios no técnicos. Fue el requerimiento **más mencionado en ambas entrevistas** (Director de Derecho y Coordinador de Business School). Prioridad alta. | SUS ≥ 70 y retroalimentación cualitativa positiva de ≥ 80% de los evaluadores |
| RNF-019 | Rendimiento | El tiempo de carga de las vistas principales (dashboard, distributivo, reportes) debe ser inferior a 2 segundos. El patrón de uso semanal fue confirmado por todos los entrevistados. | Tiempo de carga < 2 segundos en las vistas principales |
| RNF-020 | Rendimiento (reportes) | La generación y descarga de reportes debe ser inmediata, sin procesos en segundo plano que demoren la experiencia del usuario. | Reporte disponible para descarga sin espera perceptible (< 2 segundos) |

> 📝 **Nota de implementación:** El RNF-009 requiere construir un dataset de entrenamiento con eventos de calendario reales de la UIDE etiquetados manualmente antes del Sprint 3. Coordinar con el Coordinador académico para obtener ejemplos reales de cada categoría de actividad.

---

## 5. 👁️ VISTAS PRINCIPALES DEL SISTEMA

| Vista | Descripción | Rol(es) que acceden | Componentes clave |
|---|---|---|---|
| **Login** | Pantalla de inicio de sesión con botón de autenticación Microsoft. Redirige automáticamente según el rol del usuario autenticado. | Todos | `LoginPage.jsx`, `AuthContext.jsx` |
| **Dashboard General** | Panel principal con indicadores en tiempo real: cumplimiento por docente, alertas activas, distribución de horas por categoría, indicador del período activo con fechas, acceso rápido al historial de los últimos 5 períodos, acceso a vista de horario por docente, botones de descarga PDF/Excel con previsualización, y notificaciones de validaciones cruzadas pendientes. | Director, Coordinador | `DashboardPage.jsx`, `CumplimientoChart.jsx`, `AlertasPanel.jsx`, `DocenteCard.jsx` |
| **Mi Distributivo** | Vista personal del docente con su distribución de 40h semanales por categoría, estado de aprobación, porcentaje de cumplimiento del período activo, opción de confirmar/observar (validación cruzada RN-019) y botón de descarga de su propio PDF con previsualización. | Docente TC, MT, TP | `DistributivoPage.jsx`, `DistributivoTable.jsx`, `ResumenHoras.jsx`, `PrevisualizacionPDF.jsx` |
| **Gestión del Distributivo** | Vista de administración donde el Director crea (mediante Modal), asigna, edita y aprueba distributivos para todos los docentes del período activo, con cálculo automático de horas y filtro por docente. | Director, Coordinador (lectura) | `DistributivoForm.jsx`, `CalculoHoras.js`, `ValidacionDistributivo.js` |
| **Calendario / Agenda** | Vista de agenda del docente con eventos sincronizados desde Outlook, mostrando la clasificación automática IA de cada evento y su estado de confirmación. | Docente TC, MT, TP | `CalendarioPage.jsx`, `EventoCard.jsx`, `SyncOutlookButton.jsx` |
| **Panel IA / Clasificación** | Vista donde el docente revisa los eventos clasificados automáticamente por BETO, puede corregir la categoría asignada y enviar retroalimentación al modelo. | Docente TC, MT, TP | `ClasificacionPage.jsx`, `EventoClasificado.jsx`, `CorreccionManual.jsx` |
| **Reportes** | Módulo para generar, filtrar y descargar reportes de cumplimiento del distributivo por período o docente individual. SIEMPRE muestra pantalla de previsualización editable antes de descargar. Soporta PDF (con plantilla institucional UIDE) y Excel. | Director, Coordinador, Docente (solo su propio PDF) | `ReportesPage.jsx`, `ReportePDF.jsx`, `PrevisualizacionPDF.jsx`, `FiltrosReporte.jsx` |
| **Perfil del Docente** | Vista de información personal del docente: datos académicos, tipo de contrato, horas asignadas por período y historial de distributivos anteriores. | Docente TC, MT, TP, Coordinador | `PerfilPage.jsx`, `HistorialDistributivos.jsx` |
| **Administración de Usuarios** | Panel de gestión del sistema donde el Administrador crea, edita, activa o desactiva cuentas de usuario y asigna roles institucionales. | Administrador | `UsuariosTable.jsx`, `AdminPage.jsx` |
| **Gestión de Períodos** | Vista para crear, activar y cerrar períodos académicos. Cada período tiene nombre personalizado, fechas, estado y lista propia de docentes. Al cerrar un período se crea automáticamente el siguiente en estado Próximo, vacío. Formularios en Modal con Liquid Glass. | Administrador, Director | `PeriodosAdmin.jsx`, `Modal.jsx` |
| **Horario Gráfico del Distributivo** | Vista de calendario semanal (lunes a sábado, 07:00–22:00) que muestra las actividades del docente distribuidas en bloques de horario. Almuerzo 13:00–14:00 bloqueado visualmente. El director puede cambiar de docente para ver su horario individual. El docente ve solo el propio. Detecta y alerta cruces de horario. | Director, Docente TC/MT/TP | `CalendarioDistributivo.jsx` |
| **Historial de Períodos** | Vista navegable de los últimos 5 períodos académicos. Permite al director seleccionar cualquier período pasado para consultar sus distributivos, docentes y estadísticas. Solo lectura. | Director, Coordinador | `HistorialPeriodos.jsx` |
| **Previsualización PDF** | Pantalla intermedia que muestra el borrador del reporte PDF antes de la descarga definitiva. Permite editar el contenido visible (campos del docente, observaciones) antes de generar el archivo final. Aplica a director y docente. | Director, Coordinador, Docente | `PrevisualizacionPDF.jsx`, `ReportePDF.jsx` |
| **Historial / Auditoría** | Registro cronológico de todas las modificaciones realizadas al distributivo: usuario que cambió, campo modificado, valor anterior y nuevo, y marca de tiempo. | Administrador, Director | `AuditoriaLog.jsx` |
| **Configuración del Sistema** | Panel de configuración de parámetros globales: umbral de alerta de cumplimiento, períodos de sincronización y configuración de notificaciones. | Administrador | `ConfiguracionSistema.jsx` |
| **Notificaciones** | Bandeja de notificaciones institucionales con alertas de incumplimiento, confirmaciones de aprobación del distributivo y mensajes del sistema. | Todos | `NotificacionesPage.jsx`, `NotificacionItem.jsx` |

> 📝 **Nota de implementación:** Todas las vistas deben protegerse con el componente `RoleGuard.jsx` (modulo auth), que verifica los roles del usuario autenticado (modelo multi-rol `roles[]`) antes de renderizar el contenido. Las vistas no accesibles para los roles activos redirigen automáticamente al home del rol principal. (El antiguo `ProtectedRoute.jsx` fue eliminado por duplicar esta responsabilidad.)

---

## 6. 🧩 MÓDULOS DEL SISTEMA

### MOD-01: Autenticación y Gestión de Roles

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Gestionar la identidad de los usuarios, el ciclo de vida de la sesión y el control de acceso basado en roles en todas las vistas del sistema |
| **Tecnología** | Firebase Authentication + Microsoft Azure AD + OAuth 2.0 |
| **Entradas** | Credenciales institucionales @uide.edu.ec via Microsoft login |
| **Salidas** | Token JWT de sesión, objeto de usuario con rol asignado, redirección a dashboard correspondiente |
| **Dependencias** | Firebase Auth SDK, Microsoft Identity Platform, colección `/usuarios` en Firestore |

**Flujo de autenticación:**
```plaintext
1. Usuario hace clic en "Iniciar sesión con Microsoft"
2. Redirección a Microsoft Azure AD (popup o redirect)
3. Usuario ingresa credenciales @uide.edu.ec
4. Azure AD valida y retorna token OAuth 2.0
5. Firebase Auth valida el token con el proveedor Microsoft
6. Sistema consulta colección /usuarios en Firestore con el UID
7. Se carga el rol del usuario (Director, Coordinador, Docente, Admin)
8. Redirección al dashboard correspondiente según el rol
```

---

### MOD-02: Gestión del Distributivo Académico

| Campo | Detalle |
|---|---|
| **Responsabilidad** | CRUD completo del distributivo académico con cálculo automático de horas según el Reglamento CES 2021 |
| **Tecnología** | Firestore (Firestore SDK en React), lógica de negocio en `src/utils/calculos.js` |
| **Entradas** | Datos del docente, período académico activo, número de materias, estudiantes en PPP/PC, proyectos de titulación |
| **Salidas** | Distributivo calculado con desglose por categoría, validación de 40h semanales, estado de aprobación |
| **Dependencias** | MOD-01 (autenticación), colecciones `/distributivos`, `/actividades`, `/periodos_academicos` |

---

### MOD-03: Sincronización de Calendarios y Etiquetas Outlook

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Conectar el calendario Outlook del docente con el sistema, sincronizar eventos y extraer actividades desde correos etiquetados con nomenclatura DIST/* |
| **Tecnología** | Microsoft Graph API, Firebase Cloud Functions (Python), token OAuth 2.0 por docente |
| **Entradas** | Token de acceso al calendario y correo del docente, rango de fechas del período académico activo, filtro de etiquetas DIST/* |
| **Salidas** | Lista de eventos del calendario en `/eventos_calendario` y actividades extraídas desde correos etiquetados en `/actividades` |
| **Dependencias** | MOD-01 (token OAuth docente), MOD-04 (clasificación post-sincronización), Microsoft Graph API |

**Endpoint Graph API — Calendario:**
```plaintext
GET https://graph.microsoft.com/v1.0/me/calendarView
    ?startDateTime={inicio_periodo}
    &endDateTime={fin_periodo}
    &$select=subject,body,start,end,location
```

**Endpoint Graph API — Correos etiquetados Outlook:**
```plaintext
GET https://graph.microsoft.com/v1.0/me/messages
    ?$filter=categories/any(c:startswith(c,'DIST/'))
    &$select=subject,receivedDateTime,categories,body
```

**Flujo de extracción desde etiquetas Outlook:**
```plaintext
1. Docente asigna manualmente una etiqueta DIST/* a un correo en Outlook
   Etiquetas válidas: DIST/Docencia, DIST/Investigación, DIST/Vinculación,
                      DIST/Gestión, DIST/TP-Horas
2. Cloud Function (sync_outlook.py) consulta Graph API filtrando por categorías DIST/*
3. Por cada correo etiquetado: extrae asunto, fecha de recepción y etiqueta
4. Mapea la etiqueta a la categoría CES correspondiente
5. Registra la actividad en Firestore colección /actividades con origen: "etiqueta_outlook"
6. Evita duplicados usando el ID del mensaje de Graph API como identificador único
```

> 📝 **Nota de implementación:** La integración de etiquetas Outlook reemplaza cualquier mención a Gmail en el sistema. Requiere el permiso delegado `Mail.Read` en el registro de Azure AD. El docente debe etiquetar sus correos manualmente; el sistema solo lee, no modifica los correos.

---

### MOD-04: Clasificación IA con NLP (BETO)

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Clasificar automáticamente cada evento del calendario en una de las cuatro categorías oficiales del distributivo usando el modelo BETO |
| **Tecnología** | Python, Hugging Face Transformers, BETO (dccuchile/bert-base-spanish-wwm-cased), Firebase Cloud Functions |
| **Entradas** | Texto del evento (título + descripción), token de la sesión del docente |
| **Salidas** | Categoría predicha (docencia/investigación/vinculación/gestión), probabilidad de confianza, estado provisional |
| **Dependencias** | MOD-03 (eventos sincronizados), colección `/clasificaciones_ia`, `/feedback` |

**Pipeline de clasificación:**
```python
# Pseudocódigo del pipeline NLP
def clasificar_evento(texto_evento):
    # 1. Preprocesamiento
    texto_limpio = preprocesar(texto_evento)  # minúsculas, stopwords, normalización
    
    # 2. Tokenización con BETO
    tokens = tokenizer.encode(texto_limpio, max_length=128, truncation=True)
    
    # 3. Inferencia con modelo fine-tuned
    logits = modelo_beto(tokens)
    
    # 4. Softmax para probabilidades
    probabilidades = softmax(logits)
    
    # 5. Selección de categoría con mayor probabilidad
    categoria = CATEGORIAS[argmax(probabilidades)]
    confianza = max(probabilidades)
    
    return {
        "categoria": categoria,         # docencia, investigación, vinculación, gestión (4 oficiales)
        "confianza": confianza,         # 0.0 a 1.0
        "estado": "provisional"         # requiere confirmación del docente
    }
```

---

### MOD-05: Dashboard y Visualización en Tiempo Real

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Presentar indicadores de cumplimiento del distributivo en tiempo real mediante gráficos interactivos y tarjetas de estado |
| **Tecnología** | React.js, Recharts (gráficos), Firestore `onSnapshot` (actualizaciones en tiempo real) |
| **Entradas** | Datos de distributivos y actividades del período activo desde Firestore |
| **Salidas** | Gráficos de cumplimiento por docente, alertas activas, resumen de horas por categoría |
| **Dependencias** | MOD-02 (datos del distributivo), MOD-07 (notificaciones), colecciones `/distributivos`, `/actividades` |

---

### MOD-06: Reportes y Exportación

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Generar y exportar reportes de cumplimiento del distributivo en formato PDF institucional UIDE, listos para presentar ante el CACES |
| **Tecnología** | React (front), pdfmake o jsPDF (PDF), SheetJS (Excel), Firebase Cloud Functions (PDF pesado en backend) |
| **Entradas** | Filtros: período académico, carrera, docente, rango de fechas |
| **Salidas** | Archivo PDF institucional descargable con encabezado UIDE, tabla de actividades, firmas de validación cruzada y código de verificación |
| **Dependencias** | MOD-02 (datos del distributivo), colección `/reportes` (historial de reportes generados) |

**Estructura del PDF institucional:**
```plaintext
┌─────────────────────────────────────────────┐
│  [Logo UIDE]   UNIVERSIDAD INTERNACIONAL    │
│                DEL ECUADOR — Campus Loja    │
│                Período Académico: {periodo} │
├─────────────────────────────────────────────┤
│  DISTRIBUTIVO ACADÉMICO                     │
│  Docente: {nombre_completo}                 │
│  Tipo de contrato: {TC/MT/TP}               │
│  Carrera: {carrera}                         │
├─────────────────────────────────────────────┤
│  Categoría CES        │ Actividad │ Horas   │
│  Docencia             │ ...       │ XXh     │
│  Investigación        │ ...       │ XXh     │
│  Vinculación          │ ...       │ XXh     │
│  Gestión Académica    │ ...       │ XXh     │
│  TOTAL                │           │ 40h     │
├─────────────────────────────────────────────┤
│  VALIDACIÓN CRUZADA                         │
│  Directora de Carrera: _____ Fecha: ______  │
│  Docente:              _____ Fecha: ______  │
├─────────────────────────────────────────────┤
│  Código de verificación CACES: {codigo}     │
│  Generado: {fecha_hora} por {usuario}       │
└─────────────────────────────────────────────┘
```

---

### MOD-07: Notificaciones Automáticas

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Enviar alertas automáticas al Coordinador cuando un docente incumple el umbral de cumplimiento semanal configurado |
| **Tecnología** | Firebase Cloud Functions (Python), Firestore triggers, Firebase Cloud Messaging (FCM) |
| **Entradas** | Eventos de escritura en Firestore (`/actividades`), umbrales configurados en `/configuracion` |
| **Salidas** | Notificación push al Coordinador, registro en colección `/notificaciones` |
| **Dependencias** | MOD-02 (estado del distributivo), colección `/notificaciones`, `/configuracion` |

---

### MOD-08: Administración del Sistema

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Gestionar usuarios, roles, períodos académicos, configuración del sistema y registros de auditoría |
| **Tecnología** | React.js (front), Firestore (datos), Firebase Auth Admin SDK (gestión de usuarios) |
| **Entradas** | Datos de nuevo usuario, rol asignado, parámetros de configuración del sistema |
| **Salidas** | Usuario creado/modificado en Firebase Auth y Firestore, período académico creado/cerrado |
| **Dependencias** | MOD-01 (autenticación Admin), colecciones `/usuarios`, `/auditoria`, `/configuracion` |

---

### MOD-09: Mis Actividades — Tablero Kanban

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Gestión de actividades personales del docente mediante un tablero Kanban con vistas de Tablero y Estadísticas integradas. Permite crear, mover y eliminar actividades por categoría CES con seguimiento visual del progreso. |
| **Tecnología** | React.js, HTML5 Drag & Drop API, `misActividadesService.js` (localStorage en desarrollo, Firestore `/tareas_todo` en producción) |
| **Entradas** | Título, categoría CES, estado (por_hacer/en_progreso/completada), descripción, fecha límite |
| **Salidas** | Tablero Kanban de 3 columnas, vista de estadísticas por categoría (PlanetCategoria), gráfico semanal (PlanetSemanaChart) |
| **Dependencias** | MOD-01 (autenticación), colección `/tareas_todo`, componentes `PlanetCategoria.jsx` y `PlanetSemanaChart.jsx` del MOD-10 |

**Reglas de negocio del módulo Mis Actividades:**
- Una actividad puede estar en estado `por_hacer`, `en_progreso` o `completada` (RN-026)
- El cambio de estado se realiza por drag & drop; al llegar a "completada" se registra `fecha_completada`
- Un docente solo visualiza y gestiona sus propias actividades (restricción por UID en Firestore rules)
- La vista "Estadísticas" usa el mismo estado React que el Tablero Kanban, sin fetch adicional (RN-027)
- Las actividades se filtran por categoría CES mediante botones de filtro rápido en la vista Tablero
- Los formularios de creación y edición se abren en Modal con efecto Liquid Glass (RF-035)

---

### MOD-10: Módulo Planet — Resumen Visual

| Campo | Detalle |
|---|---|
| **Responsabilidad** | Presentar un resumen visual por categoría CES y por semana de las horas acumuladas del docente |
| **Tecnología** | React.js, Recharts (gráficos), Firestore `onSnapshot` (actualización en tiempo real) |
| **Entradas** | Actividades confirmadas del docente en el período activo desde `/actividades` |
| **Salidas** | Vista de bloques visuales por categoría con totales de horas semanales y acumuladas |
| **Dependencias** | MOD-02 (datos del distributivo), MOD-05 (dashboard), colección `/actividades` |

**Descripción visual:**
```plaintext
Semana del 26 May al 1 Jun 2026
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Docencia    │Investigación │ Vinculación  │   Gestión    │
│   20h / 20h  │   4h / 4h    │   2h / 2h    │  0.2h / 0.2h │
│  ██████████  │  ████        │  ██          │  ░           │
│    100%      │   100%       │   100%       │    10%       │
└──────────────┴──────────────┴──────────────┴──────────────┘
Total semana: 26.2h / 40h (65.5%)
```

> 📝 **Nota de implementación:** MOD-04 (clasificación BETO) requiere desplegar el modelo como una Cloud Function HTTP en Python. El modelo fine-tuned debe almacenarse en Firebase Storage o Google Cloud Storage por su tamaño. La carga del modelo debe optimizarse usando caché global en la Cloud Function para evitar cargas repetidas.

---

## 7. 📐 REGLAS DE NEGOCIO

### RN-001: Unicidad del distributivo por período
Solo puede existir un distributivo activo por docente por período académico. El sistema debe bloquear la creación de un segundo distributivo si ya existe uno en estado `activo` o `aprobado` para el mismo docente en el mismo período.

### RN-002: Jerarquía de estados del distributivo
El distributivo sigue un flujo de estados estricto y unidireccional: `borrador` → `en_revision` → `aprobado` → `vigente` → `archivado`. No se permiten retrocesos de estado excepto de `en_revision` a `borrador` por solicitud del Director.

### RN-003: Límite de horas semanales por tipo de contrato
La carga horaria total asignada no puede superar ni ser inferior al total de horas del contrato del docente según el Reglamento CES 2021 Art. 6: TC = 40h, MT = 20h, TP = según contrato. El sistema bloquea la aprobación si la suma difiere del total contractual.

### RN-004: Categorías de actividades válidas
Toda actividad registrada o clasificada en el sistema debe pertenecer exclusivamente a una de las cuatro categorías oficiales del distributivo (Excel UIDE): DOCENCIA, INVESTIGACIÓN, VINCULACIÓN CON LA SOCIEDAD y GESTIÓN ACADÉMICA. La tutoría no es una categoría: es la subcategoría 1.2 dentro de DOCENCIA.

### RN-005: Consentimiento individual para sincronización de calendario
La sincronización del calendario Outlook solo puede activarse mediante autorización explícita del docente propietario de la cuenta. Ningún Administrador o Coordinador puede conectar el calendario de otro usuario sin su consentimiento registrado.

### RN-006: Clasificación provisional por IA
Toda clasificación generada automáticamente por el módulo BETO tendrá estado `provisional` hasta que el docente la confirme o corrija manualmente. Las actividades en estado `provisional` no se contabilizan en los reportes oficiales de cumplimiento.

### RN-007: Reportes solo sobre distributivo aprobado
El sistema genera reportes de cumplimiento exclusivamente basados en distributivos con estado `aprobado` o `vigente`. Los distributivos en estado `borrador` o `en_revision` no se incluyen en ningún reporte oficial.

### RN-008: Control de acceso por rol y por carrera

El acceso está restringido en dos dimensiones: **nivel de rol** y **alcance de carrera**.

| Rol | Qué puede hacer | Alcance |
|---|---|---|
| `admin` | Todo: leer y escribir cualquier colección, gestionar usuarios de cualquier carrera, configuración global | Global — todas las carreras |
| `director` | Gestionar docentes y coordinadores de su carrera, aprobar distributivos, crear/cerrar períodos de su carrera, ver reportes de su carrera | Solo su `carrera_id` |
| `coordinador` | Gestionar docentes de su carrera, revisar (sin aprobar) distributivos, ver reportes de su carrera | Solo su `carrera_id` |
| `docente` | Ver y editar sus propios datos: distributivo, actividades, horario, reportes propios | Solo su `uid` |

> **RN-008a:** Un director NO puede ver ni modificar datos de docentes o distributivos de otras carreras, aunque ambas estén en el campus Loja.
> **RN-008b:** El rol `admin` (Pro-Rector) es el único con visibilidad global sobre todas las carreras simultáneamente.

### RN-009: Retención de datos históricos
Los distributivos y registros de actividades de períodos anteriores no pueden eliminarse del sistema. Solo pueden archivarse (estado `archivado`) para consulta histórica, garantizando la trazabilidad documental requerida por el CACES.

### RN-010: Corrección de IA retroalimenta al modelo
Cada corrección manual realizada por un docente sobre la clasificación automática de una actividad debe registrarse en la colección `/feedback` con el texto original, la categoría errónea asignada por BETO y la categoría correcta indicada por el docente.

### RN-011: Alerta automática de bajo cumplimiento
Si el porcentaje de cumplimiento semanal de un docente cae por debajo del umbral configurado en el sistema (por defecto 80%), se genera automáticamente una notificación al Coordinador de la carrera mediante Firebase Cloud Messaging.

### RN-012: Restricción de visualización entre docentes
Un docente no puede, bajo ninguna circunstancia, acceder a los datos del distributivo de otro docente. Esta restricción debe implementarse tanto a nivel de interfaz (rutas protegidas) como a nivel de base de datos (Firestore rules por UID).

### RN-013: Conflicto de horario en la hora cero institucional
El sistema debe identificar la franja horaria semanal en la que al menos el 80% de los docentes de la carrera coincidan en la institución (hora cero), considerando únicamente las actividades planificadas en el distributivo, no las actividades clasificadas por IA.

### RN-014: Aprobación del distributivo requiere validación completa
El Director no puede aprobar un distributivo que no haya pasado la validación de suma de horas (RN-003), que tenga actividades sin categoría válida (RN-004) o que contenga errores en los cálculos automáticos.

### RN-015: Auditoría de cambios obligatoria
Toda modificación a un distributivo en estado `aprobado` o `vigente` debe registrarse automáticamente en la colección `/auditoria` con: UID del usuario que realizó el cambio, campo modificado, valor anterior, valor nuevo y timestamp del servidor Firestore.

### RN-016: Condiciones para activar notificaciones
Las notificaciones se envían únicamente cuando: (a) el cumplimiento del docente cae por debajo del umbral, (b) el distributivo es aprobado por el Director, (c) se detecta un error de validación en el cierre del distributivo.

### RN-017: Exportación de reportes con firma de auditoría
Todo reporte exportado en PDF debe incluir: fecha y hora de generación, nombre del usuario que lo generó, período académico cubierto y un código de verificación único para garantizar la autenticidad del documento ante el CACES.

### RN-018: Control de horas para docentes Tiempo Parcial (TP)
Para docentes con contrato Tiempo Parcial, se aplican las siguientes restricciones:
- El campo de horas semanales solo acepta **números enteros** (sin decimales).
- El máximo permitido sin autorización es **12 horas semanales**.
- Si el docente ingresa más de 12 horas, el sistema **bloquea el guardado** y activa el siguiente flujo de autorización:
  - **Nivel 1 — Directora de Carrera:** recibe notificación, revisa la justificación del docente y puede aprobar o rechazar.
  - **Nivel 2 — Autoridad Superior (Rectorado):** solo se habilita si el Nivel 1 ya emitió una aprobación previa. Emite la aprobación final.
- El distributivo TP solo puede guardarse si: (a) las horas son ≤ 12, o (b) el flujo de dos niveles está completamente aprobado.
- Todo el flujo de autorización queda registrado en `/auditoria`.

### RN-019: Validación cruzada del distributivo
El distributivo académico solo puede alcanzar el estado `aprobado` cuando se cumplan **ambas** condiciones:
- **Condición A:** La Directora de Carrera ha revisado y dado su aprobación formal al distributivo.
- **Condición B:** El docente propietario ha revisado y confirmado su distributivo desde su vista personal.
- Si cualquiera de los dos registra una observación, el distributivo regresa automáticamente al estado `en_revision` y se notifica a ambas partes.
- El sistema registra la fecha y el UID de cada confirmación en el documento del distributivo en Firestore.
- Esta regla aplica a todos los tipos de contrato (TC, MT, TP).

### RN-020: Independencia absoluta de datos entre períodos
Los docentes, distributivos y actividades de un período académico son completamente independientes de los de cualquier otro período. Al crear un nuevo período, este comienza vacío. El sistema no copia ni transfiere automáticamente ningún dato del período anterior al siguiente.

### RN-021: Creación automática del período siguiente
Al cerrar o finalizar el período activo (manual o automáticamente al superar la fecha de fin), el sistema debe crear automáticamente el período siguiente con estado `proximo`, sin nombre definitivo, sin docentes asignados y sin distributivos. El Director es el responsable de configurar el período nuevo antes de activarlo.

### RN-022: Estándar de historial de períodos
El historial de períodos visible en reportes e historial siempre muestra por defecto los últimos 5 períodos académicos registrados en el sistema, ordenados del más reciente al más antiguo. El Director puede navegar entre ellos para consultar datos históricos en modo solo lectura.

### RN-023: Franja de almuerzo no asignable en horario
La franja horaria 13:00–14:00 de lunes a sábado está permanentemente bloqueada en la vista de horario gráfico del distributivo. Ninguna actividad puede asignarse en ese bloque. El sistema debe resaltar esta franja visualmente (color diferenciado) como recordatorio para el Director.

### RN-024: Prohibición de cruces horarios en el distributivo
Dos actividades del mismo docente no pueden ocupar la misma franja horaria en el mismo día. Al detectar un solapamiento, el sistema bloquea el guardado y muestra un error indicando el conflicto específico (actividad existente y bloque en conflicto).

### RN-025: Previsualización obligatoria antes de descarga
Ningún reporte PDF ni Excel puede descargarse sin haber pasado por la pantalla de previsualización. Esta regla aplica a todos los roles (Director, Coordinador, Docente). El botón de descarga definitiva solo aparece después de que el usuario visualiza el borrador del reporte en la pantalla de previsualización.

### RN-026: Estados del tablero Kanban en Mis Actividades
Las actividades personales del módulo Mis Actividades existen únicamente en uno de tres estados posibles: `"por_hacer"`, `"en_progreso"` y `"completada"`. El cambio de estado se realiza mediante drag & drop entre columnas del tablero Kanban. Al mover una actividad a la columna "Completadas", el sistema registra automáticamente la `fecha_completada` con el timestamp actual. Esta regla aplica a todos los roles que acceden al módulo (Docente TC/MT/TP, Coordinador, Director).

### RN-027: Coherencia de la vista Estadísticas con el Tablero Kanban
La vista "Estadísticas" del módulo Mis Actividades se alimenta del mismo estado React (`actividades`) que el Tablero Kanban, sin realizar ningún fetch adicional a la base de datos. Esto garantiza que los indicadores de progreso (total, en progreso, completadas, porcentaje por categoría) reflejen siempre los datos más recientes sin latencia ni inconsistencias entre las dos vistas dentro de la misma sesión.

> 📝 **Nota de implementación:** Las reglas RN-008 y RN-012 deben implementarse en dos capas simultáneas: en `src/router/AppRouter.jsx` (restricción de rutas) y en `firestore.rules` (restricción de acceso a datos). La segunda capa es crítica y no puede omitirse porque protege los datos independientemente del frontend.

---

## 8. 🧮 REGLAS DE CÁLCULO DEL DISTRIBUTIVO ACADÉMICO

### 8.1 Tipos de Contrato y Horas Semanales (Reglamento CES 2021, Art. 6)

| Tipo de contrato | Sigla | Horas semanales | Observación |
|---|---|---|---|
| Tiempo Completo | TC | 40 horas | Obligatorio cumplir exactamente 40h en el distributivo |
| Medio Tiempo | MT | 20 horas | Obligatorio cumplir exactamente 20h en el distributivo |
| Tiempo Parcial | TP | 4h mínimo (según contrato) | Las horas varían según el contrato individual |

### 8.2 Distribución de Actividades por Categoría (Reglamento CES 2021, Arts. 6, 7 y 8)

| Categoría de actividad | Docentes TC (40h) | Docentes MT (20h) | Observación |
|---|---|---|---|
| **Docencia directa** | Mínimo 3h, máximo 22h/semana | Proporcional | Incluye clases, laboratorios, talleres |
| **Preparación de clases y tutorías** | Calculado automáticamente (60% docencia) | Proporcional | No puede superar el total de horas de docencia directa |
| **Investigación** | Máximo 16h/semana | Proporcional | Requiere proyecto de investigación aprobado |
| **Vinculación con la sociedad** | Según estudiantes en prácticas | Proporcional | Calculado por número de estudiantes |
| **Gestión Académica** | Máximo 12h/semana | Proporcional | Incluye coordinación, comités, dirección |

### 8.3 Fórmulas de Cálculo Implementadas en el Sistema

#### Fórmula 1: Horas de preparación de clases

```plaintext
horas_preparacion = horas_docencia_directa × 0.60

Ejemplo:
  horas_docencia_directa = 18h
  horas_preparacion = 18 × 0.60 = 10.8h ≈ 10h48min
```

#### Fórmula 2: Horas de tutoría según número de materias

```plaintext
SI materias_asignadas ∈ [1, 2]  → horas_tutoria = 1
SI materias_asignadas ∈ [3, 4]  → horas_tutoria = 2
SI materias_asignadas ∈ [5, 6]  → horas_tutoria = 3

Ejemplo:
  materias_asignadas = 4
  horas_tutoria = 2h/semana
```

#### Fórmula 3: Horas de vinculación — Prácticas Comunitarias (PC)

```plaintext
horas_PC = ENTERO(estudiantes_PC / 10)

Ejemplo:
  estudiantes_en_PC = 25
  horas_PC = ENTERO(25 / 10) = 2h/semana
```

#### Fórmula 4: Horas de vinculación — Prácticas Pre-Profesionales (PPP)

```plaintext
horas_PPP = ENTERO(estudiantes_PPP / 15)

Ejemplo:
  estudiantes_en_PPP = 30
  horas_PPP = ENTERO(30 / 15) = 2h/semana
```

#### Fórmula 5: Titulación → Gestión Académica (subcategoría 4.9)

```plaintext
La titulación (dirección / tribunal / grados) NO es un bloque ni una fórmula
independiente: corresponde a GESTIÓN ACADÉMICA, subcategoría 4.9 (Tutores,
Lectores y Grados). El director registra estas horas manualmente dentro del
bloque de Gestión Académica.
```

#### Fórmula 6: Coordinador de PPP / PC

```plaintext
SI es_coordinador_PPP = verdadero → horas_coord_PPP = 3h fijas/semana
SI es_coordinador_PC  = verdadero → horas_coord_PC  = 3h fijas/semana
```

#### Fórmula 7: Seguimiento a graduados

```plaintext
horas_graduados = ENTERO(total_graduados / 80)

Ejemplo:
  total_graduados = 160
  horas_graduados = ENTERO(160 / 80) = 2h/semana
```

#### Fórmula 8: Validación de cierre del distributivo

```javascript
// Implementación en src/utils/calculos.js
/**
 * Valida que el distributivo sume exactamente las horas del contrato.
 * @param {Object} distributivo - Objeto con todas las actividades asignadas
 * @param {string} tipoContrato - 'TC' | 'MT' | 'TP'
 * @param {number} horasContrato - Horas totales del contrato (40, 20 o según TP)
 * @returns {Object} - { valido: boolean, diferencia: number, mensaje: string }
 * @see Reglamento CES 2021, Art. 6
 */
function validarCierreDistributivo(distributivo, tipoContrato, horasContrato) {
    const totalCalculado =
        distributivo.horas_docencia_directa +
        distributivo.horas_preparacion +
        distributivo.horas_tutoria +
        distributivo.horas_investigacion +
        distributivo.horas_vinculacion +
        distributivo.horas_gestion +
        distributivo.horas_reduccion_cargo;

    const diferencia = horasContrato - totalCalculado;
    const valido = Math.abs(diferencia) < 0.01; // tolerancia de 0.01h

    return {
        valido,
        totalCalculado,
        diferencia,
        mensaje: valido
            ? "El distributivo es válido: suma exacta de horas del contrato."
            : `Error: el distributivo suma ${totalCalculado}h pero el contrato exige ${horasContrato}h (diferencia: ${diferencia}h).`
    };
}
```

### 8.4 Reducciones por Cargo Directivo o Especial

| Cargo | Reducción semanal | Fuente |
|---|---|---|
| Coordinador de investigación (facultad/sede) | Hasta 6 horas | DGI institucional |
| Director o secretario de comité de bioética | Hasta 6 horas | Gestión Académica |
| Gestión de revista, laboratorio o CEDIA | Incluido en gestión | DGI institucional |
| Cargo directivo (Decano, Vicerrector, etc.) | Según tabla institucional UIDE | Tabla de reducciones UIDE |

### 8.5 Fórmulas de Evaluación del Modelo NLP (BETO)

```plaintext
Precision  = VP / (VP + FP)
Recall     = VP / (VP + FN)
F1-score   = 2 × (Precision × Recall) / (Precision + Recall)
Accuracy   = (VP + VN) / (VP + VN + FP + FN)

Donde:
  VP = Verdaderos Positivos (clasificación correcta)
  VN = Verdaderos Negativos
  FP = Falsos Positivos (clasificación incorrecta a otra categoría)
  FN = Falsos Negativos (no detectó la categoría correcta)

Umbral mínimo requerido: F1-score ≥ 0.80 para cada categoría
```

> 📝 **Nota de implementación:** Implementar todas las fórmulas de RN-11 a RN-29 en el archivo `src/utils/calculos.js` como funciones puras con JSDoc. Cada función debe tener su correspondiente test unitario en `tests/unit/calculos.test.js`. Las reducciones por cargo directivo deben aplicarse automáticamente si el campo `cargo_directivo` del documento del docente en Firestore tiene un valor no nulo.

---

## 9. 🗄️ COLECCIONES DE BASE DE DATOS (Firestore)

### COL-001: /usuarios

Almacena los perfiles, roles y permisos de todos los usuarios del sistema.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `uid` | string | UID de Firebase Authentication | Sí | `"abc123xyz"` |
| `nombre` | string | Nombres del usuario | Sí | `"Milton Ricardo"` |
| `apellido` | string | Apellidos del usuario | Sí | `"Palacios Morocho"` |
| `nombre_completo` | string | Nombre completo (nombre + apellido) | Sí | `"Milton Ricardo Palacios Morocho"` |
| `email` | string | Correo institucional @uide.edu.ec | Sí | `"mipalaciosmo@uide.edu.ec"` |
| `roles` | array&lt;string&gt; | Lista de roles del usuario. Un usuario puede ejercer **más de un rol simultáneamente** (p. ej. Director + Coordinador). Cada elemento es uno de 4 valores posibles. Reemplaza al campo `rol` (string) del modelo anterior. | Sí | `["director", "coordinador"]`, `["docente"]` |
| `tipo_contrato` | string | Tipo de contrato docente (null para admin sin contrato) | No | `"tiempo_completo"`, `"medio_tiempo"`, `"tiempo_parcial"`, `"honorario"`, `null` |
| `carrera_id` | string | ID de la carrera a la que pertenece (de /carreras) | Sí* | `"sistemas-informacion"` |
| `activo` | boolean | Estado de la cuenta | Sí | `true` |
| `creado_en` | timestamp | Fecha de creación de la cuenta | Sí | `Timestamp(2026, 3, 16)` |
| `ultima_sesion` | timestamp | Última sesión activa | No | `Timestamp(2026, 5, 20)` |
| `microsoft_token_ref` | string | Referencia cifrada al token OAuth | No | `"tokens/uid_abc123"` |
| `telefono_whatsapp` | string | Número WhatsApp para notificaciones Twilio (RF-038). Formato internacional `+` y 10–15 dígitos; `null` = sin notificaciones | No | `"+593991234567"`, `null` |

> *`carrera_id` es requerido para `director`, `coordinador` y `docente`. Para `admin` (Pro-Rector) es `null` porque tiene acceso global a todas las carreras.

> **Conflicto con código existente (v1.3.0):** El código actual usa `"docente_tc"`, `"docente_mt"`, `"docente_tp"` como valores del campo `rol`. La migración al modelo unificado `"docente"` + campo `tipo_contrato` se realizará en Sprint 6 como parte de la conexión a Firebase real. Hasta entonces, el mock de localStorage sigue usando los subtipos de docente. Ver §12.10 para el plan de migración.

> **Migración a `roles` (array) — instrumentos del 9-jun-2026:** Las entrevistas confirmaron que un mismo usuario puede ejercer **más de un rol a la vez** (caso real: Director + Coordinador). Por ello el campo escalar `rol: "director"` se reemplaza por `roles: ["director", "coordinador"]` (array). Toda verificación de permisos pasa de `rol === "x"` a `roles.includes("x")`, tanto en las reglas de seguridad de Firestore como en el frontend. Esta migración se ejecuta junto con la migración de subtipos de docente (§12.10) en Sprint 6. Ver §12.11 para el plan detallado.

### COL-002: /docentes

Información académica extendida de cada docente, separada de los datos de usuario.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `uid` | string | Referencia al UID en /usuarios | Sí | `"abc123xyz"` |
| `cedula` | string | Número de cédula de identidad | Sí | `"1104567890"` |
| `tipo_contrato` | string | Tipo de contrato CES | Sí | `"TC"`, `"MT"`, `"TP"` |
| `horas_contrato` | number | Total de horas semanales del contrato | Sí | `40` |
| `categoria_escalafon` | string | Categoría del escalafón docente | Sí | `"Auxiliar"`, `"Agregado"`, `"Principal"` |
| `materias_periodo_activo` | number | Número de materias en el período activo | No | `4` |
| `cargo_directivo` | string | Cargo directivo si aplica | No | `"Coordinador PPP"`, `null` |
| `calendario_sincronizado` | boolean | Si autorizó sincronización Outlook | Sí | `false` |
| `fecha_ingreso` | timestamp | Fecha de ingreso a la UIDE | No | `Timestamp(2020, 9, 1)` |

### COL-003: /periodos_academicos

> **Nota de implementación v1.2.0:** El nombre de esta colección se unificará a `/periodos` en la próxima refactorización de servicios. El código existente usa `/periodos_academicos`; documentar ambos nombres hasta la migración.

Gestión de los períodos académicos de la institución. Cada período es completamente independiente: tiene su propia lista de docentes, distributivos y actividades (RN-020).

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único del período | Sí | `"2026-A"` |
| `nombre` | string | Nombre personalizado del período (no automático) | Sí | `"Mayo–Agosto 2026"` |
| `fecha_inicio` | timestamp | Fecha de inicio del período | Sí | `Timestamp(2026, 5, 4)` |
| `fecha_fin` | timestamp | Fecha de fin del período | Sí | `Timestamp(2026, 8, 21)` |
| `estado` | string | Estado del período | Sí | `"activo"`, `"finalizado"`, `"proximo"` |
| `docentes_uid` | array | Lista de UIDs de docentes asignados a este período | Sí | `["uid1", "uid2"]` |
| `fecha_creacion` | timestamp | Fecha de creación del registro | Sí | `Timestamp(2026, 4, 15)` |
| `creado_por` | string | UID del administrador/director que lo creó | Sí | `"admin_uid_xyz"` |
| `creado_automaticamente` | boolean | Si fue creado automáticamente al cerrar el período anterior (RN-021) | Sí | `false` |

**Subcolecciones por período** (datos independientes por período):

```plaintext
/periodos_academicos/{periodoId}/
  ├── carreras/          ← ESTRUCTURA JERÁRQUICA del período (ver abajo)
  ├── docentes/          ← UIDs de docentes asignados exclusivamente a este período
  ├── distributivos/     ← distributivos de los docentes de este período
  ├── actividades/       ← actividades registradas en este período
  └── estadisticas/      ← resúmenes de cumplimiento para historial
```

**Subcolección `/carreras` — estructura jerárquica histórica (Período → Carreras → Usuarios):**

Cada documento `/periodos_academicos/{periodoId}/carreras/{carreraId}` configura la
participación de una carrera en ese período concreto:

| Campo | Tipo | Descripción |
|---|---|---|
| `carrera_id` | string | Referencia al catálogo global `/carreras` (dinámico, gestionado por superadmin) |
| `periodo_id` | string | Período al que pertenece esta configuración (trazabilidad) |
| `coordinador_uid` | string | Coordinador o responsable de la carrera EN ese período |
| `docentes_uid` | array | Docentes asignados a la carrera en ese período |
| `administrativos_uid` | array | Administrativos asignados en ese período |
| `indicadores` | array | Indicadores definidos para el período `[{id, nombre}]` |
| `actividades_plantilla` | array | Actividades definidas para el período |

**Reglas de la estructura jerárquica** (servicio `estructuraPeriodoService.js`):
- Los períodos `finalizado` son **historial inmutable**: toda escritura se rechaza (`assertEditable`); la consulta es libre y no afecta al período vigente.
- Al crear un período se puede **copiar la estructura del anterior** (`copiarEstructura`) — mantener carreras, responsables e indicadores — y ajustarla sin tocar el origen.
- Las carreras del catálogo no están codificadas: el superadmin crea nuevas para futuros períodos y cada período referencia las que participan.
- Trazabilidad por usuario: `getCarrerasDeUsuario(periodoId, uid)` responde en qué carreras participó cualquier usuario en cualquier período (incluye docentes compartidos entre carreras).

> **Nota sobre estados del período:** Los valores válidos del campo `estado` son `"activo"`, `"finalizado"` y `"proximo"`. El término **"finalizado"** reemplaza cualquier uso anterior de "cerrado" o "archivado" para períodos concluidos. El estado `"proximo"` corresponde al período creado automáticamente al cerrar el activo (RN-021), aún sin docentes ni distributivos asignados.

> 📝 **Período de ejemplo actual:** nombre `"Mayo–Agosto 2026"`, fecha inicio `04/05/2026`, fecha fin `21/08/2026`, estado `activo`.

### COL-004: /distributivos

Núcleo del sistema. Contiene el distributivo de cada docente por período.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único: `{uid_docente}_{periodo_id}` | Sí | `"abc123_2026-A"` |
| `docente_uid` | string | UID del docente propietario | Sí | `"abc123xyz"` |
| `periodo_id` | string | ID del período académico | Sí | `"2026-A"` |
| `estado` | string | Estado del distributivo | Sí | `"borrador"`, `"aprobado"`, `"vigente"` |
| `horas_docencia_directa` | number | Horas de docencia frente a estudiantes | Sí | `18` |
| `horas_preparacion` | number | Calculado: 60% de docencia directa | Sí | `10.8` |
| `horas_tutoria` | number | Calculado según número de materias | Sí | `2` |
| `horas_investigacion` | number | Horas asignadas a investigación | Sí | `4` |
| `horas_vinculacion` | number | Calculado: PC + PPP | Sí | `2` |
| `horas_titulacion` | number | Legacy: integrado en Gestión Académica (subcat. 4.9) | No | `0` |
| `horas_gestion` | number | Horas de Gestión Académica | Sí | `0.2` |
| `horas_reduccion_cargo` | number | Reducción por cargo directivo si aplica | No | `0` |
| `total_horas` | number | Suma total validada | Sí | `40` |
| `aprobado_por` | string | UID del director que aprobó | No | `"director_uid_abc"` |
| `fecha_aprobacion` | timestamp | Fecha de aprobación del director | No | `Timestamp(2026, 3, 20)` |
| `confirmado_por_docente` | boolean | Si el docente confirmó su distributivo (RN-019) | Sí | `false` |
| `fecha_confirmacion_docente` | timestamp | Fecha en que el docente confirmó (RN-019) | No | `Timestamp(2026, 3, 21)` |
| `autorizacion_tp_nivel1_uid` | string | UID del director que aprobó exceso de horas TP (RN-018) | No | `null` |
| `autorizacion_tp_nivel2_uid` | string | UID de autoridad superior que aprobó exceso TP (RN-018) | No | `null` |
| `fecha_ultima_modificacion` | timestamp | Última actualización | Sí | `Timestamp(2026, 5, 15)` |

### COL-005: /actividades

Registro de las actividades confirmadas y contabilizadas en el seguimiento.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único de la actividad | Sí | `"act_abc123"` |
| `docente_uid` | string | UID del docente | Sí | `"abc123xyz"` |
| `periodo_id` | string | Período al que pertenece | Sí | `"2026-A"` |
| `categoria` | string | Categoría del distributivo | Sí | `"docencia"`, `"investigacion"` |
| `titulo` | string | Título o nombre de la actividad | Sí | `"Clase de Programación Web"` |
| `descripcion` | string | Descripción detallada | No | `"Módulo 3: React.js"` |
| `fecha` | timestamp | Fecha de realización | Sí | `Timestamp(2026, 4, 10)` |
| `duracion_horas` | number | Duración en horas | Sí | `2` |
| `estado` | string | Estado de confirmación | Sí | `"provisional"`, `"confirmada"` |
| `origen` | string | Origen de la actividad | Sí | `"manual"`, `"calendario_outlook"` |
| `evento_calendario_id` | string | Referencia al evento de Outlook | No | `"evt_outlook_xyz"` |

### COL-006: /eventos_calendario

Eventos sincronizados desde Outlook mediante Microsoft Graph API.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID del evento en Microsoft Graph | Sí | `"AAMkAGVm..."` |
| `docente_uid` | string | UID del docente propietario | Sí | `"abc123xyz"` |
| `titulo` | string | Asunto del evento de Outlook | Sí | `"Reunión comité investigación"` |
| `descripcion` | string | Cuerpo del evento de Outlook | No | `"Revisión de avances..."` |
| `fecha_inicio` | timestamp | Inicio del evento | Sí | `Timestamp(2026, 4, 15, 10, 0)` |
| `fecha_fin` | timestamp | Fin del evento | Sí | `Timestamp(2026, 4, 15, 12, 0)` |
| `duracion_horas` | number | Duración calculada en horas | Sí | `2` |
| `clasificacion_ia_id` | string | Referencia a /clasificaciones_ia | No | `"clas_xyz123"` |
| `estado_clasificacion` | string | Estado de la clasificación | Sí | `"pendiente"`, `"provisional"`, `"confirmada"` |
| `fecha_sincronizacion` | timestamp | Cuándo se sincronizó desde Outlook | Sí | `Timestamp(2026, 4, 15, 9, 0)` |

### COL-007: /clasificaciones_ia

Resultados de la clasificación automática por el modelo BETO.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único de la clasificación | Sí | `"clas_xyz123"` |
| `evento_id` | string | ID del evento en /eventos_calendario | Sí | `"AAMkAGVm..."` |
| `docente_uid` | string | UID del docente | Sí | `"abc123xyz"` |
| `texto_analizado` | string | Texto enviado al modelo BETO | Sí | `"reunión comité investigación"` |
| `categoria_predicha` | string | Categoría asignada por BETO | Sí | `"investigacion"` |
| `confianza` | number | Probabilidad de la predicción | Sí | `0.92` |
| `categoria_corregida` | string | Categoría correcta indicada por docente | No | `null` |
| `fue_corregida` | boolean | Si el docente corrigió la clasificación | Sí | `false` |
| `fecha_clasificacion` | timestamp | Cuándo se clasificó | Sí | `Timestamp(2026, 4, 15, 9, 5)` |

### COL-008: /notificaciones

Alertas y notificaciones del sistema para cada usuario.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único de la notificación | Sí | `"notif_abc"` |
| `destinatario_uid` | string | UID del usuario destinatario | Sí | `"coord_uid_xyz"` |
| `tipo` | string | Tipo de notificación | Sí | `"bajo_cumplimiento"`, `"distributivo_aprobado"` |
| `titulo` | string | Título de la notificación | Sí | `"Alerta de incumplimiento"` |
| `mensaje` | string | Cuerpo de la notificación | Sí | `"El docente X tiene 65% de cumplimiento"` |
| `docente_uid_ref` | string | UID del docente relacionado | No | `"abc123xyz"` |
| `leida` | boolean | Si fue leída por el destinatario | Sí | `false` |
| `fecha_creacion` | timestamp | Cuándo se generó | Sí | `Timestamp(2026, 5, 20, 8, 0)` |

### COL-009: /reportes

Historial de reportes generados y descargados.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único del reporte | Sí | `"rep_abc123"` |
| `generado_por_uid` | string | UID del usuario que generó el reporte | Sí | `"coord_uid_xyz"` |
| `tipo` | string | Tipo de reporte | Sí | `"cumplimiento_individual"`, `"cumplimiento_carrera"` |
| `periodo_id` | string | Período cubierto por el reporte | Sí | `"2026-A"` |
| `docente_uid` | string | UID del docente (si es individual) | No | `"abc123xyz"` |
| `url_descarga` | string | URL de Firebase Storage del PDF | Sí | `"gs://uide-app/reportes/rep_abc123.pdf"` |
| `codigo_verificacion` | string | Código único de autenticidad | Sí | `"UIDE-2026-A-REP-001"` |
| `fecha_generacion` | timestamp | Fecha y hora de generación | Sí | `Timestamp(2026, 5, 20, 14, 30)` |

### COL-010: /auditoria

Registro inmutable de todos los cambios realizados al sistema.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único del registro de auditoría | Sí | `"audit_xyz"` |
| `usuario_uid` | string | UID del usuario que realizó el cambio | Sí | `"director_uid_abc"` |
| `accion` | string | Tipo de acción realizada | Sí | `"editar_distributivo"`, `"aprobar_distributivo"` |
| `coleccion` | string | Colección afectada | Sí | `"distributivos"` |
| `documento_id` | string | ID del documento modificado | Sí | `"abc123_2026-A"` |
| `campo_modificado` | string | Campo que cambió | No | `"horas_investigacion"` |
| `valor_anterior` | any | Valor antes del cambio | No | `4` |
| `valor_nuevo` | any | Valor después del cambio | No | `6` |
| `timestamp` | timestamp | Marca de tiempo del servidor Firestore | Sí | `FieldValue.serverTimestamp()` |

### COL-011: /configuracion

Parámetros de configuración global del sistema.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `umbral_alerta_cumplimiento` | number | Porcentaje mínimo antes de alertar | Sí | `80` |
| `frecuencia_sync_calendario` | string | Frecuencia de sincronización | Sí | `"diaria"`, `"semanal"` |
| `periodo_activo_id` | string | ID del período académico activo | Sí | `"2026-A"` |
| `notificaciones_activas` | boolean | Si las notificaciones están habilitadas | Sí | `true` |
| `version_sistema` | string | Versión actual del sistema | Sí | `"1.0.0"` |

---

### COL-012: /tareas_todo

Tareas pendientes del docente ligadas al módulo To Do interno (MOD-09).

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único de la tarea | Sí | `"todo_abc123"` |
| `docente_uid` | string | UID del docente propietario | Sí | `"abc123xyz"` |
| `titulo` | string | Título descriptivo de la tarea | Sí | `"Subir notas parciales"` |
| `categoria_ces` | string | Categoría oficial asociada (4 valores) | Sí | `"docencia"`, `"investigacion"`, `"vinculacion"`, `"gestion"` |
| `subcategoria` | string | Subcategoría oficial (ej. `"1.2"`, `"3.3"`, `"4.9"`) | No (manual) | `"1.2"` |
| `fecha_limite` | timestamp | Fecha límite para completar la tarea | Sí | `Timestamp(2026, 6, 15)` |
| `estado` | string | Estado actual de la tarea | Sí | `"pendiente"`, `"completada"` |
| `actividad_id_ref` | string | Referencia opcional a una actividad en /actividades | No | `"act_abc123"` |
| `fecha_creacion` | timestamp | Fecha de creación de la tarea | Sí | `Timestamp(2026, 5, 20)` |
| `fecha_completada` | timestamp | Fecha en que se marcó como completada | No | `null` |

### COL-013: /carreras

Catálogo de carreras del campus Loja. Cada documento representa una carrera y referencia a su director y coordinador actuales.

| Campo | Tipo | Descripción | Requerido | Ejemplo |
|---|---|---|---|---|
| `id` | string | ID único de la carrera (slug) | Sí | `"sistemas-informacion"` |
| `nombre` | string | Nombre oficial de la carrera | Sí | `"Ingeniería en Sistemas de la Información"` |
| `escuela` | string | Escuela a la que pertenece (si aplica) | No | `"Escuela de Tecnologías de la Información"` |
| `director_uid` | string | UID del director de carrera activo | Sí | `"uid_lcondezh"` |
| `coordinador_uid` | string | UID del coordinador académico activo | No | `"uid_dvalarezole"` |
| `activo` | boolean | Si la carrera está activa en el sistema | Sí | `true` |

**Documentos iniciales (seed) — 7 carreras UIDE Campus Loja:**

```javascript
// Seed: src/services/seedData.js
const CARRERAS_SEED = [
  { id: 'administracion-empresas',  nombre: 'Administración de Empresas',               escuela: null, activo: true },
  { id: 'arquitectura',             nombre: 'Arquitectura',                               escuela: null, activo: true },
  { id: 'derecho',                  nombre: 'Derecho',                                   escuela: null, activo: true },
  { id: 'sistemas-informacion',     nombre: 'Ingeniería en Sistemas de la Información',   escuela: 'Escuela de Tecnologías de la Información', director_uid: 'uid_locondezh', coordinador_uid: 'uid_davalarezole', activo: true },
  { id: 'psicologia-clinica',       nombre: 'Psicología Clínica',                        escuela: null, activo: true },
  { id: 'marketing',                nombre: 'Marketing',                                  escuela: null, activo: true },
  { id: 'negocios-internacionales', nombre: 'Negocios Internacionales',                  escuela: null, activo: true },
]
```

**Datos semilla (seed) — Usuarios de Ingeniería en Sistemas:**

```javascript
const USUARIOS_SEED = [
  {
    uid:            'uid_paruizag',
    nombre:         'Pablo',
    apellido:       'Ruiz Aguirre',
    nombre_completo:'Pablo Ruiz Aguirre',
    email:          'paruizag@uide.edu.ec',
    roles:          ['admin'],
    tipo_contrato:  null,
    carrera_id:     null,
    activo:         true,
  },
  {
    uid:            'uid_locondezh',
    nombre:         'Lorena Elizabeth',
    apellido:       'Conde Zhingre',
    nombre_completo:'Lorena Elizabeth Conde Zhingre',
    email:          'locondezh@uide.edu.ec',
    roles:          ['director'],
    tipo_contrato:  'tiempo_completo',
    carrera_id:     'sistemas-informacion',
    activo:         true,
  },
  {
    uid:            'uid_davalarezole',
    nombre:         'Darío Javier',
    apellido:       'Valarezo León',
    nombre_completo:'Darío Javier Valarezo León',
    email:          'davalarezole@uide.edu.ec',
    roles:          ['coordinador'],
    tipo_contrato:  'tiempo_completo',
    carrera_id:     'sistemas-informacion',
    activo:         true,
  },
  {
    uid:            'uid_mipalaciosmo',
    nombre:         'Milton Ricardo',
    apellido:       'Palacios Morocho',
    nombre_completo:'Milton Ricardo Palacios Morocho',
    email:          'mipalaciosmo@uide.edu.ec',
    roles:          ['docente'],
    tipo_contrato:  'tiempo_completo',
    carrera_id:     'sistemas-informacion',
    activo:         true,
  },
  {
    uid:            'uid_yetorresbe',
    nombre:         'Yeferson Mauricio',
    apellido:       'Torres Berru',
    nombre_completo:'Yeferson Mauricio Torres Berru',
    email:          'yetorresbe@uide.edu.ec',
    roles:          ['docente'],
    tipo_contrato:  'medio_tiempo',
    carrera_id:     'sistemas-informacion',
    activo:         true,
  },
]
```

---

### Colecciones añadidas — requerimientos del 9-jun-2026 (RF-037…RF-044)

| Colección | Propósito | Campos clave | RF |
|---|---|---|---|
| `/planes_mejora` | Plan de mejoras accionable por incumplimiento de horas (no solo notificación). Sin eliminación (trazabilidad). | `docente_uid`, `periodo_id`, `descripcion`, `fecha_registro`, `fecha_compromiso`, `responsable_nombre`, `estado` (abierto/cumplido/incumplido) | RF-037 |
| `/matriz_productividad` | Matriz de Productividad pre-asignada desde Rectorado; paso previo al distributivo. Solo lectura excepto Admin. | `docente_uid`, `periodo_id`, `horas_investigacion`, `proyecto`, `estado` (aprobada), `origen: "rectorado"` | RF-043 |
| `/oficios` | Notificación formal por incumplimiento: oficio registrado con numeración secuencial (`OFI-<año>-NNN`) o constancia del envío Outlook. | `numero`, `docente_uid`, `periodo_id`, `motivo`, `cuerpo`, `plan_mejora_id`, `via`, `fecha_emision`, `emitido_por` | RF-044 |
| `/roles_definicion` | RBAC dinámico: definición de cada rol (de sistema o personalizado) con sus módulos visibles y acciones ejecutables; editable por el superadmin sin tocar código (§12.13). | `id`, `nombre`, `modulos[]`, `acciones{modulo: [...]}`, `activo`, `es_sistema` | RBAC |

> Campos añadidos a colecciones existentes: `/usuarios.telefono_whatsapp` (RF-038, notificaciones Twilio) y `/tareas_todo.imprevista` (RF-041, validación de 2 semanas de anticipación en la capa de aplicación).

### Reglas de Seguridad de Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Funciones de autenticación ──────────────────────────────────
    function estaAutenticado() {
      return request.auth != null;
    }

    function getUsuario() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    function getRoles() {
      return getUsuario().roles;   // array<string>: un usuario puede tener varios roles
    }

    function getCarreraId() {
      return getUsuario().carrera_id;
    }

    // ── Funciones de rol ─────────────────────────────────────────────
    // Un usuario puede ejercer más de un rol; se evalúa pertenencia al array `roles`.
    function esAdmin() {
      return estaAutenticado() && ('admin' in getRoles());
    }

    function esDirector() {
      return estaAutenticado() && ('director' in getRoles());
    }

    function esCoordinador() {
      return estaAutenticado() && (('coordinador' in getRoles()) || esDirector());
    }

    // ── Alcance por carrera ──────────────────────────────────────────
    function mismaCarrera(docCarreraId) {
      return esAdmin() || getCarreraId() == docCarreraId;
    }

    // ── /usuarios ────────────────────────────────────────────────────
    match /usuarios/{uid} {
      allow read: if estaAutenticado() && (
        request.auth.uid == uid ||
        esAdmin() ||
        (esCoordinador() && mismaCarrera(resource.data.carrera_id))
      );
      allow create: if esAdmin() || (esDirector() && mismaCarrera(request.resource.data.carrera_id));
      allow update: if esAdmin() || (esDirector() && mismaCarrera(resource.data.carrera_id));
      allow delete: if false;
    }

    // ── /carreras ────────────────────────────────────────────────────
    match /carreras/{carreraId} {
      allow read: if estaAutenticado();
      allow write: if esAdmin();
    }

    // ── /distributivos ───────────────────────────────────────────────
    match /distributivos/{docId} {
      allow read: if estaAutenticado() && (
        resource.data.docente_uid == request.auth.uid ||
        (esCoordinador() && mismaCarrera(resource.data.carrera_id)) ||
        esAdmin()
      );
      allow create: if esAdmin() || (esDirector() && mismaCarrera(request.resource.data.carrera_id));
      allow update: if esAdmin() || (esDirector() && mismaCarrera(resource.data.carrera_id));
      allow delete: if false;
    }

    // ── /actividades ─────────────────────────────────────────────────
    match /actividades/{actId} {
      allow read: if estaAutenticado() && (
        resource.data.docente_uid == request.auth.uid ||
        (esCoordinador() && mismaCarrera(resource.data.carrera_id)) ||
        esAdmin()
      );
      allow write: if estaAutenticado() && (
        resource.data.docente_uid == request.auth.uid || esAdmin()
      );
    }

    // ── /tareas_todo (Mis Actividades / Kanban) ──────────────────────
    match /tareas_todo/{tareaId} {
      allow read, write: if estaAutenticado() &&
        resource.data.docente_uid == request.auth.uid;
      allow create: if estaAutenticado() &&
        request.resource.data.docente_uid == request.auth.uid;
    }

    // ── /periodos_academicos ─────────────────────────────────────────
    match /periodos_academicos/{periodoId} {
      allow read: if estaAutenticado() && (
        esAdmin() || mismaCarrera(resource.data.carrera_id)
      );
      allow create, update: if esAdmin() ||
        (esDirector() && mismaCarrera(request.resource.data.carrera_id));
      allow delete: if false;
    }
    match /periodos_academicos/{periodoId}/{subcol}/{docId} {
      allow read: if estaAutenticado() && (
        esAdmin() || esCoordinador() ||
        resource.data.docente_uid == request.auth.uid
      );
      allow write: if esAdmin() || esDirector();
    }

    // ── /auditoria ───────────────────────────────────────────────────
    match /auditoria/{logId} {
      allow read: if esAdmin() || esDirector();
      allow write: if false;
    }

    // ── /configuracion ───────────────────────────────────────────────
    match /configuracion/{configId} {
      allow read: if estaAutenticado();
      allow write: if esAdmin();
    }

    // ── /notificaciones ──────────────────────────────────────────────
    match /notificaciones/{notifId} {
      allow read: if estaAutenticado() && (
        resource.data.destinatario_uid == request.auth.uid || esAdmin()
      );
      allow write: if false;
    }
  }
}```

> 📝 **Nota de implementación:** Las reglas de Firestore deben desplegarse con `firebase deploy --only firestore:rules` cada vez que se modifiquen. Verificar el comportamiento en el Emulador de Firebase antes de desplegar a producción. Las Cloud Functions que escriben en `/auditoria` y `/notificaciones` deben usar el Firebase Admin SDK, que omite las reglas de seguridad pero opera bajo un contexto de privilegio controlado.

---

## 10. 📊 MÉTRICAS DE EVALUACIÓN DEL SISTEMA

| Métrica | Indicador | Valor esperado | Herramienta de medición |
|---|---|---|---|
| **Precisión del modelo NLP** | F1-score en clasificación multiclase | ≥ 0.80 por cada categoría | Scikit-learn (Python): `classification_report()` |
| **Exactitud del modelo NLP** | Accuracy global | ≥ 85% | Scikit-learn `accuracy_score()` |
| **Rendimiento — tiempo de carga** | Tiempo de carga inicial del dashboard | < 3 segundos (50 usuarios concurrentes) | Lighthouse, Firebase Performance Monitoring |
| **Rendimiento — Lighthouse** | Performance Score de la SPA | ≥ 85 puntos | Google Lighthouse (Chrome DevTools) |
| **Usabilidad — SUS** | Puntuación System Usability Scale | ≥ 70 puntos | Cuestionario SUS aplicado a ≥ 5 usuarios UIDE |
| **Disponibilidad** | Uptime mensual del sistema | ≥ 98% (objetivo: ≥ 99.5%) | Firebase Hosting dashboard, UptimeRobot |
| **Precisión del distributivo** | Errores en cálculo de horas vs Reglamento CES | 0 errores en 100 casos de prueba | Tests unitarios en `calculos.test.js` |
| **Cobertura de pruebas funcionales** | Porcentaje de RF validados con pruebas | ≥ 80% de los RF | Lista de verificación de pruebas funcionales |
| **Cobertura de pruebas unitarias** | Porcentaje de funciones con tests | ≥ 60% | Vitest coverage report |
| **Seguridad Firestore** | Accesos no autorizados detectados | 0 brechas en pruebas de seguridad | Firebase Rules Playground, pruebas manuales |
| **Compatibilidad de navegadores** | Funcionalidad en navegadores objetivo | 100% funcional en Chrome, Firefox, Edge | BrowserStack o pruebas manuales |
| **Responsividad** | Adaptación a dispositivos | Sin pérdida de funcionalidad desde 320px | Chrome DevTools — vista responsiva |

> 📝 **Nota de implementación:** El cuestionario SUS debe aplicarse al final del Sprint 5 con docentes y coordinadores reales del campus Loja. Incluir mínimo 5 evaluadores de diferentes roles para que los resultados sean estadísticamente representativos. Documentar los resultados en la sección 3.2 del Capítulo III de la tesis.

---

## 📋 DATOS DE VALIDACIÓN — INSTRUMENTOS APLICADOS

> Sección incorporada el **9 de junio de 2026** a partir de los resultados de los instrumentos de investigación aplicados en el campus Loja: **entrevistas semiestructuradas** (Director de Derecho y Coordinador de Business School) y **encuestas** al personal docente. Estos datos respaldan los requerimientos RF-037 a RF-045 y RNF-018 a RNF-020, y alimentan la justificación del problema en el Capítulo III de la tesis.

| Métrica | Valor |
|---|---|
| Tiempo perdido semanal — Director Derecho | +10 horas |
| Tiempo perdido semanal — Coord. Business School | 5–10 horas |
| Margen de error proceso manual | 10–15% |
| Importancia sistema web (promedio encuestas) | 4.0 / 5 |
| Encuestados que pierden 4h+ semanales | 100% (6/6) |
| Función mejor valorada | Cálculo automático y calendario (3.67/5) |
| Consenso sobre existencia de sistema de control | 50% sí / 33% no / 17% no sabe |

> 📝 **Lectura de los datos:** La pérdida de tiempo reportada (5 a +10 h/semana) y el margen de error manual (10–15%) cuantifican el problema que el sistema resuelve. El 100% de encuestados que pierde 4h+ semanales y la valoración de importancia (4.0/5) justifican la prioridad del proyecto. La función mejor valorada (cálculo automático y calendario) confirma el foco en MOD-02 y MOD-03. La falta de consenso sobre la existencia de un sistema de control (solo 50% afirma que existe) evidencia la ausencia de una herramienta formal y centralizada.

---

## 11. 🚀 PLAN DE SPRINTS (SCRUM)

| Sprint | Objetivo | Épica | Historias de usuario incluidas | Duración | Entregable verificable | Criterio de aceptación |
|---|---|---|---|---|---|---|
| **Sprint 0 — Setup** | Configurar la base del proyecto, autenticación Microsoft y modelo de datos por carrera | EP-01: Fundamentos del sistema | HU-01: Como desarrollador, quiero configurar Firebase con Microsoft Azure AD. HU-02: Como usuario, quiero iniciar sesión con mi cuenta @uide.edu.ec. HU-03: Como admin, quiero que el sistema asigne roles automáticamente al primer login. HU-35: Como desarrollador, quiero cargar los datos semilla (seed) de carreras y usuarios de prueba en Firestore para que el sistema tenga datos reales desde el primer despliegue. | Mar 16 – Abr 5, 2026 | Login funcional + asignación de rol automática + Firestore con colecciones /carreras y /usuarios seed inicializadas | Usuario puede autenticarse con @uide.edu.ec, ver su rol y su carrera en el dashboard básico; Admin ve todas las carreras |
| **Sprint 1 — Distributivo** | Implementar CRUD completo del distributivo con cálculo automático | EP-02: Gestión del Distributivo | HU-04: Como director, quiero crear el distributivo de un docente. HU-05: Como director, quiero que el sistema calcule automáticamente las horas. HU-06: Como docente, quiero visualizar mi distributivo del período activo. HU-07: Como director, quiero aprobar un distributivo validado. | Abr 6 – Abr 26, 2026 | Módulo de distributivo funcional con todas las fórmulas de cálculo y validación de 40h | El sistema calcula correctamente las 40h en 100 casos de prueba; validación de cierre funciona |
| **Sprint 2 — Calendario** | Integrar sincronización de Outlook via Microsoft Graph API | EP-03: Integración de Calendarios | HU-08: Como docente, quiero autorizar el acceso a mi calendario Outlook. HU-09: Como docente, quiero ver mis eventos Outlook sincronizados en el sistema. HU-10: Como sistema, quiero sincronizar eventos automáticamente cada 24 horas. | Abr 27 – May 17, 2026 | Cloud Function de sincronización desplegada + vista de calendario con eventos de Outlook | Los eventos de Outlook aparecen en el sistema ≤ 5 minutos después de la sincronización |
| **Sprint 3 — IA/NLP** | Implementar clasificación automática de actividades con BETO | EP-04: Inteligencia Artificial | HU-11: Como sistema, quiero clasificar eventos de calendario con BETO. HU-12: Como docente, quiero ver la categoría asignada a cada evento. HU-13: Como docente, quiero corregir la clasificación incorrecta de un evento. HU-14: Como sistema, quiero guardar las correcciones para mejorar el modelo. | May 18 – Jun 7, 2026 | Cloud Function BETO desplegada + panel de clasificación funcional + colección feedback activa | El modelo clasifica correctamente ≥ 80% de los eventos en el conjunto de validación |
| **Sprint 4 — Dashboard** | Implementar dashboard de cumplimiento e indicadores en tiempo real | EP-05: Visualización | HU-15: Como coordinador, quiero ver el porcentaje de cumplimiento de todos los docentes. HU-16: Como director, quiero ver alertas de incumplimiento activas. HU-17: Como docente, quiero ver mi propio porcentaje de cumplimiento semanal. | Jun 8 – Jul 5, 2026 | Dashboard con gráficos de cumplimiento en tiempo real usando Firestore onSnapshot | El dashboard se actualiza automáticamente ante cambios en Firestore sin recargar la página |
| **Sprint 5 — Reportes** ✅ COMPLETADO | Implementar generación de reportes, notificaciones, pruebas del sistema e integraciones Outlook | EP-06: Reportes y Calidad | HU-18: Como coordinador, quiero generar un reporte PDF institucional con firmas de validación cruzada. HU-19: Como coordinador, quiero recibir notificaciones automáticas de incumplimiento. HU-20: Como auditor, quiero consultar el historial de cambios del distributivo. HU-24: Como docente, quiero etiquetar correos en Outlook con DIST/* y verlos en el sistema. HU-25: Como docente, quiero un flujo de autorización cuando mis horas TP superen 12h. HU-26: Como docente, quiero confirmar mi distributivo para que quede oficialmente aprobado (validación cruzada). | Jul 6 – Ago 2, 2026 | Módulo de reportes PDF institucional + notificaciones push activas + integración etiquetas Outlook + validación cruzada funcional | Reporte PDF con firma y código CACES + etiquetas DIST/* registran actividades en Firestore + validación cruzada director-docente activa |
| **Sprint 6 — Integración Final y Nuevas Funcionalidades** | Períodos con historial, horario gráfico, previsualización PDF, modales Liquid Glass, módulos Mis Actividades y Planet, Firebase real, despliegue a producción | EP-07: Calidad y Entrega | HU-21: Como usuario, quiero que el sistema funcione sin errores en los navegadores objetivo. HU-22: Como desarrollador, quiero desplegar el sistema en Firebase Hosting producción. HU-23: Como tesis, quiero redactar el Capítulo III con los resultados del sistema. HU-27: Como docente/director/coordinador, quiero gestionar mis actividades en el tablero Kanban (Mis Actividades). HU-28: Como docente, quiero ver un resumen visual por semana y categoría en el módulo Planet. HU-29: Como director, quiero ver el horario gráfico semanal de cualquier docente y detectar cruces. HU-30: Como director, quiero crear distributivos mediante Modal con Liquid Glass. HU-31: Como director/docente, quiero ver la previsualización editable antes de descargar un PDF. HU-32: Como director, quiero navegar el historial de los últimos 5 períodos académicos. HU-33: Como director, quiero que al cerrar un período se cree automáticamente el siguiente vacío. HU-34: Como director, quiero que cada período tenga su propia lista de docentes independiente. | Ago 3 – Ago 21, 2026 | Firebase real conectado + módulos Mis Actividades y Planet + horario gráfico + previsualización PDF + períodos con historial + modales Liquid Glass + despliegue producción + Capítulo III redactado | 0 errores críticos + SUS ≥ 70 + tesis aprobada por el tutor |

> 📝 **Nota de implementación:** Cada Sprint debe terminar con una Sprint Review con el tutor de tesis y, cuando sea posible, con el Director o Coordinador de la UIDE campus Loja. Documentar la retroalimentación obtenida en el Sprint Retrospective y ajustar el Product Backlog para el siguiente Sprint.

---

## 12. ⚠️ CORRECCIONES Y DECISIONES TÉCNICAS

### 12.1 Correcciones de Redacción Académica

- El término correcto es **campus Loja** (no "sede Loja") en todos los documentos institucionales, instrumentos de investigación y vistas del sistema.
- Los instrumentos de investigación distinguen correctamente los destinatarios: **entrevistas** para Coordinadores y Directores; **encuestas** para docentes y personal administrativo.
- Los roles de acceso corregidos según el tutor: **Director** tiene gestión, aprobación y asignación; **Coordinador** tiene solo lectura y reportes (no al revés como se tenía originalmente).
- La sección 2.5.5 del Capítulo II (Validación global de las 40 horas) permanece pendiente de redacción hasta tener datos reales de la entrevista.
- Los resultados de las secciones 2.1.3 (entrevistas) y 2.1.4 (encuestas) se redactarán después de aplicar los instrumentos.

### 12.2 Decisiones de Arquitectura Justificadas

**¿Por qué Firebase (serverless)?**
Firebase elimina la necesidad de administrar un servidor físico o virtual, reduce el costo operativo a prácticamente cero durante el desarrollo académico, escala automáticamente ante incrementos de demanda, y ofrece integración nativa con herramientas de IA mediante extensiones. Para un proyecto de tesis unipersonal sin presupuesto para infraestructura, es la solución más eficiente.

**¿Por qué BETO y no GPT u otro LLM externo?**
BETO (dccuchile/bert-base-spanish-wwm-cased) es un modelo open-source entrenado específicamente en español, ejecutable localmente en una Cloud Function de Python sin costos de API externos, adecuado para clasificación multiclase de texto corto (títulos y descripciones de eventos de calendario), y con un rendimiento documentado superior al 80% en tareas de clasificación de texto en español. Los LLMs comerciales como GPT generan dependencia de API de pago y latencia variable, incompatibles con los requerimientos de disponibilidad del sistema.

**¿Por qué Microsoft Graph API?**
La UIDE utiliza Microsoft 365 como plataforma institucional para correo electrónico y calendarios (Outlook). La integración con Microsoft Graph API es la única forma nativa y segura de sincronizar los calendarios institucionales de los docentes sin requerir que ingresen manualmente sus actividades al sistema.

**¿Por qué React.js?**
React permite construir una SPA (Single Page Application) con componentización reutilizable, ecosistema maduro compatible con el Firebase SDK oficial, soporte nativo de hooks para gestión de estado reactivo con Firestore en tiempo real (`onSnapshot`), y una curva de aprendizaje adecuada para un desarrollador individual de pregrado.

**¿Por qué SCRUM?**
SCRUM permite entregar incrementos verificables del sistema en ciclos cortos de 2-3 semanas, facilita la revisión periódica con el tutor de tesis como Product Owner, y se adapta a los cambios de requerimientos que surgen durante las entrevistas y encuestas de la investigación.

### 12.3 Correcciones de Presupuesto

El presupuesto total correcto del proyecto es **$160 USD**, no $1,360 USD. El costo se distribuye en: Firebase plan Blaze (pay-as-you-go, costo mínimo para uso académico), dominio web institucional (asumido por la UIDE), y materiales de investigación (impresión de instrumentos, transporte para entrevistas).

### 12.4 Recomendaciones de Seguridad Firestore

- Nunca usar `allow read, write: if true;` en ninguna colección en producción
- Implementar funciones helper en `firestore.rules` para verificar roles en lugar de consultar directamente el documento
- Usar `request.auth.token.email` para verificar que el email pertenece al dominio @uide.edu.ec en la regla de autenticación
- Probar todas las reglas en el Firebase Rules Playground antes de desplegar

### 12.5 Manejo de Deprecaciones Firebase SDK

- Usar Firebase SDK v9+ con importaciones modulares (tree-shaking) en lugar de la API de compatibilidad v8
- Ejemplo correcto: `import { getFirestore, collection, onSnapshot } from 'firebase/firestore'`
- Evitar el uso de `firebase.database()` (Realtime Database); usar exclusivamente Firestore

### 12.6 Patrón de UI: Modales con Liquid Glass

**Decisión:** Todos los formularios del sistema (crear actividad, agregar docente, crear distributivo, asignar período, etc.) se abren en Modales, nunca en páginas separadas. Este patrón aplica a todos los roles y vistas.

**Efecto Liquid Glass:** Cuando un Modal se abre, el contenido detrás del modal recibe:
- `backdrop-blur` (desenfoque del fondo)
- Reducción de opacidad del contenido de fondo
- Overlay semitransparente oscuro

**Implementación con Tailwind CSS:**
```jsx
// Overlay del Modal (fondo)
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Capa Liquid Glass */}
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCerrar} />
  {/* Contenido del Modal */}
  <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
    {children}
  </div>
</div>
```

**Por qué Modales y no páginas separadas:**
Los formularios en Modal permiten al usuario mantener el contexto visual de la vista actual mientras completa una acción puntual, reduciendo la fricción de navegación. Este patrón es estándar en sistemas de gestión modernos (Notion, Linear, Trello) y mejora la puntuación SUS al reducir los pasos de navegación.

### 12.7 Vista de Horario Gráfico del Distributivo

**Decisión:** Implementar como una cuadrícula CSS donde las filas son horas (07:00–22:00) y las columnas son días (L–S). Los bloques de actividad se posicionan con `grid-row` calculado a partir de la hora de inicio y duración.

**Franja de almuerzo bloqueada:** La franja 13:00–14:00 se renderiza como una fila con fondo diferenciado (`bg-gray-100 text-gray-400`) y sin interactividad. No puede recibir bloques de actividad.

**Detección de cruces:** Antes de guardar una actividad con horario, el sistema verifica que no exista otra actividad del mismo docente en el mismo día que se solape con el rango `[hora_inicio, hora_fin)` del nuevo bloque.

> 📝 **Nota de implementación:** Mantener este archivo actualizado al final de cada Sprint con las decisiones técnicas tomadas durante el desarrollo. Las decisiones de arquitectura justificadas en este documento pueden incluirse directamente en la sección de Metodología del Capítulo II de la tesis.

### 12.8 Módulo Mis Actividades — Tablero Kanban con Vista Estadísticas Integrada

**Decisión:** Fusionar el antiguo módulo "Planet" (resumen visual) con el módulo de gestión de actividades en una sola página (`MisActividadesPage.jsx`) con un toggle "Tablero | Estadísticas".

**Por qué la fusión:**
Los dos módulos consumían la misma fuente de datos (`getActividades`) pero existían como páginas separadas. Esto creaba incoherencia: mover una actividad a "En progreso" en el Tablero no se reflejaba automáticamente en el resumen de Mi Progreso hasta el siguiente render de esa página. Con la fusión, ambas vistas comparten el mismo estado React (`actividades`), eliminando cualquier posibilidad de desincronización.

**Implementación del toggle sin segundo fetch:**
```jsx
const stats = useMemo(() => {
  // Derivado del mismo `actividades` useState — 0 fetchs adicionales
  return { total, completadas, enProgreso, pct, porCategoria }
}, [actividades])

// La vista Estadísticas recibe stats y actividades como props; no fetchea nada
{vista === 'tablero' ? <KanbanBoard /> : <VistaEstadisticas stats={stats} actividades={actividades} />}
```

**Drag & Drop con HTML5 nativo (sin librería):**
Se usa la API HTML5 nativa (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) para evitar dependencias adicionales. El ID del elemento arrastrado se guarda en un `useRef` para evitar cierres stale. La actualización optimista del estado ocurre antes del `await moverActividad(id, nuevoEstado)`, garantizando respuesta visual inmediata.

### 12.9 Períodos Académicos — Nomenclatura de Estados

**Decisión:** Unificar los estados del período académico a tres valores canónicos:

| Estado | Significado |
|---|---|
| `"activo"` | El período en curso. Solo puede existir uno simultáneamente. |
| `"finalizado"` | Período concluido con todos sus distributivos archivados. Reemplaza "cerrado" y "archivado" de versiones anteriores. |
| `"proximo"` | Período creado automáticamente al cerrar el activo. Vacío: sin docentes, distributivos ni actividades. |

**Por qué simplificar a 3 estados:**
Los estados "cerrado", "archivado" y "planificacion" del modelo de datos inicial generaban confusión en la UI y en las reglas de negocio. Con tres estados simples se cubre el ciclo completo del período académico sin ambigüedad.

---

### 12.10 Conflicto de Roles: docente_tc/mt/tp → docente + tipo_contrato

**Conflicto identificado:**
El código del frontend (v1.3.0 y anteriores) usa tres sub-roles distintos: `"docente_tc"`, `"docente_mt"`, `"docente_tp"` en las constantes `ROLES` de `src/utils/constants.js`, en `AppRouter.jsx` (listas `DOCENTES`) y en `Sidebar.jsx` (menú por rol). El nuevo modelo de datos consolida estos en un único rol `"docente"` con el campo `tipo_contrato`.

**Archivos afectados en el frontend:**
```plaintext
src/utils/constants.js      → ROLES.DOCENTE_TC, ROLES.DOCENTE_MT, ROLES.DOCENTE_TP
src/router/AppRouter.jsx    → const DOCENTES = [ROLES.DOCENTE_TC, ROLES.DOCENTE_MT, ROLES.DOCENTE_TP]
src/components/Sidebar.jsx  → MENU[ROLES.DOCENTE_TC], MENU[ROLES.DOCENTE_MT], MENU[ROLES.DOCENTE_TP]
src/modules/auth/useAuth.js → comparaciones por rol de docente
```

**Plan de migración (Sprint 6 — conexión Firebase real):**
1. Actualizar `constants.js`: eliminar `DOCENTE_TC/MT/TP`; añadir `DOCENTE: 'docente'`
2. Actualizar `AppRouter.jsx`: `DOCENTES = [ROLES.DOCENTE]`; las restricciones de horas (40h/20h) se leen del campo `tipo_contrato` del usuario, no del rol
3. Actualizar `Sidebar.jsx`: el menú docente es el mismo para TC/MT/TP; las diferencias de permisos dentro del módulo se resuelven por `tipo_contrato`
4. El mock de localStorage (`authService.js`) ya puede usar el nuevo modelo desde ya; los datos de prueba usan `rol: "docente"` + `tipo_contrato`

**Decisión de compatibilidad:**
Mientras no se migre el frontend (Sprint 6), el mock de `authService.js` puede seguir retornando `"docente_tc"` etc. para mantener compatibilidad con el router existente. La migración es atómica: ocurre cuando se conecta Firebase real y se reemplaza el mock.

---

### 12.11 Migración de rol escalar a `roles` (array) — multi-rol

**Hallazgo (entrevistas del 9-jun-2026):**
Un mismo usuario puede ejercer **más de un rol de forma simultánea**. El caso confirmado es un funcionario que es a la vez **Director y Coordinador** de su carrera. El modelo escalar `rol: "director"` no puede representar esto sin perder permisos.

**Decisión:**
Reemplazar el campo escalar `rol` (string) por `roles` (array de strings) en la colección `/usuarios`. Toda verificación de pertenencia a un rol pasa de la comparación `rol === "x"` a la pertenencia `roles.includes("x")` (frontend) y `'x' in getRoles()` (reglas de Firestore).

**Estado del modelo (PROJECT.md, fuente de verdad):** ✅ migrado.
- COL-001 `/usuarios`: campo `roles: array<string>` (antes `rol: string`).
- Datos semilla (`USUARIOS_SEED`): los 5 usuarios usan `roles: [...]`.
- Reglas de Firestore: `getRoles()`, con `esAdmin/esDirector/esCoordinador` evaluando `'x' in getRoles()`.

**Estado del frontend:** ⏳ pendiente — el código aún lee `user.rol` (string). Archivos a migrar (`rol === "x"` → `roles.includes("x")`):
```plaintext
src/services/authService.js          → perfil mock/real: rol → roles (array)
src/context/AuthContext.jsx          → logs y propagación del perfil (perfil.rol)
src/components/ProtectedRoute.jsx     → roles.includes(user.rol) → user.roles.some(r => rolesPermitidos.includes(r))
src/modules/auth/RoleGuard.jsx        → comparación de rol
src/router/AppRouter.jsx              → listas de roles permitidos por ruta
src/components/Sidebar.jsx            → menú por rol → unión de menús de todos los roles del usuario
src/components/Navbar.jsx             → etiqueta de rol mostrada (varios roles)
src/services/seedData.js, firestoreInitService.js → seed con roles: [...]
src/utils/constants.js               → helpers de rol
+ servicios/vistas que lean el rol para filtrar (personalService, distributivoService, AdminPage, UsuariosTable, DashboardPage, etc.)
```

**Plan de ejecución:** Esta migración se realiza **junto con la migración de subtipos de docente (§12.10)** en Sprint 6, al conectar Firebase real y reemplazar el mock. Ambas tocan los mismos archivos (`authService.js`, `AppRouter.jsx`, `Sidebar.jsx`, `constants.js`), por lo que ejecutarlas en un solo paso evita refactorizar dos veces y reduce el riesgo de regresiones. Para mostrar el rol "principal" en la UI (p. ej. Navbar), se define una jerarquía `admin > director > coordinador > docente` y se toma el de mayor nivel presente en `roles`.

> ✅ **Estado:** ejecutada (jun-2026). Ver §12.12 para el modelo RBAC completo.

---

### 12.12 Modelo RBAC: tipos base de usuario + cargos institucionales

**Decisión:**
Los cargos institucionales NO son tipos de usuario independientes, sino **roles asignables sobre un docente**. El modelo distingue:

| Categoría | Valores (`roles[]`) | Regla |
|---|---|---|
| **Tipos base** | `docente`, `administrativo` | Todo usuario tiene al menos uno |
| **Cargos institucionales** | `coordinador` (Coordinador de Carrera), `director`, `admin` (Prorrector), `superadmin` (Administrador del Sistema), otros futuros | Todo cargo lo ejerce un docente: al asignar un cargo se añade `docente` automáticamente. Los únicos usuarios que no necesariamente son docentes son los administrativos |

**Implementación:**
- `constants.js`: `TIPOS_BASE_USUARIO` y `CARGOS_INSTITUCIONALES`
- `UsuarioForm` (panel TIC): selección múltiple por checkboxes agrupados (tipo base + cargos); regla docente-automático aplicada en `toggleRol`; el rol principal se deriva por jerarquía al guardar
- `guardarUsuario`: persiste `roles[]` tal como los seleccionó el superadmin
- Visibilidad: el usuario con funciones docentes y cargo ve **fusionados** los módulos docentes y los de sus cargos (Sidebar concatena los menús de todos sus roles; `RoleGuard` permite el acceso si cualquiera de sus roles está autorizado)
- Por período: la estructura jerárquica (§COL-003/carreras) almacena `director_uid` y `coordinador_uid` propios de cada período — los cargos pueden reasignarse semestre a semestre sin alterar el historial

**Ejemplos válidos:** docente+coordinador · docente+coordinador+director · docente+admin (Prorrector que registra sus actividades académicas) · docente+superadmin (Administrador del Sistema que también dicta clases) · administrativo (único caso no-docente).

---

### 12.13 RBAC dinámico: roles, módulos y acciones como DATOS

**Decisión:**
La visualización de módulos, menús y funcionalidades NO depende de listas codificadas por rol: se construye dinámicamente a partir de **definiciones de rol almacenadas como datos**, editables por el superadmin sin modificar el código fuente.

**Arquitectura:**

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Registro de módulos | `src/utils/modulos.js` | Catálogo único de módulos del sistema (id, label, ruta, ícono, acciones soportadas: visualizar/crear/editar/aprobar/eliminar/exportar/administrar) |
| Definiciones de rol | `src/services/rolesService.js` + colección `/roles_definicion` | Cada rol declara sus `modulos[]` y `acciones{}`. Los 6 roles de sistema vienen sembrados (`ROLES_DEFAULT`); los personalizados se crean desde la UI. `activo: false` retira los permisos sin borrar el rol |
| Permisos acumulativos | `computarPermisos(rolesUsuario, definiciones)` | UNIÓN de módulos y acciones de todos los roles activos del usuario (función pura, testeada) |
| Hook de permisos | `src/hooks/usePermisos.js` | `tieneModulo(id)` / `tieneAccion(modulo, accion)` para menú, rutas y botones |
| Menú dinámico | `Sidebar.jsx` | Se construye filtrando el registro de módulos con los permisos del usuario — la interfaz nunca depende de un único rol |
| Guard por módulo | `src/modules/auth/ModuloGuard.jsx` | Las rutas validan el MÓDULO, no roles fijos: un rol personalizado nuevo otorga acceso a sus rutas sin tocar el router |
| UI de administración | `src/modules/sistema/GestionRoles.jsx` (pestaña "Roles y Permisos") | Crear/modificar roles, activar/desactivar, y definir módulos+acciones por rol con checkboxes |
| Acciones en lógica | ej. `GestionDistributivoPage` | `tieneAccion('distributivos','aprobar')` gobierna la aprobación (potestad configurable, ya no atada al rol "director") |

**Flujo verificado E2E:** el superadmin crea el rol "Auditor CACES" (módulos Reportes + Auditoría) → el rol aparece como cargo asignable en Usuarios y Roles → un docente con ese rol ve en su menú los módulos docentes MÁS Auditoría/Reportes y accede a `/admin/auditoria` sin que exista ninguna referencia al rol en el código.

> Los cargos asignables del formulario de usuario provienen de las definiciones activas (no de constantes), por lo que la estructura escala a nuevos cargos institucionales, carreras y períodos sin modificar el código fuente.

---

## 13. 🔗 DEPENDENCIAS Y TECNOLOGÍAS

| Tecnología | Versión | Propósito | Justificación |
|---|---|---|---|
| **React.js** | 18.x | Framework frontend SPA | Componentización, hooks, ecosistema Firebase SDK, rendimiento |
| **Vite** | 5.x | Bundler y servidor de desarrollo | Compilación ultrarrápida, hot reload, soporte JSX nativo |
| **Tailwind CSS** | 3.x | Framework de estilos utilitarios | Diseño responsivo sin CSS personalizado, consistencia visual |
| **Firebase SDK** | 10.x (modular) | BaaS completo: Auth, Firestore, Storage, Hosting | Serverless, sin servidor, escalable, integración Microsoft OAuth |
| **Microsoft Graph API** | v1.0 | Sincronización de calendarios Outlook y extracción de correos etiquetados DIST/* | La UIDE usa Microsoft 365 como plataforma institucional. Permisos requeridos: `Calendars.Read`, `Mail.Read`, `User.Read`, `offline_access` |
| **MSAL.js** | 3.x | Autenticación Microsoft OAuth 2.0 en React | Librería oficial de Microsoft para Azure AD en aplicaciones SPA |
| **React Router DOM** | 6.x | Enrutamiento de la SPA | Rutas protegidas por rol, navegación declarativa |
| **Recharts** | 2.x | Visualización de datos y gráficos | Compatible con React, gráficos SVG responsivos |
| **pdfmake** | 0.2.x | Generación de reportes PDF en el cliente | Open-source, sin dependencia de servidor para PDFs pequeños |
| **SheetJS (xlsx)** | 0.18.x | Exportación a Excel | Estándar para manipulación de archivos XLSX en JavaScript |
| **Python** | 3.11 | Lenguaje de Cloud Functions de IA | Ecosistema de ML/NLP maduro (PyTorch, Transformers, scikit-learn) |
| **Hugging Face Transformers** | 4.40.x | Carga y uso del modelo BETO | Librería estándar de la industria para modelos de lenguaje |
| **BETO** | bert-base-spanish-wwm-cased | Modelo NLP para clasificación en español | Open-source, sin costo API, entrenado en español, F1 ≥ 80% |
| **PyTorch** | 2.x | Framework de deep learning para inferencia BETO | Requerido por Hugging Face Transformers |
| **scikit-learn** | 1.4.x | Métricas de evaluación del modelo NLP | F1-score, precision, recall, accuracy |
| **Firebase Admin SDK** | 6.x (Python) | Cloud Functions con acceso privilegiado a Firestore | Escritura en colecciones de auditoría y notificaciones |
| **Vitest** | 1.x | Tests unitarios para funciones de cálculo | Compatible con Vite, rápido, sintaxis Jest |
| **ESLint** | 8.x | Análisis estático de código JavaScript | Consistencia de código y detección temprana de errores |

> 📝 **Nota de implementación:** Verificar que las versiones de PyTorch y Transformers sean compatibles con el entorno de ejecución de Firebase Cloud Functions (Python 3.11). El modelo BETO fine-tuned debe subirse a Firebase Storage y cargarse con caché global en la Cloud Function para evitar la descarga en cada invocación.

---

## 14. 📋 GLOSARIO

| Término | Definición |
|---|---|
| **Distributivo académico** | Documento institucional que planifica y asigna la carga horaria semanal del docente universitario en las cuatro categorías oficiales: Docencia, Investigación, Vinculación con la Sociedad y Gestión Académica. Debe sumar exactamente las horas del contrato del docente. |
| **Matriz de productividad** | Herramienta complementaria al distributivo que registra el cumplimiento real de las actividades planificadas del docente, utilizada como evidencia en los procesos de evaluación y acreditación institucional. |
| **BETO** | Modelo de lenguaje basado en la arquitectura BERT, preentrenado en corpus en español por el Departamento de Ciencias de la Computación de la Universidad de Chile (dccuchile). Sus siglas corresponden a "BERT en español". Es el modelo NLP utilizado en este sistema para clasificar actividades docentes. |
| **NLP (Natural Language Processing)** | Procesamiento de Lenguaje Natural (PLN). Subdisciplina de la inteligencia artificial que permite a los sistemas computacionales comprender, interpretar y generar texto en lenguaje humano mediante algoritmos y modelos lingüísticos. |
| **PLN** | Procesamiento de Lenguaje Natural. Equivalente en español del término NLP. En este proyecto se utiliza para clasificar automáticamente los eventos del calendario de Outlook en categorías del distributivo académico. |
| **Serverless** | Paradigma de computación en la nube en el que el proveedor administra dinámicamente la asignación de servidores. El desarrollador solo escribe funciones que se ejecutan bajo demanda. Firebase Cloud Functions es la implementación serverless utilizada en este proyecto. |
| **Firestore** | Base de datos NoSQL de tipo documental ofrecida por Firebase/Google Cloud. Organiza los datos en colecciones y documentos, con soporte nativo para actualizaciones en tiempo real mediante el método `onSnapshot`. |
| **Cloud Functions** | Funciones ejecutadas en la nube de Google/Firebase bajo demanda o disparadas por eventos. En este proyecto se usan para: clasificación IA con BETO, sincronización de calendarios con Microsoft Graph API y envío de notificaciones. |
| **Microsoft Graph API** | API REST de Microsoft que proporciona acceso unificado a los datos y servicios de Microsoft 365, incluyendo calendarios de Outlook, correo electrónico, usuarios de Azure AD y archivos de OneDrive. |
| **OAuth 2.0** | Protocolo de autorización estándar que permite a aplicaciones de terceros obtener acceso limitado a cuentas de usuario sin exponer las credenciales. Utilizado para autenticar usuarios UIDE con sus cuentas Microsoft y para autorizar el acceso al calendario Outlook. |
| **LOES** | Ley Orgánica de Educación Superior del Ecuador. Marco jurídico que regula la organización, funcionamiento y gestión del sistema de educación superior ecuatoriano, incluyendo los derechos y obligaciones del personal académico. |
| **CES** | Consejo de Educación Superior del Ecuador. Organismo público encargado de planificar, regular y coordinar el sistema de educación superior. Emite el Reglamento de Carrera y Escalafón que regula la distribución de horas docentes. |
| **CACES** | Consejo de Aseguramiento de la Calidad de la Educación Superior. Organismo técnico responsable de la evaluación y acreditación de las instituciones de educación superior en Ecuador. Exige evidencia documentada del cumplimiento del distributivo académico. |
| **SUS (System Usability Scale)** | Escala estandarizada de 10 preguntas para medir la usabilidad percibida de un sistema. Las puntuaciones van de 0 a 100, donde ≥ 70 indica usabilidad aceptable, ≥ 85 indica usabilidad excelente. |
| **TC / MT / TP** | Tipos de contrato docente según el Reglamento CES 2021: Tiempo Completo (40h/semana), Medio Tiempo (20h/semana) y Tiempo Parcial (mínimo 4h/semana, según contrato individual). |
| **Sprint** | Iteración de desarrollo de duración fija (2-3 semanas) dentro de la metodología SCRUM, al final de la cual se entrega un incremento funcional y verificable del sistema. |
| **Épica (Épica de usuario)** | Requerimiento de alto nivel que agrupa múltiples historias de usuario relacionadas dentro de una funcionalidad mayor del sistema. Ejemplo: "EP-02: Gestión del Distributivo Académico". |
| **Historia de usuario** | Descripción breve de una funcionalidad desde la perspectiva del usuario final, con la estructura: "Como [rol], quiero [acción] para [beneficio]". Son la unidad básica de planificación del Sprint Backlog. |
| **Firebase Auth** | Servicio de autenticación de Firebase que soporta múltiples proveedores de identidad (Google, Microsoft, email/contraseña). En este proyecto se usa con Microsoft Azure AD para autenticar cuentas institucionales @uide.edu.ec. |
| **Token JWT** | JSON Web Token. Estándar de representación de información entre partes como un objeto JSON firmado digitalmente. Firebase Authentication emite tokens JWT que el sistema usa para verificar la identidad y los permisos del usuario en cada solicitud. |
| **Pipeline NLP** | Secuencia de pasos de procesamiento de texto que transforma el texto crudo en una representación numérica utilizable por el modelo de clasificación: normalización → eliminación de stopwords → tokenización → vectorización → inferencia con BETO. |
| **Fine-tuning** | Proceso de ajuste fino de un modelo de lenguaje preentrenado (como BETO) con datos específicos del dominio (eventos de calendario de docentes UIDE) para mejorar su rendimiento en la tarea de clasificación de actividades académicas. |
| **Firestore Rules** | Sistema de reglas declarativas de seguridad de Firestore que controla quién puede leer o escribir cada documento de la base de datos, implementando el control de acceso basado en roles a nivel de base de datos. |
| **F1-score** | Métrica de evaluación de modelos de clasificación que representa la media armónica entre Precision y Recall. Es especialmente útil cuando las clases están desbalanceadas. Umbral mínimo requerido en este proyecto: F1 ≥ 0.80. |
| **Etiqueta Outlook (DIST/*)** | Categoría asignada manualmente por el docente a un correo en Microsoft Outlook usando la nomenclatura DIST/ seguida de la categoría: DIST/Docencia, DIST/Investigación, DIST/Vinculación, DIST/Gestión, DIST/TP-Horas. El sistema lee estas etiquetas mediante Microsoft Graph API y registra automáticamente las actividades correspondientes en Firestore. No se usa Gmail en ninguna parte del sistema. |
| **Validación cruzada del distributivo** | Mecanismo de aprobación en dos pasos definido en RN-019: el distributivo académico solo alcanza estado "aprobado" cuando tanto la Directora de Carrera como el docente propietario han confirmado su revisión de forma independiente. Si cualquiera observa, el distributivo regresa a "en_revision". |
| **Módulo Mis Actividades** | Módulo interno del sistema (MOD-09) que permite al docente y a roles de gestión organizar actividades personales en un tablero Kanban de tres columnas: "Por hacer", "En progreso" y "Completadas". Incluye una vista de Estadísticas integrada con progreso por categoría CES y gráfico semanal, alimentada del mismo estado que el tablero (sin fetch adicional). Los formularios se abren en Modal con Liquid Glass. Reemplaza al antiguo módulo To Do. |
| **Kanban** | Metodología visual de gestión de trabajo que organiza tareas en columnas que representan su estado de avance. En este sistema, el tablero Kanban del módulo Mis Actividades usa drag & drop nativo del navegador para mover actividades entre las columnas "Por hacer", "En progreso" y "Completadas". |
| **Módulo Planet** | Conjunto de componentes reutilizables de visualización (MOD-10): `PlanetCategoria.jsx` para mostrar el progreso por categoría CES y `PlanetSemanaChart.jsx` para el gráfico de actividades acumuladas por semana. Estos componentes son utilizados por el módulo Mis Actividades en su vista Estadísticas. |
| **Flujo de autorización TP** | Proceso en dos niveles definido en RN-018 que se activa cuando un docente Tiempo Parcial intenta ingresar más de 12 horas semanales. Nivel 1: Directora de Carrera revisa y aprueba. Nivel 2: Autoridad Superior (Rectorado) aprueba definitivamente, solo si el Nivel 1 ya aprobó. |
| **DIST/TP-Horas** | Etiqueta especial de Outlook usada por docentes con contrato Tiempo Parcial para registrar horas en actividades específicas de su modalidad contractual. Se mapea internamente como categoría de gestión con validación de límite TP (RN-018). |
| **Liquid Glass** | Efecto visual de interfaz aplicado a los Modales del sistema. Consiste en un overlay semitransparente oscuro combinado con desenfoque del contenido detrás del modal (`backdrop-blur`). Proporciona jerarquía visual clara y contexto de foco. Implementado con Tailwind CSS (`backdrop-blur-sm`, `bg-black/40`). |
| **Vista de horario** | Representación gráfica tipo calendario semanal del distributivo docente, organizada por columnas (días lunes a sábado) y filas (franjas horarias 07:00–22:00). Las actividades aparecen como bloques coloreados según su categoría CES. La franja 13:00–14:00 está bloqueada como almuerzo. |
| **Historial de períodos** | Registro navegable de los períodos académicos pasados. El sistema muestra por defecto los últimos 5 períodos, permitiendo al Director consultar los distributivos, docentes y estadísticas de cualquier período anterior en modo solo lectura (RN-022). |
| **Período próximo** | Estado de un período académico que ha sido creado automáticamente por el sistema al cerrar el período activo, pero que aún no tiene docentes asignados ni ha sido activado. El Director configura sus datos antes de activarlo (RN-021). |
| **Cruce horario** | Conflicto que ocurre cuando dos actividades del mismo docente se asignan a la misma franja de tiempo en el mismo día. El sistema detecta y bloquea estos cruces al asignar bloques en la vista de horario gráfico (RN-024). |
| **Previsualización PDF** | Pantalla obligatoria que el usuario visualiza antes de descargar cualquier reporte PDF o Excel. Muestra el borrador del documento con la posibilidad de editar campos visibles. La descarga definitiva ocurre únicamente después de confirmar desde esta pantalla (RN-025). |
| **Modal** | Componente de interfaz que se superpone a la pantalla actual sin navegar a una página nueva. En este sistema, todos los formularios de creación y edición se implementan como modales con efecto Liquid Glass. Patrón aplicado a todos los roles y vistas (RF-035). |
| **Admin (Pro-Rector)** | Rol de mayor nivel en el sistema (Nivel 1). Corresponde al Pro-Rector del campus Loja. Tiene acceso global a todas las carreras, usuarios, periodos, reportes y configuracion del sistema. Usuario de prueba: Pablo Ruiz Aguirre (paruizag@uide.edu.ec). |
| **Director de Carrera** | Rol de Nivel 2. Gestiona docentes, distributivos y periodos de su carrera exclusivamente. Aprueba distributivos y genera reportes. No puede acceder a datos de otras carreras. Usuario de prueba: Lorena Elizabeth Conde Zhingre (locondezh@uide.edu.ec). |
| **Coordinador Academico** | Rol de Nivel 3. Apoya la revision de distributivos y gestion de usuarios de su carrera, pero sin potestad de aprobar distributivos. Acceso de lectura a reportes de su carrera. Usuario de prueba: Dario Javier Valarezo Leon (davalarezole@uide.edu.ec). |
| **tipo_contrato** | Campo del documento de usuario en Firestore que indica la modalidad contractual: tiempo_completo (40h/semana), medio_tiempo (20h/semana), tiempo_parcial (segun contrato), honorario. Reemplaza los sub-roles docente_tc/mt/tp del codigo anterior. |
| **carrera_id** | Campo de referencia en los documentos de usuarios, distributivos y periodos_academicos que vincula cada entidad a una carrera especifica. Es el mecanismo principal para el control de acceso por carrera en las reglas de Firestore. |
| **Seed / Datos semilla** | Conjunto de documentos iniciales cargados en Firestore al desplegar el sistema por primera vez. Incluye las 7 carreras del campus Loja y los 5 usuarios de prueba de Ingenieria en Sistemas. |
| **Carrera** | Unidad organizativa representada en la coleccion /carreras. Cada carrera tiene un director, un coordinador y su propia lista de docentes, distributivos y periodos. El campus Loja tiene 7 carreras activas. |
| **mismaCarrera()** | Funcion helper en las reglas de Firestore que verifica si el carrera_id de un documento coincide con el carrera_id del usuario autenticado. Es la implementacion del control de acceso por carrera. |
---

## 📄 INFORMACIÓN DEL DOCUMENTO

| Campo | Detalle |
|---|---|
| **Versión** | 1.4.0 |
| **Fecha de creación** | Mayo 2026 |
| **Última actualización** | Junio 2026 — Actualización Roles, Jerarquía y Usuarios |
| **Autor** | Danny Francisco Jaramillo Guachón |
| **Revisado por** | Tutor de tesis — UIDE campus Loja |
| **Estado** | En desarrollo activo — Sprint 6 en curso |
| **Cambios v1.1.0** | Añadidos MOD-09 (Mis Actividades/Kanban), MOD-10 (Planet), RF-023 a RF-027, RN-018, RN-019, COL-012, integración etiquetas Outlook DIST/*, formato PDF institucional, validación cruzada, control horas TP |
| **Cambios v1.2.0** | Períodos independientes con historial (RN-020–022, RF-031–033), horario gráfico semanal (RF-028, RN-023–024, RNF-016–017), previsualización PDF obligatoria (RF-030, RN-025), Modales Liquid Glass (RF-035, §12.6), creación de distributivo en Modal (RF-029), descarga PDF por docente (RF-034), vistas nuevas (CalendarioDistributivo, HistorialPeriodos, PrevisualizacionPDF), Firestore subcolecciones por período, reglas Firestore actualizadas, Sprint 6 actualizado (HU-29 a HU-34) |
| **Cambios v1.3.0** | Correcciones 1–6: MOD-09 renombrado a Mis Actividades/Kanban (RF-036, RN-026–027, §12.8), estados de período unificados a activo/finalizado/proximo (§12.9), subcolección /docentes añadida a COL-003, GestionDistributivoPage.jsx documentada en árbol de carpetas, servicios misActividadesService/periodoService/horarioService añadidos, Glosario actualizado (Kanban, Mis Actividades, Planet como componentes), §12.8 y §12.9 añadidas a decisiones técnicas |
| **Cambios v1.4.0** | Corrección de roles y estructura organizacional: jerarquía de 4 niveles (admin/director/coordinador/docente), tabla de 7 carreras UIDE campus Loja, usuarios de prueba Ingeniería en Sistemas (5 usuarios seed), RF-002 actualizado, RN-008 con matriz de acceso por carrera, COL-001 /usuarios con tipo_contrato+carrera_id, COL-013 /carreras nueva colección con 7 documentos iniciales, reglas Firestore v1.4 con mismaCarrera(), HU-35 en Sprint 0, §12.10 plan de migración de sub-roles docente, Glosario con 8 términos nuevos |
| **Cambios v1.5.0** | Requerimientos de instrumentos del 9-jun-2026: RF-037–045 y RNF-018–020 implementados; modelo multi-rol `roles[]` (COL-001, seed, guards, sidebar fusionado, §12.11); colecciones /planes_mejora, /matriz_productividad y /oficios; campo telefono_whatsapp + notificaciones WhatsApp Twilio (2 Cloud Functions programadas, functions/main.py); módulos /ayuda y /perfil; pipeline BETO (heurística + generar_dataset.py + entrenar.py); interpretación IA de correos → tareas (Claude API con fallback local); UI sin emojis → components/icons.jsx; code-splitting por ruta (bundle 3.27MB→860KB); ProtectedRoute.jsx eliminado (sustituido por RoleGuard); sección "Datos de validación — instrumentos aplicados"; tests 69/69 |

---

*Este documento es la fuente de verdad técnica del proyecto. Debe mantenerse actualizado al finalizar cada Sprint.*














