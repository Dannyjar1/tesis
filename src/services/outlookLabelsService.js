/**
 * outlookLabelsService.js — Extracción de actividades desde correos etiquetados DIST/*.
 * RF-023: Lee correos de Outlook con categorías DIST/* y los registra como actividades.
 * Usa Microsoft Graph API vía token MSAL.
 */
import { getAccessToken } from './msalService'

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

/**
 * Obtiene todos los correos etiquetados con DIST/* del buzón del usuario.
 * Devuelve una lista de actividades ya mapeadas a categorías CES (RF-023).
 * @returns {Promise<Object[]>}
 */
export async function getCorreosDist() {
  const token = await getAccessToken()
  if (!token) throw new Error('No hay sesión de Outlook. Conecta primero tu cuenta.')

  // Filtra por cualquier categoría que empiece con 'DIST/'
  const endpoint =
    `/me/messages` +
    `?$filter=categories/any(c:startswith(c,'DIST/'))` +
    `&$select=id,subject,receivedDateTime,categories,bodyPreview` +
    `&$top=100` +
    `&$orderby=receivedDateTime desc`

  const data = await graphGet(endpoint, token)
  const mensajes = data.value ?? []

  return mensajes.map(msg => {
    const etiqueta  = msg.categories.find(c => c.startsWith('DIST/')) ?? ''
    const categoria = DIST_MAP[etiqueta] ?? 'gestion'
    return {
      id:               `dist_${msg.id}`,
      titulo:           msg.subject ?? '(sin asunto)',
      descripcion:      msg.bodyPreview ?? '',
      categoria,
      etiqueta_outlook: etiqueta,
      fecha:            msg.receivedDateTime,
      origen:           'etiqueta_outlook',
      estado:           'confirmada',
    }
  })
}

/**
 * Obtiene los correos recientes del buzón para mostrar en el panel de etiquetado.
 * @param {number} top - máximo de correos a devolver (default 30)
 * @returns {Promise<Object[]>}
 */
export async function getCorreosRecientes(top = 30) {
  const token = await getAccessToken()
  if (!token) throw new Error('No hay sesión de Outlook. Conecta primero tu cuenta.')

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

/**
 * Agrega la etiqueta DIST/* a un correo existente en Outlook.
 * Requiere permiso Mail.ReadWrite (añadir si se activa esta función).
 * @param {string} messageId
 * @param {string} etiqueta — ej. 'DIST/Docencia'
 * @returns {Promise<void>}
 */
export async function etiquetarCorreo(messageId, etiqueta) {
  const token = await getAccessToken()
  if (!token) throw new Error('No hay sesión de Outlook.')

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
}
