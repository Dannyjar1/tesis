/**
 * planesMejoraService.js — Planes de mejora por incumplimiento de horas (RF-037).
 * Cuando un docente no cumple, se registra un plan accionable (no solo una
 * notificación): descripción, fecha compromiso y responsable de seguimiento.
 * Firestore /planes_mejora con fallback localStorage.
 */
import {
  collection, doc, setDoc, getDocs, updateDoc, query, where, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'planes_mejora'
const KEY = (periodo) => `uide_planes_mejora_${periodo}`

function localCargar(periodoId) {
  try { return JSON.parse(localStorage.getItem(KEY(periodoId))) ?? [] } catch { return [] }
}
function localGuardar(periodoId, lista) {
  localStorage.setItem(KEY(periodoId), JSON.stringify(lista))
}

/**
 * Registra un plan de mejoras para un docente con incumplimiento.
 * @param {{ docente_uid, docente_nombre, periodo_id, descripcion,
 *           fecha_compromiso, responsable_uid, responsable_nombre,
 *           porcentaje_cumplimiento, creado_por }} datos
 */
export async function crearPlanMejora(datos) {
  if (!datos.descripcion?.trim()) throw new Error('La descripción del plan es obligatoria.')
  if (!datos.fecha_compromiso) throw new Error('La fecha compromiso es obligatoria.')
  if (!datos.responsable_nombre?.trim()) throw new Error('El responsable de seguimiento es obligatorio.')

  const id = `plan_${datos.docente_uid}_${Date.now()}`
  const plan = {
    id,
    docente_uid:             datos.docente_uid,
    docente_nombre:          datos.docente_nombre ?? '',
    periodo_id:              datos.periodo_id,
    descripcion:             datos.descripcion.trim(),
    fecha_registro:          new Date().toISOString(),
    fecha_compromiso:        datos.fecha_compromiso,
    responsable_uid:         datos.responsable_uid ?? null,
    responsable_nombre:      datos.responsable_nombre.trim(),
    porcentaje_cumplimiento: datos.porcentaje_cumplimiento ?? null,
    estado:                  'abierto', // abierto | cumplido | incumplido
    creado_por:              datos.creado_por ?? null,
  }

  if (db) {
    try {
      await setDoc(doc(db, COL, id), {
        ...plan,
        fecha_registro: Timestamp.now(),
        fecha_compromiso: Timestamp.fromDate(new Date(`${datos.fecha_compromiso}T12:00:00`)),
      })
      return plan
    } catch (err) {
      console.warn('[planesMejoraService] Firestore error:', err.code)
    }
  }

  const lista = localCargar(plan.periodo_id)
  lista.unshift(plan)
  localGuardar(plan.periodo_id, lista)
  return plan
}

/** Planes de mejora del período (opcionalmente filtrados por docente). */
export async function getPlanesMejora(periodoId, docenteUid = null) {
  if (db) {
    try {
      const filtros = [where('periodo_id', '==', periodoId)]
      if (docenteUid) filtros.push(where('docente_uid', '==', docenteUid))
      const snap = await getDocs(query(collection(db, COL), ...filtros))
      if (!snap.empty) {
        return snap.docs.map(d => {
          const p = d.data()
          return {
            ...p,
            fecha_registro:   p.fecha_registro?.toDate?.()?.toISOString() ?? p.fecha_registro,
            fecha_compromiso: p.fecha_compromiso?.toDate?.()?.toISOString() ?? p.fecha_compromiso,
          }
        })
      }
    } catch (err) {
      console.warn('[planesMejoraService] Firestore error:', err.code)
    }
  }
  const lista = localCargar(periodoId)
  return docenteUid ? lista.filter(p => p.docente_uid === docenteUid) : lista
}

/** Cambia el estado de un plan (abierto → cumplido | incumplido). */
export async function actualizarEstadoPlan(planId, periodoId, estado) {
  if (db) {
    try {
      await updateDoc(doc(db, COL, planId), { estado })
      return
    } catch (err) {
      console.warn('[planesMejoraService] Firestore error:', err.code)
    }
  }
  const lista = localCargar(periodoId)
  const idx = lista.findIndex(p => p.id === planId)
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], estado }
    localGuardar(periodoId, lista)
  }
}
