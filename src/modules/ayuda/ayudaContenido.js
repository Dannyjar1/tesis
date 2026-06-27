/**
 * ayudaContenido.js — Contenido del módulo de Ayuda (RF-039).
 * FAQ, guías y tutoriales segmentados por rol. Cada rol mapea a una lista de
 * secciones; cada sección tiene un título y una lista de items { pregunta, respuesta }.
 * Las preguntas se renderizan como acordeones (Acordeon.jsx) agrupados por sección.
 */
import { ROLES } from '../../utils/constants'
import { IconCalendario, IconClipboard, IconCohete, IconDiana, IconDocumento, IconGrafico, IconHerramienta, IconUsuario, IconUsuarios } from '../../components/icons'

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
          'En el menú lateral, entra a "Mi Distributivo". Verás el desglose de tus horas por las 4 categorías oficiales (DOCENCIA, INVESTIGACIÓN, VINCULACIÓN CON LA SOCIEDAD y GESTIÓN ACADÉMICA) y el estado de aprobación del período vigente.',
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
    titulo: 'Mis Actividades',
    icono: IconClipboard,
    items: [
      {
        pregunta: '¿Cómo veo las actividades que me asignaron?',
        respuesta:
          'En "Mis Actividades" encuentras las tareas que el director te asignó, ordenadas por prioridad y fecha límite, con barras de progreso por categoría. Tú no creas actividades: solo actualizas su estado y subes la evidencia.',
      },
      {
        pregunta: '¿Cómo marco una actividad como completada?',
        respuesta:
          'Usa "Iniciar" para pasarla a En progreso y luego "Marcar completada". También puedes pulsar "Subir evidencia" (URL o archivo): al guardar la evidencia, la actividad queda completada.',
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
          'En "Distributivos" usa el botón de nuevo distributivo; se abre un formulario en ventana modal. Registras las actividades por categoría y subcategoría oficial, y el sistema sugiere automáticamente las horas de tutorías y otras actividades de docencia (20% de las horas de clase).',
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

// Tutoriales paso a paso — visibles para todos los roles (igual que AYUDA_GENERAL).
export const AYUDA_TUTORIALES = {
  titulo: 'Tutoriales paso a paso',
  icono: IconDiana,
  items: [
    {
      pregunta: 'Tutorial: completar el flujo del distributivo',
      respuesta:
        '1) El Director crea el distributivo del docente desde "Distributivos" (modal). 2) El sistema sugiere automáticamente las horas de tutorías y otras actividades de docencia a partir de las horas de clase. 3) Director y docente confirman (validación cruzada) y el distributivo queda aprobado.',
    },
  ],
}

// Mapa rol → secciones de ayuda. Los roles sin contenido propio caen a la
// sección general únicamente (se resuelve en AyudaPage).
export const AYUDA_POR_ROL = {
  [ROLES.SUPERADMIN]:  SUPERADMIN,
  [ROLES.DIRECTOR]:    DIRECTOR,
  [ROLES.COORDINADOR]: COORDINADOR,
  [ROLES.DOCENTE]:     DOCENTE,
}
