/**
 * oficiosService.js — Notificación formal por incumplimiento (RF-044).
 * Dos vías: correo institucional Outlook (borrador mailto:, sin requerir
 * Mail.Send) u oficio registrado y archivado en el sistema (/oficios) con
 * numeración secuencial para respaldo documental.
 */
import { collection, doc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

const COL = 'oficios'
const KEY = (periodo) => `uide_oficios_${periodo}`

function localCargar(periodoId) {
  try { return JSON.parse(localStorage.getItem(KEY(periodoId))) ?? [] } catch { return [] }
}

/** Número secuencial institucional: OFI-<año>-NNN (por período). */
function siguienteNumero(existentes) {
  const anio = new Date().getFullYear()
  return `OFI-${anio}-${String(existentes.length + 1).padStart(3, '0')}`
}

function cuerpoNotificacion({ docenteNombre, periodoNombre, motivo, planDescripcion }) {
  return (
    `Estimado/a ${docenteNombre}:\n\n` +
    `Por medio de la presente se le notifica formalmente el incumplimiento ` +
    `detectado en su distributivo académico del período ${periodoNombre}:\n\n` +
    `${motivo}\n\n` +
    (planDescripcion ? `Plan de mejoras registrado: ${planDescripcion}\n\n` : '') +
    `Se le solicita acercarse a la Dirección de Carrera para coordinar las ` +
    `acciones de subsanación correspondientes.\n\n` +
    `Atentamente,\nDirección de Carrera — UIDE Campus Loja`
  )
}

/**
 * Registra un oficio formal en el sistema (vía "oficio registrado").
 * @returns {Promise<{ numero: string }>} número de oficio asignado
 */
export async function registrarOficio({ docenteUid, docenteNombre, periodoId, periodoNombre, motivo, planId = null, planDescripcion = null, emitidoPor }) {
  const existentes = await getOficios(periodoId)
  const numero = siguienteNumero(existentes)
  const oficio = {
    id:             `oficio_${docenteUid}_${Date.now()}`,
    numero,
    docente_uid:    docenteUid,
    docente_nombre: docenteNombre,
    periodo_id:     periodoId,
    motivo,
    cuerpo:         cuerpoNotificacion({ docenteNombre, periodoNombre, motivo, planDescripcion }),
    plan_mejora_id: planId,
    via:            'oficio',
    fecha_emision:  new Date().toISOString(),
    emitido_por:    emitidoPor ?? null,
  }

  if (db) {
    try {
      await setDoc(doc(db, COL, oficio.id), { ...oficio, fecha_emision: Timestamp.now() })
      return { numero }
    } catch (err) {
      console.warn('[oficiosService] Firestore error:', err.code)
    }
  }
  const lista = localCargar(periodoId)
  lista.push(oficio)
  localStorage.setItem(KEY(periodoId), JSON.stringify(lista))
  return { numero }
}

/** Oficios emitidos en el período. */
export async function getOficios(periodoId) {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, COL), where('periodo_id', '==', periodoId)))
      if (!snap.empty) return snap.docs.map(d => d.data())
    } catch (err) {
      console.warn('[oficiosService] Firestore error:', err.code)
    }
  }
  return localCargar(periodoId)
}

/**
 * Abre un borrador de correo en Outlook (vía "correo institucional").
 * Usa mailto: — funciona sin permisos Graph (Mail.Send no es necesario);
 * el directivo revisa y envía desde su propio Outlook.
 */
export function abrirBorradorOutlook({ docenteEmail, docenteNombre, periodoNombre, motivo, planDescripcion }) {
  const asunto = encodeURIComponent(`Notificación formal de incumplimiento — Distributivo ${periodoNombre}`)
  const cuerpo = encodeURIComponent(cuerpoNotificacion({ docenteNombre, periodoNombre, motivo, planDescripcion }))
  window.open(`mailto:${docenteEmail}?subject=${asunto}&body=${cuerpo}`, '_self')
}
