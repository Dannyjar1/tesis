/**
 * actividadesService.js — Actividades académicas confirmadas del docente.
 * Firestore /actividades con fallback localStorage.
 * Colección distinta de /tareas_todo (Kanban) — estas son actividades
 * confirmadas tras la clasificación IA del calendario.
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'actividades'
const LOCAL_KEY = (uid, periodo) => `uide_actividades_${uid}_${periodo}`

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localCargar(uid, periodo) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(uid, periodo))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function localGuardar(uid, periodo, lista) {
  localStorage.setItem(LOCAL_KEY(uid, periodo), JSON.stringify(lista))
}

function normalizar(data, id) {
  return {
    ...data,
    id: id ?? data.id,
    fecha_actividad:
      data.fecha_actividad?.toDate?.()?.toISOString() ?? data.fecha_actividad,
    fecha_creacion:
      data.fecha_creacion?.toDate?.()?.toISOString() ?? data.fecha_creacion,
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Devuelve actividades confirmadas del docente para un período. */
export async function getActividades(docenteUid, periodoId) {
  if (db) {
    try {
      const snap = await getDocs(
        query(
          collection(db, COL),
          where('docente_uid', '==', docenteUid),
          where('periodo_id',  '==', periodoId),
          orderBy('fecha_actividad', 'asc'),
        )
      )
      const lista = snap.docs.map(d => normalizar(d.data(), d.id))
      localGuardar(docenteUid, periodoId, lista)
      return lista
    } catch (err) {
      console.warn('[actividadesService] Firestore no disponible:', err.code)
    }
  }
  return localCargar(docenteUid, periodoId)
}

/**
 * Crea una actividad confirmada.
 * @param {{ docente_uid, periodo_id, titulo, categoria, horas, fecha_actividad, evento_id? }} actividad
 */
export async function crearActividad(actividad) {
  const id = `act_${actividad.docente_uid}_${Date.now()}`
  const nueva = {
    id,
    docente_uid:     actividad.docente_uid,
    periodo_id:      actividad.periodo_id,
    titulo:          actividad.titulo,
    categoria:       actividad.categoria,
    horas:           actividad.horas ?? 0,
    fecha_actividad: actividad.fecha_actividad ?? new Date().toISOString(),
    evento_id:       actividad.evento_id ?? null,
    estado:          'confirmada',
    notas:           actividad.notas ?? '',
  }

  if (db) {
    try {
      await setDoc(doc(db, COL, id), {
        ...nueva,
        fecha_actividad: Timestamp.fromDate(new Date(nueva.fecha_actividad)),
        fecha_creacion:  Timestamp.now(),
      })
      return nueva
    } catch (err) {
      console.warn('[actividadesService] Firestore error en crearActividad:', err.code)
    }
  }

  const lista = localCargar(nueva.docente_uid, nueva.periodo_id)
  lista.push({ ...nueva, fecha_creacion: new Date().toISOString() })
  localGuardar(nueva.docente_uid, nueva.periodo_id, lista)
  return nueva
}

/** Actualiza una actividad existente. */
export async function actualizarActividad(actividadId, cambios) {
  if (db) {
    try {
      const ref = doc(db, COL, actividadId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Actividad no encontrada.')
      await updateDoc(ref, { ...cambios, fecha_actualizacion: Timestamp.now() })
      return normalizar({ ...snap.data(), ...cambios }, actividadId)
    } catch (err) {
      if (!err.code) throw err
      console.warn('[actividadesService] Firestore error en actualizarActividad:', err.code)
    }
  }

  // Fallback: necesita docente_uid y periodo_id en cambios o en el objeto
  const uid = cambios.docente_uid
  const periodo = cambios.periodo_id
  if (!uid || !periodo) throw new Error('Se requiere docente_uid y periodo_id para actualizar en modo offline.')
  const lista = localCargar(uid, periodo)
  const idx = lista.findIndex(a => a.id === actividadId)
  if (idx === -1) throw new Error('Actividad no encontrada.')
  lista[idx] = { ...lista[idx], ...cambios, fecha_actualizacion: new Date().toISOString() }
  localGuardar(uid, periodo, lista)
  return lista[idx]
}

/**
 * Suscripción en tiempo real a las actividades del docente.
 * @returns {Function} unsubscribe
 */
export function suscribirseActividades(docenteUid, periodoId, callback) {
  if (db) {
    return onSnapshot(
      query(
        collection(db, COL),
        where('docente_uid', '==', docenteUid),
        where('periodo_id',  '==', periodoId),
        orderBy('fecha_actividad', 'asc'),
      ),
      snap => callback(snap.docs.map(d => normalizar(d.data(), d.id))),
      err => console.warn('[actividadesService] onSnapshot error:', err.code)
    )
  }
  getActividades(docenteUid, periodoId).then(callback)
  return () => {}
}
