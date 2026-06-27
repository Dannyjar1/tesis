/**
 * Servicio de notificaciones — implementación mock (localStorage).
 * Sprint Firebase: reemplazar con onSnapshot de /notificaciones y FCM.
 * Colección destino: /notificaciones
 */
import { getTodosUsuarios, guardarUsuario } from './sistemaService'
import { ROL_LABELS } from '../utils/constants'

const KEY = (uid) => `uide_notifs_${uid}`

// Seed de notificaciones por destinatario (UIDs reales del seed)
const SEED = {
  'uid_davalarezole': [
    {
      id: 'notif-001',
      destinatario_uid: 'uid_davalarezole',
      tipo: 'sin_distributivo',
      titulo: 'Docente sin distributivo asignado',
      mensaje: 'Yeferson Torres Berru no tiene distributivo asignado para el período 2026-A.',
      docente_uid_ref: 'uid_yetorresbe',
      leida: false,
      fecha_creacion: new Date(2026, 4, 20, 8, 0).toISOString(),
    },
    {
      id: 'notif-002',
      destinatario_uid: 'uid_davalarezole',
      tipo: 'distributivo_aprobado',
      titulo: 'Distributivo aprobado',
      mensaje: 'El distributivo de Milton Palacios Morocho fue aprobado por el Director de Carrera.',
      docente_uid_ref: 'uid_mipalaciosmo',
      leida: false,
      fecha_creacion: new Date(2026, 4, 18, 10, 30).toISOString(),
    },
    {
      id: 'notif-003',
      destinatario_uid: 'uid_davalarezole',
      tipo: 'sistema',
      titulo: 'Período académico activo',
      mensaje: 'El período 2026-A está activo. Verifica que todos los distributivos estén aprobados antes del 30 de mayo.',
      docente_uid_ref: null,
      leida: true,
      fecha_creacion: new Date(2026, 2, 1, 9, 0).toISOString(),
    },
  ],
  'uid_locondezh': [
    {
      id: 'notif-004',
      destinatario_uid: 'uid_locondezh',
      tipo: 'sin_distributivo',
      titulo: 'Docente sin distributivo',
      mensaje: 'Yeferson Torres Berru (MT) no tiene distributivo para el período 2026-A.',
      docente_uid_ref: 'uid_yetorresbe',
      leida: false,
      fecha_creacion: new Date(2026, 4, 21, 8, 0).toISOString(),
    },
    {
      id: 'notif-005',
      destinatario_uid: 'uid_locondezh',
      tipo: 'sistema',
      titulo: 'Sistema iniciado',
      mensaje: 'El sistema de gestión del distributivo UIDE campus Loja está operativo.',
      docente_uid_ref: null,
      leida: true,
      fecha_creacion: new Date(2026, 2, 16, 9, 0).toISOString(),
    },
  ],
  'uid_mipalaciosmo': [
    {
      id: 'notif-006',
      destinatario_uid: 'uid_mipalaciosmo',
      tipo: 'distributivo_aprobado',
      titulo: 'Tu distributivo fue aprobado',
      mensaje: 'El Director de Carrera aprobó tu distributivo académico para el período 2026-A.',
      docente_uid_ref: 'uid_mipalaciosmo',
      leida: false,
      fecha_creacion: new Date(2026, 4, 18, 10, 35).toISOString(),
    },
  ],
  'uid_yetorresbe': [
    {
      id: 'notif-007',
      destinatario_uid: 'uid_yetorresbe',
      tipo: 'sin_distributivo',
      titulo: 'Distributivo pendiente',
      mensaje: 'Aún no tienes distributivo asignado para el período 2026-A. Contacta al Director de Carrera.',
      docente_uid_ref: 'uid_yetorresbe',
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
 * Crea una notificación in-app para un destinatario (avisos de actividades,
 * ampliación de plazo, etc.). En producción será addDoc a /notificaciones.
 * @param {{ destinatario_uid: string, tipo: string, titulo: string,
 *           mensaje: string, docente_uid_ref?: string }} datos
 * @returns {Promise<Object>} la notificación creada
 */
export async function crearNotificacion(datos) {
  if (!datos?.destinatario_uid) return null
  const notif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    destinatario_uid: datos.destinatario_uid,
    tipo:             datos.tipo ?? 'sistema',
    titulo:           datos.titulo ?? '',
    mensaje:          datos.mensaje ?? '',
    docente_uid_ref:  datos.docente_uid_ref ?? null,
    solicitud:        datos.solicitud ?? null,   // payload para solicitudes accionables
    leida:            false,
    fecha_creacion:   new Date().toISOString(),
  }
  const lista = leer(datos.destinatario_uid)
  lista.unshift(notif)
  guardar(datos.destinatario_uid, lista)
  return notif
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

// ── Solicitud de cambio de rol (F.1–F.3) ──────────────────────────────────────

/**
 * El usuario solicita un cambio de rol desde Mi Perfil. Crea una notificación
 * accionable dirigida al director de su carrera (F.1).
 * @param {{ solicitanteUid, solicitanteNombre, carreraId, rolSolicitado, justificacion }} datos
 */
export async function solicitarCambioRol({ solicitanteUid, solicitanteNombre, carreraId, rolSolicitado, justificacion }) {
  if (!rolSolicitado) throw new Error('Selecciona el rol que solicitas.')
  if (!justificacion?.trim()) throw new Error('La justificación es obligatoria.')
  const usuarios = await getTodosUsuarios()
  const director = usuarios.find(u =>
    (u.roles ?? [u.rol]).includes('director') && u.carrera_id === carreraId && u.activo !== false)
  if (!director) throw new Error('No se encontró un director de carrera para dirigir la solicitud.')
  if (director.uid === solicitanteUid) throw new Error('Ya eres director de esta carrera.')

  return crearNotificacion({
    destinatario_uid: director.uid,
    tipo: 'solicitud_rol',
    titulo: 'Solicitud de cambio de rol',
    mensaje: `${solicitanteNombre} solicita el rol "${ROL_LABELS[rolSolicitado] ?? rolSolicitado}". Justificación: ${justificacion.trim()}`,
    solicitud: {
      solicitante_uid: solicitanteUid,
      solicitante_nombre: solicitanteNombre,
      rol_solicitado: rolSolicitado,
      justificacion: justificacion.trim(),
    },
  })
}

function marcarResuelta(uid, id, resultado) {
  const lista = leer(uid)
  const idx = lista.findIndex(n => n.id === id)
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], leida: true, resuelta: resultado }
    guardar(uid, lista)
  }
}

/**
 * El director acepta o rechaza una solicitud de rol (F.2). Al aceptar, agrega el
 * rol al array roles[] del usuario en /usuarios. En ambos casos notifica al
 * solicitante el resultado (F.3) y marca la solicitud como resuelta.
 * @param {Object} notif — la notificación tipo 'solicitud_rol'
 * @param {boolean} aceptada
 */
export async function resolverSolicitudRol(notif, aceptada) {
  const s = notif?.solicitud
  if (!s) throw new Error('Solicitud inválida.')

  if (aceptada) {
    const usuarios = await getTodosUsuarios()
    const u = usuarios.find(x => x.uid === s.solicitante_uid)
    if (!u) throw new Error('Usuario solicitante no encontrado.')
    const roles = Array.from(new Set([...(u.roles ?? (u.rol ? [u.rol] : [])), s.rol_solicitado]))
    await guardarUsuario(u.uid, { ...u, roles })
  }

  const etiqueta = ROL_LABELS[s.rol_solicitado] ?? s.rol_solicitado
  await crearNotificacion({
    destinatario_uid: s.solicitante_uid,
    tipo: aceptada ? 'solicitud_rol_aceptada' : 'solicitud_rol_rechazada',
    titulo: aceptada ? 'Solicitud de rol aceptada' : 'Solicitud de rol rechazada',
    mensaje: aceptada
      ? `Tu solicitud del rol "${etiqueta}" fue aceptada. Se aplicará al iniciar sesión nuevamente.`
      : `Tu solicitud del rol "${etiqueta}" fue rechazada por el director de carrera.`,
  })

  marcarResuelta(notif.destinatario_uid, notif.id, aceptada ? 'aceptada' : 'rechazada')
  return { aceptada }
}
