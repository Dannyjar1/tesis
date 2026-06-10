/**
 * ayudaContenido.js — Contenido del módulo de Ayuda (RF-039).
 * FAQ, guías y tutoriales segmentados por rol. Cada rol mapea a una lista de
 * secciones; cada sección tiene un título y una lista de items { pregunta, respuesta }.
 * Las preguntas se renderizan como acordeones (Acordeon.jsx) agrupados por sección.
 */
import { ROLES } from '../../utils/constants'
import { IconAjustes, IconCalendario, IconCarpeta, IconChispa, IconClipboard, IconCohete, IconDiana, IconDocumento, IconGlobo, IconGrafico, IconHerramienta, IconUsuario, IconUsuarios } from '../../components/icons'

// Sección común visible para todos los roles autenticados.
export const AYUDA_GENERAL = {
  titulo: 'Primeros pasos',
  icono: IconCohete,
  items: [
    {
      pregunta: '¿Cómo inicio sesión en el sistema?',
      respuesta:
        'El acceso es exclusivamente con tu cuenta institucional @uide.edu.ec mediante el botón "Iniciar sesión con Microsoft". No se usan contraseñas propias del sistema: la identidad la valida Microsoft 365.',
    },
    {
      pregunta: '¿Qué hago si una vista no me deja entrar?',
      respuesta:
        'Cada vista está protegida según tu rol. Si intentas abrir una sección que no corresponde a tu rol, el sistema te redirige automáticamente a tu panel principal. Si crees que te falta un permiso, contacta al área de TIC del campus.',
    },
    {
      pregunta: '¿Cómo cierro sesión?',
      respuesta:
        'Abre el menú de usuario en la barra superior (tu inicial, arriba a la derecha) y elige "Cerrar sesión". Esto revoca tu sesión de forma segura.',
    },
    {
      pregunta: '¿A quién contacto ante un problema técnico?',
      respuesta:
        'Escribe al área de Tecnologías de la Información (TIC) del campus Loja con una breve descripción del problema y, si puedes, una captura de pantalla.',
    },
  ],
}

const DOCENTE = [
  {
    titulo: 'Mi distributivo',
    icono: IconDocumento,
    items: [
      {
        pregunta: '¿Dónde veo mi distributivo del período activo?',
        respuesta:
          'En el menú lateral, entra a "Mi Distributivo". Verás el desglose de tus horas por categoría CES (Docencia, Investigación, Vinculación, Tutoría y Gestión) y el estado de aprobación del período vigente.',
      },
      {
        pregunta: '¿Qué es la validación cruzada y por qué mi distributivo no está aprobado?',
        respuesta:
          'Tu distributivo queda "aprobado" únicamente cuando tanto tú como la Directora de Carrera confirman la revisión. Si cualquiera de los dos observa el distributivo, regresa a estado "en revisión" hasta corregirlo.',
      },
      {
        pregunta: '¿Cómo descargo mi distributivo en PDF?',
        respuesta:
          'Desde "Mi Distributivo", usa el botón de descarga. Antes de generar el archivo verás una previsualización editable; la descarga definitiva ocurre solo después de que confirmes esa pantalla.',
      },
    ],
  },
  {
    titulo: 'Calendario y actividades',
    icono: IconCalendario,
    items: [
      {
        pregunta: '¿Cómo conecto mi calendario de Outlook?',
        respuesta:
          'Entra a "Calendario" y pulsa "Conectar Outlook". Autorizas el acceso con tu propia cuenta @uide.edu.ec; el sistema solo lee tus eventos, nunca los modifica.',
      },
      {
        pregunta: '¿Qué son las etiquetas DIST/* de Outlook?',
        respuesta:
          'Son categorías que asignas a tus correos en Outlook (DIST/Docencia, DIST/Investigación, DIST/Vinculación, DIST/Gestión, DIST/Tutoría, DIST/TP-Horas). El sistema lee esos correos y registra automáticamente la actividad en la categoría que corresponde. Puedes etiquetar desde la app o directamente en Outlook, como prefieras.',
      },
      {
        pregunta: '¿Cómo organizo mis tareas en el tablero Kanban?',
        respuesta:
          'En "Mis Actividades" arrastra cada tarjeta entre las columnas Por hacer, En progreso y Completadas. Al llegar a "Completadas" se registra automáticamente la fecha de finalización. La pestaña "Estadísticas" muestra tu progreso por categoría.',
      },
    ],
  },
  {
    titulo: 'Clasificación con IA',
    icono: IconChispa,
    items: [
      {
        pregunta: 'La IA clasificó mal una actividad, ¿cómo la corrijo?',
        respuesta:
          'En "Clasificación IA" abre el evento y cambia la categoría asignada. Tu corrección se guarda como retroalimentación y ayuda a mejorar el modelo para futuras clasificaciones.',
      },
    ],
  },
]

const COORDINADOR = [
  {
    titulo: 'Mi rol como Coordinador',
    icono: IconUsuario,
    items: [
      {
        pregunta: '¿Qué puedo hacer como Coordinador?',
        respuesta:
          'Tienes acceso de lectura a los distributivos de tu carrera y a los reportes. El Coordinador no aprueba distributivos: esa potestad es de la Directora de Carrera.',
      },
      {
        pregunta: '¿Cómo reviso el cumplimiento de los docentes?',
        respuesta:
          'En el "Dashboard" verás el porcentaje de cumplimiento por docente, las alertas activas y la distribución de horas por categoría, todo en tiempo real para tu carrera.',
      },
    ],
  },
  {
    titulo: 'Reportes',
    icono: IconGrafico,
    items: [
      {
        pregunta: '¿Cómo genero y descargo un reporte?',
        respuesta:
          'Entra a "Reportes", aplica los filtros (período, docente) y revisa la previsualización. La descarga (PDF institucional o Excel) se habilita solo después de confirmar esa previsualización.',
      },
    ],
  },
]

const DIRECTOR = [
  {
    titulo: 'Gestión de distributivos',
    icono: IconDocumento,
    items: [
      {
        pregunta: '¿Cómo creo un distributivo para un docente?',
        respuesta:
          'En "Distributivos" usa el botón de nuevo distributivo; se abre un formulario en ventana modal. Asignas las actividades por categoría y el sistema calcula automáticamente las horas (tutoría, preparación de clases, vinculación y titulación) según el Reglamento CES.',
      },
      {
        pregunta: '¿Por qué no me deja cerrar/aprobar un distributivo?',
        respuesta:
          'La suma total de horas debe ser exactamente igual a las del contrato (40h Tiempo Completo, 20h Medio Tiempo). Si no cuadra, el sistema bloquea la aprobación hasta ajustar las horas.',
      },
      {
        pregunta: '¿Cómo se aprueba definitivamente un distributivo?',
        respuesta:
          'Mediante validación cruzada: queda aprobado cuando tú y el docente confirman la revisión. Si alguno observa el distributivo, vuelve a "en revisión".',
      },
    ],
  },
  {
    titulo: 'Períodos académicos',
    icono: IconCalendario,
    items: [
      {
        pregunta: '¿Cómo creo o cierro un período?',
        respuesta:
          'En "Períodos" puedes crear, activar y cerrar períodos. Solo puede haber uno activo a la vez. Al cerrar el período activo, el sistema crea automáticamente el siguiente en estado "Próximo", completamente vacío.',
      },
      {
        pregunta: '¿Cómo consulto períodos anteriores?',
        respuesta:
          'Desde el historial podrás navegar los últimos 5 períodos en modo solo lectura: sus distributivos, docentes asignados y estadísticas de cumplimiento.',
      },
    ],
  },
  {
    titulo: 'Mi personal',
    icono: IconUsuarios,
    items: [
      {
        pregunta: '¿Dónde gestiono a los docentes de mi carrera?',
        respuesta:
          'En "Mi Personal" administras los docentes de tu carrera y su información académica. Recuerda que cada período tiene su propia lista de docentes, independiente de otros períodos.',
      },
    ],
  },
]

const ADMIN = [
  {
    titulo: 'Visión global',
    icono: IconGlobo,
    items: [
      {
        pregunta: '¿Cuál es mi alcance como Pro-Rector (Admin)?',
        respuesta:
          'Tienes acceso global: todas las carreras, todos los períodos y la configuración general del sistema. Puedes consultar el cumplimiento institucional sin restricción de carrera.',
      },
    ],
  },
  {
    titulo: 'Usuarios y configuración',
    icono: IconAjustes,
    items: [
      {
        pregunta: '¿Cómo administro las cuentas de usuario?',
        respuesta:
          'En "Usuarios" puedes crear, editar, activar o desactivar cuentas y asignar el rol correspondiente a cada persona.',
      },
      {
        pregunta: '¿Cómo cambio el umbral de alerta de cumplimiento?',
        respuesta:
          'En "Configuración" defines el umbral por debajo del cual se generan alertas automáticas de incumplimiento (por defecto, 80%).',
      },
    ],
  },
  {
    titulo: 'Auditoría',
    icono: IconClipboard,
    items: [
      {
        pregunta: '¿Dónde veo el historial de cambios del sistema?',
        respuesta:
          'En "Auditoría" se registra cada modificación al distributivo: quién la hizo, qué campo cambió, el valor anterior y el nuevo, con su fecha y hora.',
      },
    ],
  },
]

const SUPERADMIN = [
  {
    titulo: 'Administración del sistema (TIC)',
    icono: IconHerramienta,
    items: [
      {
        pregunta: '¿Qué gestiono desde el panel de sistema?',
        respuesta:
          'Administras las carreras del campus, los usuarios y sus roles, y la inicialización de datos semilla (seed). Es la configuración técnica base sobre la que operan los demás roles.',
      },
      {
        pregunta: '¿Cómo cargo los datos iniciales (seed)?',
        respuesta:
          'En la pestaña de inicialización del panel de sistema puedes cargar las carreras y los usuarios de prueba en Firestore para dejar el sistema operativo desde el primer despliegue.',
      },
    ],
  },
]

const ADMINISTRATIVO = [
  {
    titulo: 'Mi panel',
    icono: IconCarpeta,
    items: [
      {
        pregunta: '¿Qué encuentro en mi panel?',
        respuesta:
          'Tu panel reúne tu distribución de actividades, tus reportes y tu horario. Funciona igual que el del personal docente para el seguimiento de tus actividades.',
      },
      {
        pregunta: '¿Cómo registro y sigo mis actividades?',
        respuesta:
          'Usa "Mis Actividades" (tablero Kanban) para organizar tus tareas y "Calendario" para sincronizar tus eventos de Outlook.',
      },
    ],
  },
]

// Tutoriales paso a paso — visibles para todos los roles (igual que AYUDA_GENERAL).
export const AYUDA_TUTORIALES = {
  titulo: 'Tutoriales paso a paso',
  icono: IconDiana,
  items: [
    {
      pregunta: 'Tutorial: registrar mi número de WhatsApp para recibir avisos',
      respuesta:
        '1) Abre "Mi Perfil" en el menú lateral. 2) Escribe tu número en formato internacional (+593XXXXXXXXX). 3) Pulsa Guardar. Desde ese momento recibirás el resumen semanal (lunes 8:00) y el recordatorio diario (10:00) con tus tareas pendientes. Para dejar de recibirlos, borra el número y guarda.',
    },
    {
      pregunta: 'Tutorial: convertir un correo en una tarea con IA',
      respuesta:
        '1) Entra a "Calendario" y cambia a la pestaña "Correos DIST/*". 2) Asigna la etiqueta DIST que corresponda a cada correo (o etiquétalos directamente en Outlook). 3) Pulsa "Crear tareas To Do con IA": el sistema interpreta el texto del correo, extrae título, fecha límite y categoría, y crea la tarea en tu tablero Mis Actividades.',
    },
    {
      pregunta: 'Tutorial: registrar una actividad imprevista',
      respuesta:
        '1) En "Mis Actividades" pulsa crear actividad. 2) Marca la casilla "Actividad imprevista". 3) Indica la fecha de ejecución: debe ser con mínimo 2 semanas de anticipación, de lo contrario el sistema bloquea el registro. 4) Guarda: la actividad entra al tablero como "Por hacer".',
    },
    {
      pregunta: 'Tutorial: completar el flujo del distributivo',
      respuesta:
        '1) Verifica que el docente tenga su Matriz de Productividad aprobada (la carga de investigación viene pre-asignada desde Rectorado y es de solo lectura). 2) El Director crea el distributivo desde "Distributivos" (modal). 3) El sistema calcula automáticamente tutoría, preparación, vinculación y titulación. 4) Director y docente confirman (validación cruzada) y el distributivo queda aprobado.',
    },
  ],
}

// Mapa rol → secciones de ayuda. Los roles sin contenido propio caen a la
// sección general únicamente (se resuelve en AyudaPage).
export const AYUDA_POR_ROL = {
  [ROLES.SUPERADMIN]:     SUPERADMIN,
  [ROLES.ADMIN]:          ADMIN,
  [ROLES.DIRECTOR]:       DIRECTOR,
  [ROLES.COORDINADOR]:    COORDINADOR,
  [ROLES.DOCENTE]:        DOCENTE,
  [ROLES.ADMINISTRATIVO]: ADMINISTRATIVO,
}
