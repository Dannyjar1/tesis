/**
 * calendarioService.js — Sincronización de calendario Outlook via Microsoft Graph API.
 * Cuando hay sesión MSAL activa usa Graph API real; si no, cae al mock de localStorage.
 * RF-013, RF-014, RF-023 — PROJECT.md §6 MOD-03
 */
import { getAccessToken, loginOutlook, logoutOutlook, getOutlookAccount } from './msalService'

const GRAPH = 'https://graph.microsoft.com/v1.0'

// ── Claves localStorage (mock + caché) ──────────────────────────────────────
const KEY_EVENTOS = (uid, periodo) => `uide_eventos_${uid}_${periodo}`
const KEY_SYNC    = (uid, periodo) => `uide_cal_sync_${uid}_${periodo}`

// ── Helpers Graph API ────────────────────────────────────────────────────────

async function graphGet(endpoint, token) {
  const res = await fetch(`${GRAPH}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Graph API ${res.status}: ${msg}`)
  }
  return res.json()
}

function toISOLocal(date) {
  return date.toISOString()
}

// ── Mock seed (fallback cuando no hay MSAL) ─────────────────────────────────

function f(y, m, d, h = 8, min = 0) {
  return new Date(y, m - 1, d, h, min, 0).toISOString()
}

const EVENTOS_SEED = [
  { id: 'evt-001', titulo: 'Clase Programación Web – Grupo A',         descripcion: 'Módulo 1: Introducción a React.js y JSX',                   fecha_inicio: f(2026,3,2,8),  fecha_fin: f(2026,3,2,10),  duracion_horas: 2 },
  { id: 'evt-002', titulo: 'Clase Bases de Datos – Grupo B',           descripcion: 'Tema: Normalización y formas normales',                     fecha_inicio: f(2026,3,2,10), fecha_fin: f(2026,3,2,12),  duracion_horas: 2 },
  { id: 'evt-003', titulo: 'Tutoría académica – oficina',              descripcion: 'Atención a estudiantes con consultas del parcial',          fecha_inicio: f(2026,3,4,15), fecha_fin: f(2026,3,4,17),  duracion_horas: 2 },
  { id: 'evt-004', titulo: 'Reunión comité de investigación',          descripcion: 'Revisión de avances del proyecto DGI institucional',        fecha_inicio: f(2026,3,5,14), fecha_fin: f(2026,3,5,16),  duracion_horas: 2 },
  { id: 'evt-005', titulo: 'Clase Programación Web – Grupo A',         descripcion: 'Módulo 2: Componentes, props y estado',                    fecha_inicio: f(2026,3,9,8),  fecha_fin: f(2026,3,9,10),  duracion_horas: 2 },
  { id: 'evt-006', titulo: 'Seguimiento prácticas pre-profesionales',  descripcion: 'Visita empresa TechSolutions – seguimiento PPP Grupo 1',   fecha_inicio: f(2026,3,11,10),fecha_fin: f(2026,3,11,12), duracion_horas: 2 },
  { id: 'evt-007', titulo: 'Consejo académico de carrera',             descripcion: 'Planificación período 2026-A y aprobación de distributivos',fecha_inicio: f(2026,3,13,14),fecha_fin: f(2026,3,13,16), duracion_horas: 2 },
  { id: 'evt-008', titulo: 'Clase Bases de Datos – Grupo A',           descripcion: 'Tema: Diseño conceptual y ERD',                            fecha_inicio: f(2026,3,16,8), fecha_fin: f(2026,3,16,10), duracion_horas: 2 },
  { id: 'evt-009', titulo: 'Dirección trabajo de titulación',          descripcion: 'Reunión inicial con estudiante: "Sistema de inventarios"',  fecha_inicio: f(2026,3,18,11),fecha_fin: f(2026,3,18,12), duracion_horas: 1 },
  { id: 'evt-010', titulo: 'Clase Programación Web – Grupo B',         descripcion: 'Módulo 3: React Router y navegación SPA',                  fecha_inicio: f(2026,4,6,8),  fecha_fin: f(2026,4,6,10),  duracion_horas: 2 },
  { id: 'evt-011', titulo: 'Tutoría académica – oficina',              descripcion: 'Consultas previas al primer parcial',                      fecha_inicio: f(2026,4,8,15), fecha_fin: f(2026,4,8,17),  duracion_horas: 2 },
  { id: 'evt-012', titulo: 'Examen parcial Programación Web',          descripcion: 'Primer parcial – Módulos 1, 2 y 3',                        fecha_inicio: f(2026,4,13,8), fecha_fin: f(2026,4,13,10), duracion_horas: 2 },
  { id: 'evt-013', titulo: 'Revisión artículo científico',             descripcion: 'Revisión de artículo para Revista Politécnica – NLP en ES', fecha_inicio: f(2026,4,15,14),fecha_fin: f(2026,4,15,16), duracion_horas: 2 },
  { id: 'evt-014', titulo: 'Práctica comunitaria – Barrio La Tebaida', descripcion: 'Capacitación ciudadana: uso de aplicaciones móviles',      fecha_inicio: f(2026,4,19,9), fecha_fin: f(2026,4,19,12), duracion_horas: 3 },
  { id: 'evt-015', titulo: 'Clase Bases de Datos – Grupo A',           descripcion: 'Tema: Transacciones, índices y concurrencia',              fecha_inicio: f(2026,4,20,8), fecha_fin: f(2026,4,20,10), duracion_horas: 2 },
  { id: 'evt-016', titulo: 'Dirección trabajo de titulación',          descripcion: 'Avance capítulo 2: Marco teórico y metodología',           fecha_inicio: f(2026,4,22,11),fecha_fin: f(2026,4,22,12), duracion_horas: 1 },
  { id: 'evt-017', titulo: 'Clase Programación Web – Grupo A',         descripcion: 'Módulo 5: Context API y gestión de estado global',         fecha_inicio: f(2026,5,4,8),  fecha_fin: f(2026,5,4,10),  duracion_horas: 2 },
  { id: 'evt-018', titulo: 'Seguimiento prácticas pre-profesionales',  descripcion: 'Reunión de seguimiento PPP – empresa InnovateTech',        fecha_inicio: f(2026,5,6,10), fecha_fin: f(2026,5,6,11),  duracion_horas: 1 },
  { id: 'evt-019', titulo: 'Tribunal de defensa de grado',             descripcion: 'Tribunal: "Sistema biométrico de control de asistencia"',  fecha_inicio: f(2026,5,12,10),fecha_fin: f(2026,5,12,13), duracion_horas: 3 },
  { id: 'evt-020', titulo: 'Reunión proyecto de investigación',        descripcion: 'Avances en IA para educación superior – equipo DGI',       fecha_inicio: f(2026,5,14,14),fecha_fin: f(2026,5,14,16), duracion_horas: 2 },
  { id: 'evt-021', titulo: 'Tutoría académica – oficina',              descripcion: 'Atención a estudiantes – semana de exámenes finales',      fecha_inicio: f(2026,5,19,15),fecha_fin: f(2026,5,19,17), duracion_horas: 2 },
  { id: 'evt-022', titulo: 'Clase Bases de Datos – Grupo A',           descripcion: 'Tema: Bases de datos NoSQL y Firestore',                   fecha_inicio: f(2026,5,20,8), fecha_fin: f(2026,5,20,10), duracion_horas: 2 },
  { id: 'evt-023', titulo: 'Reunión proyecto de investigación',        descripcion: 'Revisión de resultados preliminares del modelo BETO',      fecha_inicio: f(2026,5,21,14),fecha_fin: f(2026,5,21,16), duracion_horas: 2 },
  { id: 'evt-024', titulo: 'Clase Programación Web – Grupo B',         descripcion: 'Módulo 5: Hooks personalizados y optimización',           fecha_inicio: f(2026,5,22,10),fecha_fin: f(2026,5,22,12), duracion_horas: 2 },
  { id: 'evt-025', titulo: 'Seguimiento prácticas pre-profesionales',  descripcion: 'Visita empresa LogiSoft – cierre semestral PPP',           fecha_inicio: f(2026,5,23,9), fecha_fin: f(2026,5,23,11), duracion_horas: 2 },
  { id: 'evt-026', titulo: 'Examen final Programación Web',            descripcion: 'Segundo parcial acumulativo – todos los módulos',          fecha_inicio: f(2026,6,8,8),  fecha_fin: f(2026,6,8,10),  duracion_horas: 2 },
  { id: 'evt-027', titulo: 'Práctica comunitaria – comunidad El Valle', descripcion: 'Capacitación: diseño de páginas web para emprendedores',  fecha_inicio: f(2026,6,20,9), fecha_fin: f(2026,6,20,13), duracion_horas: 4 },
  { id: 'evt-028', titulo: 'Reunión planificación período 2026-B',     descripcion: 'Planificación académica y revisión de malla curricular',   fecha_inicio: f(2026,7,1,14), fecha_fin: f(2026,7,1,16),  duracion_horas: 2 },
  { id: 'evt-029', titulo: 'Dirección trabajo de titulación',          descripcion: 'Revisión final del trabajo previo a sustentación',         fecha_inicio: f(2026,7,15,11),fecha_fin: f(2026,7,15,12), duracion_horas: 1 },
  { id: 'evt-030', titulo: 'Práctica comunitaria – parroquia Sucre',   descripcion: 'Capacitación en tecnología digital – adultos mayores',     fecha_inicio: f(2026,8,5,8),  fecha_fin: f(2026,8,5,12),  duracion_horas: 4 },
  { id: 'evt-031', titulo: 'Tutoría académica – cierre semestral',     descripcion: 'Últimas consultas y revisión de notas del período 2026-A', fecha_inicio: f(2026,8,20,15),fecha_fin: f(2026,8,20,17), duracion_horas: 2 },
]

// ── Conversión de evento Graph → formato interno ─────────────────────────────

function mapGraphEvent(evt) {
  const inicio = new Date(evt.start?.dateTime ?? evt.start?.date)
  const fin    = new Date(evt.end?.dateTime   ?? evt.end?.date)
  const duracion = Math.max(0, (fin - inicio) / 3_600_000)
  return {
    id:                 evt.id,
    titulo:             evt.subject ?? '(sin título)',
    descripcion:        evt.bodyPreview ?? '',
    fecha_inicio:       inicio.toISOString(),
    fecha_fin:          fin.toISOString(),
    duracion_horas:     Math.round(duracion * 4) / 4, // redondeo a 0.25h
    categoria_ia:       null,
    confianza_ia:       null,
    estado_clasificacion: 'pendiente',
    origen:             'calendario_outlook',
    fecha_sincronizacion: new Date().toISOString(),
  }
}

// ── API pública ─────────────────────────────────────────────────────────────

/**
 * Indica si el usuario tiene sesión de Outlook activa (MSAL) o autorización mock.
 * @param {string} docenteUid
 * @returns {Promise<boolean>}
 */
export async function isCalendarioAutorizado(docenteUid) {
  try {
    const account = await getOutlookAccount()
    if (account) return true
  } catch { /* MSAL no iniciado */ }
  // Fallback: autorización mock en localStorage
  return localStorage.getItem(`uide_cal_auth_${docenteUid}`) === 'true'
}

/**
 * Inicia el flujo OAuth de Microsoft y retorna la cuenta autenticada.
 * Reemplaza la simulación anterior (RF-013).
 * @returns {Promise<import('@azure/msal-browser').AccountInfo>}
 */
export async function autorizarCalendario() {
  return loginOutlook()
}

/**
 * Revoca el acceso al calendario cerrando la sesión MSAL.
 */
export async function revocarCalendario() {
  await logoutOutlook()
}

/**
 * Sincroniza eventos desde Microsoft Graph API para el período dado.
 * Si no hay sesión MSAL usa datos mock (localStorage seed).
 * @param {string} docenteUid
 * @param {string} periodoId
 * @param {string} [fechaInicio] — ISO string, default: 4 meses atrás
 * @param {string} [fechaFin]    — ISO string, default: 4 meses adelante
 * @returns {Promise<{ sincronizados: number, fuente: 'graph'|'mock' }>}
 */
export async function sincronizarCalendario(
  docenteUid,
  periodoId,
  fechaInicio,
  fechaFin,
) {
  let token = null
  try { token = await getAccessToken() } catch { /* sin MSAL */ }

  if (token) {
    // ── Ruta real: Microsoft Graph API ──────────────────────────────────────
    const inicio = fechaInicio
      ? new Date(fechaInicio)
      : new Date(Date.now() - 120 * 24 * 3_600_000) // 4 meses atrás
    const fin = fechaFin
      ? new Date(fechaFin)
      : new Date(Date.now() + 120 * 24 * 3_600_000) // 4 meses adelante

    const endpoint =
      `/me/calendarView` +
      `?startDateTime=${encodeURIComponent(toISOLocal(inicio))}` +
      `&endDateTime=${encodeURIComponent(toISOLocal(fin))}` +
      `&$select=id,subject,bodyPreview,start,end,location` +
      `&$top=200` +
      `&$orderby=start/dateTime`

    const data   = await graphGet(endpoint, token)
    const eventos = (data.value ?? []).map(e => ({
      ...mapGraphEvent(e),
      docente_uid: docenteUid,
      periodo_id:  periodoId,
    }))

    localStorage.setItem(KEY_EVENTOS(docenteUid, periodoId), JSON.stringify(eventos))
    localStorage.setItem(KEY_SYNC(docenteUid, periodoId), new Date().toISOString())
    return { sincronizados: eventos.length, fuente: 'graph' }
  }

  // ── Ruta mock: seed de datos de prueba ────────────────────────────────────
  const seed = EVENTOS_SEED.map(e => ({
    ...e,
    docente_uid: docenteUid,
    periodo_id:  periodoId,
    categoria_ia:        null,
    confianza_ia:        null,
    estado_clasificacion: 'pendiente',
    origen:              'calendario_outlook',
    fecha_sincronizacion: new Date().toISOString(),
  }))
  localStorage.setItem(KEY_EVENTOS(docenteUid, periodoId), JSON.stringify(seed))
  localStorage.setItem(KEY_SYNC(docenteUid, periodoId), new Date().toISOString())
  localStorage.setItem(`uide_cal_auth_${docenteUid}`, 'true')
  return { sincronizados: seed.length, fuente: 'mock' }
}

/**
 * Devuelve los eventos en caché ordenados por fecha.
 * @param {string} docenteUid
 * @param {string} periodoId
 * @returns {Promise<Object[]>}
 */
export async function getEventosCalendario(docenteUid, periodoId) {
  const raw = localStorage.getItem(KEY_EVENTOS(docenteUid, periodoId))
  const lista = raw ? JSON.parse(raw) : []
  return lista.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
}

/**
 * Devuelve la marca de tiempo de la última sincronización.
 * @param {string} docenteUid
 * @param {string} periodoId
 * @returns {string|null}
 */
export function getUltimaSync(docenteUid, periodoId) {
  return localStorage.getItem(KEY_SYNC(docenteUid, periodoId))
}

/**
 * Suscripción reactiva simulada. En Firebase usar onSnapshot sobre /eventos_calendario.
 * @returns {Function} unsubscribe
 */
export function suscribirseEventos(docenteUid, periodoId, callback) {
  getEventosCalendario(docenteUid, periodoId).then(callback)
  return () => {}
}

/**
 * Devuelve la cuenta de Microsoft activa (nombre, email).
 * @returns {Promise<{nombre:string, email:string}|null>}
 */
export async function getInfoCuentaOutlook() {
  try {
    const account = await getOutlookAccount()
    if (!account) return null
    return {
      nombre: account.name ?? account.username,
      email:  account.username,
    }
  } catch {
    return null
  }
}

export { loginOutlook as conectarOutlook, logoutOutlook as desconectarOutlook }
