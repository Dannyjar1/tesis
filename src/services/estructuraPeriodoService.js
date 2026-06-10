/**
 * estructuraPeriodoService.js — Estructura jerárquica histórica del sistema:
 *
 *   Período Académico → Carreras → Usuarios (docentes y administrativos)
 *
 * Cada período mantiene SU PROPIA configuración por carrera: coordinador o
 * responsable, docentes y administrativos asignados, e indicadores/actividades
 * definidos para ese período. Esto garantiza la trazabilidad histórica: la
 * pregunta "¿quién dictó en Derecho en 2025-B y con qué indicadores?" se
 * responde leyendo la estructura de ese período, intacta.
 *
 * Reglas:
 *  - Los períodos en estado "finalizado" son HISTORIAL INMUTABLE: toda
 *    escritura se rechaza (assertEditable). Se consultan sin restricción.
 *  - Las carreras son dinámicas (catálogo global /carreras gestionado por el
 *    superadmin); cada período referencia las que participan en él.
 *  - Al crear un período se puede copiar la estructura del anterior
 *    ("mantener carreras existentes") y luego ajustarla.
 *
 * Firestore: /periodos_academicos/{periodoId}/carreras/{carreraId}
 * Fallback localStorage: uide_estructura_{periodoId}
 */
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

const KEY = (periodoId) => `uide_estructura_${periodoId}`

// ── Inmutabilidad del historial ───────────────────────────────────────────────

/** Lanza error si el período es historial (finalizado). RN: los períodos
 *  anteriores no se modifican; solo se consultan. */
export function assertEditable(periodo) {
  if (!periodo) throw new Error('Período no especificado.')
  if (periodo.estado === 'finalizado') {
    throw new Error(
      `El período "${periodo.nombre ?? periodo.id}" está finalizado: es historial ` +
      'inmutable y solo puede consultarse. Configura el período activo o próximo.'
    )
  }
}

// ── Helpers de almacenamiento ─────────────────────────────────────────────────

function localCargar(periodoId) {
  try { return JSON.parse(localStorage.getItem(KEY(periodoId))) ?? {} } catch { return {} }
}
function localGuardar(periodoId, estructura) {
  localStorage.setItem(KEY(periodoId), JSON.stringify(estructura))
}

function asignacionVacia(periodoId, carreraId) {
  return {
    periodo_id:          periodoId,
    carrera_id:          carreraId,
    coordinador_uid:     null,   // coordinador o responsable del período
    docentes_uid:        [],     // docentes asignados a esta carrera ESTE período
    administrativos_uid: [],
    indicadores:         [],     // [{ id, nombre, meta }] del período
    actividades_plantilla: [],   // [{ titulo, categoria_ces }] definidas para el período
  }
}

// ── Lectura (períodos vigentes E históricos, sin restricción) ────────────────

/**
 * Estructura completa del período: { [carreraId]: asignacion }.
 * Para períodos finalizados es la foto histórica intacta.
 */
export async function getEstructuraPeriodo(periodoId) {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'periodos_academicos', periodoId, 'carreras'))
      if (!snap.empty) {
        const estructura = {}
        snap.docs.forEach(d => {
          const data = d.data()
          if (!data.eliminada) estructura[d.id] = data
        })
        return estructura
      }
    } catch (err) {
      console.warn('[estructuraPeriodo] Firestore no disponible:', err.code)
    }
  }
  return localCargar(periodoId)
}

/** Asignación de una carrera en el período (o estructura vacía si no participa aún). */
export async function getAsignacionCarrera(periodoId, carreraId) {
  const estructura = await getEstructuraPeriodo(periodoId)
  return estructura[carreraId] ?? asignacionVacia(periodoId, carreraId)
}

/** ¿En qué carreras participa un usuario en el período? (trazabilidad por usuario) */
export async function getCarrerasDeUsuario(periodoId, uid) {
  const estructura = await getEstructuraPeriodo(periodoId)
  return Object.values(estructura)
    .filter(a =>
      a.coordinador_uid === uid ||
      (a.docentes_uid ?? []).includes(uid) ||
      (a.administrativos_uid ?? []).includes(uid))
    .map(a => a.carrera_id)
}

// ── Escritura (solo períodos activo/próximo) ─────────────────────────────────

/**
 * Guarda (crea o actualiza) la asignación de una carrera en el período:
 * coordinador/responsable, docentes, administrativos, indicadores, actividades.
 * @param {Object} periodo - objeto período completo (se valida su estado)
 */
export async function guardarAsignacionCarrera(periodo, carreraId, datos) {
  assertEditable(periodo)
  const base = await getAsignacionCarrera(periodo.id, carreraId)
  const asignacion = { ...base, ...datos, periodo_id: periodo.id, carrera_id: carreraId }

  if (db) {
    try {
      await setDoc(
        doc(db, 'periodos_academicos', periodo.id, 'carreras', carreraId),
        { ...asignacion, actualizado_en: Timestamp.now() },
        { merge: true },
      )
      return asignacion
    } catch (err) {
      console.warn('[estructuraPeriodo] Firestore error:', err.code)
    }
  }
  const estructura = localCargar(periodo.id)
  estructura[carreraId] = asignacion
  localGuardar(periodo.id, estructura)
  return asignacion
}

/** Quita una carrera de la estructura del período (no borra la carrera del catálogo). */
export async function quitarCarreraDePeriodo(periodo, carreraId) {
  assertEditable(periodo)
  const estructura = localCargar(periodo.id)
  delete estructura[carreraId]
  localGuardar(periodo.id, estructura)
  if (db) {
    try {
      await setDoc(
        doc(db, 'periodos_academicos', periodo.id, 'carreras', carreraId),
        { eliminada: true, actualizado_en: Timestamp.now() },
        { merge: true },
      )
    } catch (err) {
      console.warn('[estructuraPeriodo] Firestore error:', err.code)
    }
  }
}

/**
 * Copia la estructura de un período anterior al período destino
 * ("mantener carreras existentes" al crear un nuevo semestre).
 * Copia carreras, coordinadores e indicadores; los docentes/administrativos
 * se copian solo si copiarUsuarios=true (por defecto sí, luego se ajustan).
 * @returns {number} carreras copiadas
 */
export async function copiarEstructura(periodoOrigenId, periodoDestino, { copiarUsuarios = true } = {}) {
  assertEditable(periodoDestino)
  const origen = await getEstructuraPeriodo(periodoOrigenId)
  let copiadas = 0
  for (const [carreraId, asig] of Object.entries(origen)) {
    if (asig.eliminada) continue
    await guardarAsignacionCarrera(periodoDestino, carreraId, {
      coordinador_uid:       asig.coordinador_uid ?? null,
      docentes_uid:          copiarUsuarios ? (asig.docentes_uid ?? []) : [],
      administrativos_uid:   copiarUsuarios ? (asig.administrativos_uid ?? []) : [],
      indicadores:           asig.indicadores ?? [],
      actividades_plantilla: asig.actividades_plantilla ?? [],
    })
    copiadas++
  }
  return copiadas
}
