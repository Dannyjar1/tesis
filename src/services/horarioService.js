/**
 * horarioService.js — Horario semanal del docente.
 * Firestore /horario_semanal con fallback localStorage.
 */
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, where, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'horario_semanal'
const LOCAL_KEY = 'uide_horario_semanal'

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localCargar() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? [] }
  catch { return [] }
}

function localGuardar(lista) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lista))
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Devuelve los bloques del horario de un docente. */
export async function getHorario(docenteUid) {
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, COL), where('docente_uid', '==', docenteUid))
      )
      return snap.docs.map(d => d.data())
    } catch (err) {
      console.warn('[horarioService] Firestore no disponible, usando localStorage:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 150))
  return localCargar().filter(b => b.docente_uid === docenteUid)
}

/** Crea un bloque en el horario. */
export async function crearBloque(docenteUid, datos) {
  const id = `bloque_${docenteUid}_${Date.now()}`
  const nuevo = {
    id,
    docente_uid:  docenteUid,
    dia:          datos.dia,
    hora_inicio:  datos.hora_inicio,
    hora_fin:     datos.hora_fin,
    materia:      datos.materia,
    aula:         datos.aula ?? '',
  }

  if (db) {
    try {
      await setDoc(doc(db, COL, id), { ...nuevo, creado_en: Timestamp.now() })
      return nuevo
    } catch (err) {
      console.warn('[horarioService] Firestore error en crearBloque:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  lista.push(nuevo)
  localGuardar(lista)
  return nuevo
}

/** Elimina un bloque del horario. */
export async function eliminarBloque(id) {
  if (db) {
    try {
      await deleteDoc(doc(db, COL, id))
      return
    } catch (err) {
      console.warn('[horarioService] Firestore error en eliminarBloque:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 150))
  localGuardar(localCargar().filter(b => b.id !== id))
}
