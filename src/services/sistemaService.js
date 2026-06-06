/**
 * sistemaService.js — Gestión de usuarios y carreras para el superadmin (TIC).
 * Operaciones CRUD en Firestore /usuarios y /carreras.
 */
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, where, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { USUARIOS_SEED, CARRERAS_SEED } from './seedData'

// ── USUARIOS ──────────────────────────────────────────────────────────────────

/** Devuelve todos los usuarios del sistema. */
export async function getTodosUsuarios() {
  if (db) {
    const snap = await getDocs(query(collection(db, 'usuarios'), orderBy('nombre_completo')))
    return snap.docs.map(d => ({ ...d.data(), uid: d.id }))
  }
  return USUARIOS_SEED.map(({ password: _, ...u }) => u)
}

/** Devuelve usuarios de una carrera específica. */
export async function getUsuariosPorCarrera(carreraId) {
  if (db) {
    const q = query(
      collection(db, 'usuarios'),
      where('carrera_id', '==', carreraId),
      orderBy('nombre_completo'),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ ...d.data(), uid: d.id }))
  }
  return USUARIOS_SEED
    .filter(u => u.carrera_id === carreraId)
    .map(({ password: _, ...u }) => u)
}

/**
 * Crea o actualiza un usuario en Firestore /usuarios.
 * @param {string} uid - UID de Firebase Auth (o id temporal si aún no ha hecho login)
 * @param {Object} datos - Campos del usuario según COL-001
 */
export async function guardarUsuario(uid, datos) {
  if (!db) throw new Error('Firestore no configurado.')
  const ref = doc(db, 'usuarios', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { ...datos, ultima_modificacion: Timestamp.now() })
  } else {
    await setDoc(ref, { ...datos, uid, creado_en: Timestamp.now() })
  }
}

/**
 * Cambia el rol de un usuario existente.
 * Solo superadmin puede asignar/quitar roles admin y superadmin.
 */
export async function cambiarRolUsuario(uid, nuevoRol, carreraId = null) {
  if (!db) throw new Error('Firestore no configurado.')
  const updates = { rol: nuevoRol }
  if (carreraId !== undefined) updates.carrera_id = carreraId
  await updateDoc(doc(db, 'usuarios', uid), updates)
}

/** Activa o desactiva una cuenta de usuario. */
export async function toggleActivoUsuario(uid, activo) {
  if (!db) throw new Error('Firestore no configurado.')
  await updateDoc(doc(db, 'usuarios', uid), { activo })
}

// ── CARRERAS ──────────────────────────────────────────────────────────────────

/** Devuelve todas las carreras. */
export async function getCarreras() {
  if (db) {
    const snap = await getDocs(query(collection(db, 'carreras'), orderBy('nombre')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  }
  return CARRERAS_SEED
}

/**
 * Crea una nueva carrera.
 * El id debe ser un slug único: 'nueva-carrera'.
 */
export async function crearCarrera(datos) {
  if (!db) throw new Error('Firestore no configurado.')
  const id = datos.id || datos.nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const ref = doc(db, 'carreras', id)
  await setDoc(ref, {
    id,
    nombre:          datos.nombre,
    escuela:         datos.escuela ?? null,
    director_uid:    datos.director_uid ?? null,
    coordinador_uid: datos.coordinador_uid ?? null,
    activo:          true,
    fecha_creacion:  Timestamp.now(),
  })
  return id
}

/** Actualiza datos de una carrera (nombre, escuela, director, coordinador). */
export async function actualizarCarrera(id, datos) {
  if (!db) throw new Error('Firestore no configurado.')
  await updateDoc(doc(db, 'carreras', id), {
    ...datos,
    ultima_modificacion: Timestamp.now(),
  })
}

/** Habilita o deshabilita una carrera. */
export async function toggleActivoCarrera(id, activo) {
  if (!db) throw new Error('Firestore no configurado.')
  await updateDoc(doc(db, 'carreras', id), { activo })
}
