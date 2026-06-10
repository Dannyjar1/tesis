/**
 * matrizProductividadService.js — Matriz de Productividad (RF-043) y
 * docentes compartidos entre carreras (RF-042).
 *
 * RF-043: la Matriz de Productividad es el paso PREVIO al distributivo. La
 * carga de investigación llega pre-asignada desde Rectorado (Quito) y es de
 * SOLO LECTURA para todos los roles excepto Admin. El distributivo solo puede
 * elaborarse con la matriz en estado "aprobada".
 *
 * PENDIENTE: reemplazar MATRIZ_SEED con la matriz oficial cuando Rectorado
 * entregue los datos reales. La estructura y las reglas ya quedan operativas.
 *
 * Firestore /matriz_productividad con fallback localStorage (mock).
 */
import { collection, doc, getDocs, setDoc, query, where, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

const COL = 'matriz_productividad'
const KEY = (periodo) => `uide_matriz_${periodo}`

// ── Mock: matriz pre-asignada desde Rectorado (valores de ejemplo) ────────────
const MATRIZ_SEED = [
  { docente_uid: 'uid_mipalaciosmo', horas_investigacion: 8, proyecto: 'Clasificación NLP de actividades docentes',  estado: 'aprobada' },
  { docente_uid: 'uid_yetorresbe',   horas_investigacion: 4, proyecto: 'Analítica de datos educativos',              estado: 'aprobada' },
  { docente_uid: 'uid_locondezh',    horas_investigacion: 6, proyecto: 'Gobernanza de TI en educación superior',     estado: 'aprobada' },
]

function localCargar(periodoId) {
  const raw = localStorage.getItem(KEY(periodoId))
  if (raw) return JSON.parse(raw)
  const seed = MATRIZ_SEED.map(m => ({
    ...m,
    periodo_id: periodoId,
    origen: 'rectorado',           // pre-asignada desde Rectorado Quito
    fecha_asignacion: new Date().toISOString(),
  }))
  localStorage.setItem(KEY(periodoId), JSON.stringify(seed))
  return seed
}

/** Solo Admin (Pro-Rector) puede editar la carga de investigación (RF-043). */
export function puedeEditarMatriz(user) {
  return (user?.roles ?? [user?.rol]).includes('admin')
}

/** Matriz de productividad de un docente en el período (o null si no tiene). */
export async function getMatrizDocente(docenteUid, periodoId) {
  if (db) {
    try {
      const snap = await getDocs(query(
        collection(db, COL),
        where('docente_uid', '==', docenteUid),
        where('periodo_id', '==', periodoId),
      ))
      if (!snap.empty) return snap.docs[0].data()
    } catch (err) {
      console.warn('[matrizService] Firestore error:', err.code)
    }
  }
  return localCargar(periodoId).find(m => m.docente_uid === docenteUid) ?? null
}

/** Matriz completa del período. */
export async function getMatrizPeriodo(periodoId) {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, COL), where('periodo_id', '==', periodoId)))
      if (!snap.empty) return snap.docs.map(d => d.data())
    } catch (err) {
      console.warn('[matrizService] Firestore error:', err.code)
    }
  }
  return localCargar(periodoId)
}

/**
 * Gate del distributivo (RF-043): solo se elabora con matriz aprobada.
 * @returns {{ permitido: boolean, motivo: string|null }}
 */
export async function puedeElaborarDistributivo(docenteUid, periodoId) {
  const matriz = await getMatrizDocente(docenteUid, periodoId)
  if (!matriz) {
    return { permitido: false, motivo: 'El docente no tiene Matriz de Productividad asignada por Rectorado para este período.' }
  }
  if (matriz.estado !== 'aprobada') {
    return { permitido: false, motivo: `La Matriz de Productividad está en estado "${matriz.estado}". El distributivo solo se elabora con la matriz aprobada.` }
  }
  return { permitido: true, motivo: null }
}

/** Actualiza la carga de investigación — SOLO Admin (RF-043). */
export async function actualizarMatriz(user, docenteUid, periodoId, cambios) {
  if (!puedeEditarMatriz(user)) {
    throw new Error('La carga de investigación viene pre-asignada desde Rectorado y es de solo lectura. Solo el Admin (Pro-Rector) puede modificarla.')
  }
  const id = `matriz_${docenteUid}_${periodoId}`
  if (db) {
    try {
      await setDoc(doc(db, COL, id), {
        docente_uid: docenteUid, periodo_id: periodoId, origen: 'rectorado',
        ...cambios, actualizado_en: Timestamp.now(),
      }, { merge: true })
      return
    } catch (err) {
      console.warn('[matrizService] Firestore error:', err.code)
    }
  }
  const lista = localCargar(periodoId)
  const idx = lista.findIndex(m => m.docente_uid === docenteUid)
  if (idx >= 0) lista[idx] = { ...lista[idx], ...cambios }
  else lista.push({ docente_uid: docenteUid, periodo_id: periodoId, origen: 'rectorado', estado: 'aprobada', ...cambios })
  localStorage.setItem(KEY(periodoId), JSON.stringify(lista))
}

// ── RF-042: docentes compartidos entre carreras ───────────────────────────────

/**
 * Suma de horas ya asignadas al docente en OTRAS carreras del período.
 * Mock: lee los distributivos locales de todas las carreras; con Firestore
 * consulta /distributivos por docente_uid (sin filtrar carrera).
 */
export async function getHorasOtrasCarreras(docenteUid, periodoId, carreraActual) {
  if (db) {
    try {
      const snap = await getDocs(query(
        collection(db, 'distributivos'),
        where('docente_uid', '==', docenteUid),
        where('periodo_id', '==', periodoId),
      ))
      return snap.docs
        .map(d => d.data())
        .filter(dist => dist.carrera_id && dist.carrera_id !== carreraActual)
        .reduce((s, dist) => s + (dist.total_horas ?? 0), 0)
    } catch (err) {
      console.warn('[matrizService] Firestore error:', err.code)
    }
  }
  return 0 // mock: una sola carrera cargada en localStorage
}

/**
 * Valida que la suma de horas en TODAS las carreras no supere el límite del
 * contrato (RF-042). No duplica carga: las horas de otras carreras cuentan.
 * @returns {{ valido: boolean, motivo: string|null, total: number }}
 */
export async function validarCargaCompartida({ docenteUid, periodoId, carreraActual, horasNuevas, horasContrato }) {
  const otras = await getHorasOtrasCarreras(docenteUid, periodoId, carreraActual)
  const total = otras + horasNuevas
  if (horasContrato && total > horasContrato) {
    return {
      valido: false,
      total,
      motivo: `El docente ya tiene ${otras}h asignadas en otras carreras. Con estas ${horasNuevas}h sumaría ${total}h, superando las ${horasContrato}h de su contrato.`,
    }
  }
  return { valido: true, total, motivo: null }
}
