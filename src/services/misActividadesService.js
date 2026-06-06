/**
 * Servicio de Mis Actividades — Firestore /tareas_todo con fallback localStorage.
 * Si db está disponible usa Firestore; si no, opera en modo mock local.
 * Estados: por_hacer | en_progreso | completada
 */
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, Timestamp, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

const LOCAL_KEY = 'uide_mis_actividades'

// ── Helpers localStorage (fallback) ──────────────────────────────────────────

function localCargar() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? []
    return data.map(a => a.estado === 'pendiente' ? { ...a, estado: 'por_hacer' } : a)
  } catch { return [] }
}

function localGuardar(lista) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lista))
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function getActividades(docenteUid) {
  if (db) {
    try {
      const q = query(
        collection(db, 'tareas_todo'),
        where('docente_uid', '==', docenteUid),
        orderBy('fecha_creacion', 'desc'),
      )
      const snap = await getDocs(q)
      return snap.docs.map(d => {
        const data = d.data()
        return {
          ...data,
          id: d.id,
          fecha_creacion:   data.fecha_creacion?.toDate?.()?.toISOString() ?? data.fecha_creacion,
          fecha_completada: data.fecha_completada?.toDate?.()?.toISOString() ?? data.fecha_completada,
          fecha_limite:     data.fecha_limite?.toDate?.()?.toISOString() ?? data.fecha_limite,
        }
      })
    } catch (err) {
      console.warn('[misActividadesService] Firestore no disponible, usando localStorage:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 250))
  return localCargar().filter(a => a.docente_uid === docenteUid)
}

export async function crearActividad(docenteUid, datos) {
  const nueva = {
    docente_uid:     docenteUid,
    titulo:          datos.titulo,
    categoria_ces:   datos.categoria_ces,
    fecha_limite:    datos.fecha_limite ?? null,
    estado:          'por_hacer',
    fecha_creacion:  new Date().toISOString(),
    fecha_completada: null,
  }

  if (db) {
    const docRef = await addDoc(collection(db, 'tareas_todo'), {
      ...nueva,
      fecha_creacion: Timestamp.now(),
      fecha_limite:   datos.fecha_limite ? Timestamp.fromDate(new Date(datos.fecha_limite)) : null,
    })
    return { ...nueva, id: docRef.id }
  }

  await new Promise(r => setTimeout(r, 250))
  const local = { ...nueva, id: `act_${Date.now()}` }
  const lista = localCargar()
  lista.unshift(local)
  localGuardar(lista)
  return local
}

export async function actualizarActividad(id, cambios) {
  if (db) {
    const { fecha_limite, fecha_completada, ...resto } = cambios
    const updates = { ...resto }
    if (fecha_limite !== undefined)
      updates.fecha_limite = fecha_limite ? Timestamp.fromDate(new Date(fecha_limite)) : null
    if (fecha_completada !== undefined)
      updates.fecha_completada = fecha_completada ? Timestamp.fromDate(new Date(fecha_completada)) : null
    await updateDoc(doc(db, 'tareas_todo', id), updates)
    return
  }
  await new Promise(r => setTimeout(r, 250))
  localGuardar(localCargar().map(a => a.id === id ? { ...a, ...cambios } : a))
}

export async function moverActividad(id, nuevoEstado) {
  const fechaCompletada = nuevoEstado === 'completada' ? new Date().toISOString() : null

  if (db) {
    await updateDoc(doc(db, 'tareas_todo', id), {
      estado:          nuevoEstado,
      fecha_completada: fechaCompletada ? Timestamp.fromDate(new Date(fechaCompletada)) : null,
    })
    return
  }
  await new Promise(r => setTimeout(r, 150))
  localGuardar(localCargar().map(a =>
    a.id === id ? { ...a, estado: nuevoEstado, fecha_completada: fechaCompletada } : a
  ))
}

export async function eliminarActividad(id) {
  if (db) {
    await deleteDoc(doc(db, 'tareas_todo', id))
    return
  }
  await new Promise(r => setTimeout(r, 200))
  localGuardar(localCargar().filter(a => a.id !== id))
}
