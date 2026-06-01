/**
 * Servicio de notificaciones — implementación mock (localStorage).
 * Sprint Firebase: reemplazar con onSnapshot de /notificaciones y FCM.
 * Colección destino: /notificaciones
 */

const KEY = (uid) => `uide_notifs_${uid}`

// Seed de notificaciones por destinatario
const SEED = {
  'mock-coordinador-001': [
    {
      id: 'notif-001',
      destinatario_uid: 'mock-coordinador-001',
      tipo: 'sin_distributivo',
      titulo: 'Docente sin distributivo asignado',
      mensaje: 'Lic. Ana Mora Ríos no tiene distributivo asignado para el período 2026-A.',
      docente_uid_ref: 'mock-docente-mt-001',
      leida: false,
      fecha_creacion: new Date(2026, 4, 20, 8, 0).toISOString(),
    },
    {
      id: 'notif-002',
      destinatario_uid: 'mock-coordinador-001',
      tipo: 'distributivo_aprobado',
      titulo: 'Distributivo aprobado',
      mensaje: 'El distributivo de MSc. Luis Peña Cabrera fue aprobado por el Director de Carrera.',
      docente_uid_ref: 'mock-docente-tc-001',
      leida: false,
      fecha_creacion: new Date(2026, 4, 18, 10, 30).toISOString(),
    },
    {
      id: 'notif-003',
      destinatario_uid: 'mock-coordinador-001',
      tipo: 'sistema',
      titulo: 'Período académico activo',
      mensaje: 'El período 2026-A está activo. Verifica que todos los distributivos estén aprobados antes del 30 de mayo.',
      docente_uid_ref: null,
      leida: true,
      fecha_creacion: new Date(2026, 2, 1, 9, 0).toISOString(),
    },
  ],
  'mock-director-001': [
    {
      id: 'notif-004',
      destinatario_uid: 'mock-director-001',
      tipo: 'sin_distributivo',
      titulo: 'Docente sin distributivo',
      mensaje: 'Lic. Ana Mora Ríos (MT) no tiene distributivo para el período 2026-A.',
      docente_uid_ref: 'mock-docente-mt-001',
      leida: false,
      fecha_creacion: new Date(2026, 4, 21, 8, 0).toISOString(),
    },
    {
      id: 'notif-005',
      destinatario_uid: 'mock-director-001',
      tipo: 'sistema',
      titulo: 'Sistema iniciado',
      mensaje: 'El sistema de gestión del distributivo UIDE campus Loja está operativo.',
      docente_uid_ref: null,
      leida: true,
      fecha_creacion: new Date(2026, 2, 16, 9, 0).toISOString(),
    },
  ],
  'mock-docente-tc-001': [
    {
      id: 'notif-006',
      destinatario_uid: 'mock-docente-tc-001',
      tipo: 'distributivo_aprobado',
      titulo: 'Tu distributivo fue aprobado',
      mensaje: 'El Director de Carrera aprobó tu distributivo académico para el período 2026-A.',
      docente_uid_ref: 'mock-docente-tc-001',
      leida: false,
      fecha_creacion: new Date(2026, 4, 18, 10, 35).toISOString(),
    },
  ],
  'mock-docente-mt-001': [
    {
      id: 'notif-007',
      destinatario_uid: 'mock-docente-mt-001',
      tipo: 'sin_distributivo',
      titulo: 'Distributivo pendiente',
      mensaje: 'Aún no tienes distributivo asignado para el período 2026-A. Contacta al Director de Carrera.',
      docente_uid_ref: 'mock-docente-mt-001',
      leida: false,
      fecha_creacion: new Date(2026, 4, 22, 8, 0).toISOString(),
    },
  ],
}

function leer(uid) {
  const raw = localStorage.getItem(KEY(uid))
  if (!raw) {
    const seed = SEED[uid] ?? []
    guardar(uid, seed)
    return seed
  }
  return JSON.parse(raw)
}

function guardar(uid, lista) {
  localStorage.setItem(KEY(uid), JSON.stringify(lista))
}

/**
 * Devuelve las notificaciones del usuario, ordenadas por fecha descendente.
 * @param {string} destinatarioUid
 * @returns {Promise<Object[]>}
 */
export async function getNotificaciones(destinatarioUid) {
  if (!destinatarioUid) return []
  const lista = leer(destinatarioUid)
  return lista.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
}

/**
 * Marca una notificación como leída.
 * @param {string} destinatarioUid
 * @param {string} notificacionId
 */
export async function marcarLeida(destinatarioUid, notificacionId) {
  const lista = leer(destinatarioUid)
  const idx = lista.findIndex(n => n.id === notificacionId)
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], leida: true }
    guardar(destinatarioUid, lista)
  }
}

/**
 * Marca todas las notificaciones del usuario como leídas.
 * @param {string} destinatarioUid
 */
export async function marcarTodasLeidas(destinatarioUid) {
  const lista = leer(destinatarioUid).map(n => ({ ...n, leida: true }))
  guardar(destinatarioUid, lista)
}

/**
 * Suscripción simulada. En Firebase: onSnapshot sobre /notificaciones donde
 * destinatario_uid == uid.
 * @param {string} destinatarioUid
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function suscribirseNotificaciones(destinatarioUid, callback) {
  getNotificaciones(destinatarioUid).then(callback)
  return () => {}
}

export function resetNotificacionesMock(uid) {
  localStorage.removeItem(KEY(uid))
}
