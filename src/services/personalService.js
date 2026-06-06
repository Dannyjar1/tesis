/**
 * personalService.js — Gestión del personal de una carrera.
 * Firestore /usuarios con fallback localStorage.
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { USUARIOS_SEED } from './seedData'

const COL = 'usuarios'

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localKey(carreraId) { return `personal_${carreraId}` }

function localCargar(carreraId) {
  try {
    const raw = localStorage.getItem(localKey(carreraId))
    if (raw) return JSON.parse(raw)
    const seed = USUARIOS_SEED
      .filter(u => u.carrera_id === carreraId)
      .map(({ password: _, ...u }) => u)
    localStorage.setItem(localKey(carreraId), JSON.stringify(seed))
    return seed
  } catch { return [] }
}

function localGuardar(carreraId, lista) {
  localStorage.setItem(localKey(carreraId), JSON.stringify(lista))
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Devuelve todos los usuarios de una carrera (docentes + coordinador). */
export async function getPersonal(carreraId) {
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, COL), where('carrera_id', '==', carreraId))
      )
      return snap.docs.map(d => { const { password: _, ...data } = d.data(); return data })
    } catch (err) {
      console.warn('[personalService] Firestore no disponible, usando localStorage:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 200))
  return localCargar(carreraId)
}

/** Crea un nuevo usuario en la carrera. */
export async function crearPersonal(carreraId, datos) {
  const uid = `uid_${Date.now()}`
  const nuevo = {
    uid,
    nombre:          datos.nombre.trim(),
    apellido:        datos.apellido.trim(),
    nombre_completo: `${datos.nombre.trim()} ${datos.apellido.trim()}`,
    email:           datos.email.trim().toLowerCase(),
    rol:             datos.rol,
    tipo_contrato:   datos.tipo_contrato || null,
    carrera_id:      carreraId,
    activo:          true,
  }

  if (db) {
    try {
      await setDoc(doc(db, COL, uid), { ...nuevo, creado_en: Timestamp.now() })
      return nuevo
    } catch (err) {
      console.warn('[personalService] Firestore error en crearPersonal:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 300))
  const lista = localCargar(carreraId)
  lista.push(nuevo)
  localGuardar(carreraId, lista)
  return nuevo
}

/** Actualiza los datos de un usuario existente. */
export async function actualizarPersonal(carreraId, uid, datos) {
  const cambios = {
    nombre:          datos.nombre.trim(),
    apellido:        datos.apellido.trim(),
    nombre_completo: `${datos.nombre.trim()} ${datos.apellido.trim()}`,
    email:           datos.email.trim().toLowerCase(),
    rol:             datos.rol,
    tipo_contrato:   datos.tipo_contrato || null,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COL, uid), { ...cambios, actualizado_en: Timestamp.now() })
      return { uid, carrera_id: carreraId, ...cambios }
    } catch (err) {
      console.warn('[personalService] Firestore error en actualizarPersonal:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar(carreraId)
  const idx = lista.findIndex(u => u.uid === uid)
  if (idx === -1) throw new Error('Usuario no encontrado')
  lista[idx] = { ...lista[idx], ...cambios }
  localGuardar(carreraId, lista)
  return lista[idx]
}

/** Alterna el estado activo/inactivo de un usuario. */
export async function toggleActivo(carreraId, uid) {
  if (db) {
    try {
      const ref = doc(db, COL, uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Usuario no encontrado')
      const nuevoEstado = !snap.data().activo
      await updateDoc(ref, { activo: nuevoEstado, actualizado_en: Timestamp.now() })
      return { ...snap.data(), uid, activo: nuevoEstado }
    } catch (err) {
      if (!err.code) throw err
      console.warn('[personalService] Firestore error en toggleActivo:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 150))
  const lista = localCargar(carreraId)
  const idx = lista.findIndex(u => u.uid === uid)
  if (idx === -1) throw new Error('Usuario no encontrado')
  lista[idx] = { ...lista[idx], activo: !lista[idx].activo }
  localGuardar(carreraId, lista)
  return lista[idx]
}
