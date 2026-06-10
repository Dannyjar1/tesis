/**
 * outlookLabelsService.js — Extracción de actividades desde correos etiquetados DIST/*.
 * RF-023: Lee correos de Outlook con categorías DIST/* y los registra como actividades.
 *
 * Con sesión MSAL activa usa Microsoft Graph API real; sin ella (pendiente de
 * credenciales Azure AD) cae a un mock de correos en localStorage, igual que
 * calendarioService. El contrato de datos es idéntico en ambos modos, de modo
 * que la UI no distingue el origen y la integración real es solo cuestión de
 * credenciales.
 */
import { getAccessToken } from './msalService'
import { getCurrentUser } from './authService'
import { getActividades, crearActividad } from './actividadesService'

const GRAPH = 'https://graph.microsoft.com/v1.0'

// Mapeo de etiquetas Outlook → categorías CES (PROJECT.md §6 MOD-03)
const DIST_MAP = {
  'DIST/Docencia':       'docencia',
  'DIST/Investigación':  'investigacion',
  'DIST/Investigacion':  'investigacion',
  'DIST/Vinculación':   'vinculacion',
  'DIST/Vinculacion':    'vinculacion',
  'DIST/Gestión':       'gestion',
  'DIST/Gestion':        'gestion',
  'DIST/Tutoría':       'tutoria',
  'DIST/Tutoria':        'tutoria',
  'DIST/TP-Horas':       'gestion',
}

export const ETIQUETAS_DIST = [
  'DIST/Docencia',
  'DIST/Investigación',
  'DIST/Vinculación',
  'DIST/Gestión',
  'DIST/Tutoría',
  'DIST/TP-Horas',
]

// ── Mock de correos (fallback sin MSAL) ──────────────────────────────────────

const KEY_CORREOS = (uid) => `uide_correos_${uid}`

function fechaRel(diasAtras, hora = 9) {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  d.setHours(hora, 15, 0, 0)
  return d.toISOString()
}

// Correos institucionales simulados: algunos ya etiquetados DIST/*, otros sin
// etiquetar para demostrar el flujo de etiquetado desde la app.
const CORREOS_SEED = [
  { id: 'mail-001', asunto: 'Acta de calificaciones primer parcial — Programación Web', remitente: 'secretaria.loja@uide.edu.ec',   preview: 'Estimado docente, adjunto encontrará el acta del primer parcial para su firma…',          categorias: ['DIST/Docencia'],      diasAtras: 1 },
  { id: 'mail-002', asunto: 'Convocatoria reunión Consejo Académico — período 2026-A',  remitente: 'direccion.sistemas@uide.edu.ec', preview: 'Se convoca a reunión ordinaria del Consejo Académico el día viernes…',                    categorias: ['DIST/Gestión'],       diasAtras: 2 },
  { id: 'mail-003', asunto: 'Revisión de artículo — Revista Politécnica',               remitente: 'editor@revistapolitecnica.ec',  preview: 'Su artículo "Clasificación NLP en español" requiere cambios menores…',                  categorias: ['DIST/Investigación'], diasAtras: 3 },
  { id: 'mail-004', asunto: 'Seguimiento PPP — Empresa TechSolutions',                  remitente: 'rrhh@techsolutions.ec',          preview: 'Confirmamos la visita de seguimiento de prácticas pre-profesionales…',                  categorias: ['DIST/Vinculación'],   diasAtras: 4 },
  { id: 'mail-005', asunto: 'Solicitud de tutoría — estudiante 5to ciclo',              remitente: 'estudiante1@uide.edu.ec',        preview: 'Estimado docente, quisiera agendar una tutoría para revisar el proyecto…',              categorias: ['DIST/Tutoría'],       diasAtras: 5 },
  { id: 'mail-006', asunto: 'Informe mensual de actividades — recordatorio',            remitente: 'coordinacion.loja@uide.edu.ec',  preview: 'Le recordamos que el informe mensual de actividades vence este viernes…',               categorias: [],                      diasAtras: 1 },
  { id: 'mail-007', asunto: 'Defensa de titulación — designación de tribunal',          remitente: 'titulacion@uide.edu.ec',         preview: 'Ha sido designado miembro del tribunal para la defensa del trabajo…',                   categorias: [],                      diasAtras: 2 },
  { id: 'mail-008', asunto: 'Capacitación ciudadana — Barrio La Tebaida',               remitente: 'vinculacion.loja@uide.edu.ec',   preview: 'Confirmación de la jornada de capacitación en aplicaciones móviles…',                   categorias: [],                      diasAtras: 3 },
  { id: 'mail-009', asunto: 'Boletín UIDE — novedades del campus',                      remitente: 'comunicacion@uide.edu.ec',       preview: 'Conoce las novedades de este mes en el campus Loja…',                                    categorias: [],                      diasAtras: 6 },
  { id: 'mail-010', asunto: 'Congreso CEDIA 2026 — aceptación de ponencia',             remitente: 'congreso@cedia.org.ec',          preview: 'Nos complace informarle que su ponencia ha sido aceptada…',                              categorias: [],                      diasAtras: 7 },
]

function mockCargar(uid) {
  const raw = localStorage.getItem(KEY_CORREOS(uid))
  if (raw) return JSON.parse(raw)
  const seed = CORREOS_SEED.map(({ diasAtras, ...c }) => ({
    ...c,
    receivedDateTime: fechaRel(diasAtras),
  }))
  localStorage.setItem(KEY_CORREOS(uid), JSON.stringify(seed))
  return seed
}

function mockGuardar(uid, lista) {
  localStorage.setItem(KEY_CORREOS(uid), JSON.stringify(lista))
}

/** Token MSAL si hay sesión Outlook; null para usar el mock. */
async function tokenODisponible() {
  try {
    return await getAccessToken()
  } catch {
    return null // sin CLIENT_ID o sin sesión → modo mock
  }
}

function uidActual() {
  return getCurrentUser()?.uid ?? 'anon'
}

// ── Helpers Graph API ────────────────────────────────────────────────────────

async function graphGet(endpoint, token) {
  const res = await fetch(`${GRAPH}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Graph API ${res.status}: ${err}`)
  }
  return res.json()
}

function mapearActividad(msg) {
  const etiqueta  = (msg.categories ?? []).find(c => c.startsWith('DIST/')) ?? ''
  const categoria = DIST_MAP[etiqueta] ?? 'gestion'
  return {
    id:               `dist_${msg.id}`,
    titulo:           msg.subject ?? msg.asunto ?? '(sin asunto)',
    descripcion:      msg.bodyPreview ?? msg.preview ?? '',
    categoria,
    etiqueta_outlook: etiqueta,
    fecha:            msg.receivedDateTime,
    origen:           'etiqueta_outlook',
    estado:           'confirmada',
  }
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Obtiene todos los correos etiquetados con DIST/* del buzón del usuario.
 * Devuelve una lista de actividades ya mapeadas a categorías CES (RF-023).
 * @returns {Promise<Object[]>}
 */
export async function getCorreosDist() {
  const token = await tokenODisponible()

  if (token) {
    const endpoint =
      `/me/messages` +
      `?$filter=categories/any(c:startswith(c,'DIST/'))` +
      `&$select=id,subject,receivedDateTime,categories,bodyPreview` +
      `&$top=100` +
      `&$orderby=receivedDateTime desc`
    const data = await graphGet(endpoint, token)
    return (data.value ?? []).map(mapearActividad)
  }

  // Mock: correos locales con etiqueta DIST/*
  return mockCargar(uidActual())
    .filter(c => (c.categorias ?? []).some(cat => cat.startsWith('DIST/')))
    .map(c => mapearActividad({ ...c, categories: c.categorias }))
}

/**
 * Obtiene los correos recientes del buzón para el panel de etiquetado.
 * @param {number} top - máximo de correos a devolver (default 30)
 * @returns {Promise<Object[]>}
 */
export async function getCorreosRecientes(top = 30) {
  const token = await tokenODisponible()

  if (token) {
    const endpoint =
      `/me/messages` +
      `?$select=id,subject,receivedDateTime,categories,bodyPreview,from` +
      `&$top=${top}` +
      `&$orderby=receivedDateTime desc`
    const data = await graphGet(endpoint, token)
    return (data.value ?? []).map(msg => ({
      id:             msg.id,
      asunto:         msg.subject ?? '(sin asunto)',
      remitente:      msg.from?.emailAddress?.address ?? '',
      fecha:          msg.receivedDateTime,
      preview:        msg.bodyPreview ?? '',
      categorias:     msg.categories ?? [],
      etiquetadoDist: (msg.categories ?? []).some(c => c.startsWith('DIST/')),
    }))
  }

  // Mock
  return mockCargar(uidActual())
    .slice()
    .sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime))
    .slice(0, top)
    .map(c => ({
      id:             c.id,
      asunto:         c.asunto,
      remitente:      c.remitente,
      fecha:          c.receivedDateTime,
      preview:        c.preview,
      categorias:     c.categorias ?? [],
      etiquetadoDist: (c.categorias ?? []).some(cat => cat.startsWith('DIST/')),
    }))
}

/**
 * Agrega (o cambia) la etiqueta DIST/* de un correo.
 * Con Graph real requiere permiso Mail.ReadWrite; en mock actualiza localStorage.
 * @param {string} messageId
 * @param {string} etiqueta — ej. 'DIST/Docencia'
 * @returns {Promise<void>}
 */
export async function etiquetarCorreo(messageId, etiqueta) {
  const token = await tokenODisponible()

  if (token) {
    const res = await fetch(`${GRAPH}/me/messages/${messageId}`, {
      method:  'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories: [etiqueta] }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`No se pudo etiquetar el correo. Graph API ${res.status}: ${err}`)
    }
    return
  }

  // Mock
  const uid = uidActual()
  const correos = mockCargar(uid)
  const idx = correos.findIndex(c => c.id === messageId)
  if (idx === -1) throw new Error('Correo no encontrado.')
  correos[idx] = { ...correos[idx], categorias: etiqueta ? [etiqueta] : [] }
  mockGuardar(uid, correos)
}

/**
 * Importa los correos etiquetados DIST/* como actividades del período (RF-023).
 * Evita duplicados usando el ID del mensaje como identificador único
 * (campo evento_id = "dist_<messageId>").
 * @returns {Promise<{ importadas: number, duplicadas: number }>}
 */
export async function importarActividadesDist(docenteUid, periodoId) {
  const correos = await getCorreosDist()
  if (correos.length === 0) return { importadas: 0, duplicadas: 0 }

  const existentes = await getActividades(docenteUid, periodoId)
  const yaImportados = new Set(existentes.map(a => a.evento_id).filter(Boolean))

  let importadas = 0
  let duplicadas = 0

  for (const correo of correos) {
    if (yaImportados.has(correo.id)) {
      duplicadas++
      continue
    }
    await crearActividad({
      docente_uid:     docenteUid,
      periodo_id:      periodoId,
      titulo:          correo.titulo,
      categoria:       correo.categoria,
      horas:           0,
      fecha_actividad: correo.fecha,
      evento_id:       correo.id, // dist_<messageId> — clave de deduplicación
      notas:           `Importado desde Outlook (${correo.etiqueta_outlook})`,
    })
    importadas++
  }

  return { importadas, duplicadas }
}

/** Restaura el mock de correos a su estado inicial (solo desarrollo). */
export function resetCorreosMock() {
  localStorage.removeItem(KEY_CORREOS(uidActual()))
}
