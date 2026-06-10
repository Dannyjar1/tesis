/**
 * sistemaService.js — Gestión de usuarios y carreras para el superadmin (TIC).
 * Operaciones CRUD en Firestore /usuarios y /carreras.
 */
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { USUARIOS_SEED, CARRERAS_SEED } from './seedData'

// ── Fallback local (mock) ─────────────────────────────────────────────────────
// Cuando Firestore no está disponible (sin config o reglas que exigen auth
// real y la sesión es mock), se opera sobre seed + overlay en localStorage,
// igual que el resto de servicios del sistema.
const KEY_USUARIOS_LOCAL = 'uide_sistema_usuarios'
const KEY_CARRERAS_LOCAL = 'uide_sistema_carreras'

function overlay(key) {
  try { return JSON.parse(localStorage.getItem(key)) ?? {} } catch { return {} }
}
function guardarOverlay(key, id, datos) {
  const o = overlay(key)
  o[id] = { ...(o[id] ?? {}), ...datos }
  localStorage.setItem(key, JSON.stringify(o))
}

function usuariosLocal() {
  const o = overlay(KEY_USUARIOS_LOCAL)
  const base = USUARIOS_SEED.map(({ password: _, ...u }) => ({ ...u, ...(o[u.uid] ?? {}) }))
  const nuevos = Object.entries(o)
    .filter(([uid]) => !USUARIOS_SEED.some(u => u.uid === uid))
    .map(([uid, datos]) => ({ uid, activo: true, ...datos }))
  return [...base, ...nuevos].sort((a, b) => (a.nombre_completo ?? '').localeCompare(b.nombre_completo ?? ''))
}

function carrerasLocal() {
  const o = overlay(KEY_CARRERAS_LOCAL)
  const base = CARRERAS_SEED.map(c => ({ ...c, ...(o[c.id] ?? {}) }))
  const nuevas = Object.entries(o)
    .filter(([id]) => !CARRERAS_SEED.some(c => c.id === id))
    .map(([id, datos]) => ({ id, activo: true, ...datos }))
  return [...base, ...nuevas].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

// ── USUARIOS ──────────────────────────────────────────────────────────────────

/** Devuelve todos los usuarios del sistema. */
export async function getTodosUsuarios() {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'usuarios'), orderBy('nombre_completo')))
      if (!snap.empty) return snap.docs.map(d => ({ ...d.data(), uid: d.id }))
    } catch (err) {
      console.warn('[sistemaService] Firestore no disponible (usuarios):', err.code)
    }
  }
  return usuariosLocal()
}

/** Devuelve usuarios de una carrera específica. */
export async function getUsuariosPorCarrera(carreraId) {
  if (db) {
    try {
      const q = query(
        collection(db, 'usuarios'),
        where('carrera_id', '==', carreraId),
        orderBy('nombre_completo'),
      )
      const snap = await getDocs(q)
      if (!snap.empty) return snap.docs.map(d => ({ ...d.data(), uid: d.id }))
    } catch (err) {
      console.warn('[sistemaService] Firestore no disponible (usuarios carrera):', err.code)
    }
  }
  return usuariosLocal().filter(u => u.carrera_id === carreraId)
}

/**
 * Crea o actualiza un usuario en Firestore /usuarios.
 * @param {string} uid - UID de Firebase Auth (o id temporal si aún no ha hecho login)
 * @param {Object} datos - Campos del usuario según COL-001
 */
export async function guardarUsuario(uid, datos) {
  // Modelo multi-rol: siempre persistir roles[] junto al rol principal.
  // Si el doc ya tenía varios roles y el rol elegido está entre ellos, se
  // conservan; si cambió, se reinicia a [rol] (asignación explícita del TIC).
  if (db) {
    try {
      const ref = doc(db, 'usuarios', uid)
      const snap = await getDoc(ref)
      const previos = snap.exists() ? snap.data().roles : null
      const roles = Array.isArray(previos) && previos.includes(datos.rol)
        ? previos
        : [datos.rol]
      const payload = { ...datos, roles }
      if (snap.exists()) {
        await updateDoc(ref, { ...payload, ultima_modificacion: Timestamp.now() })
      } else {
        await setDoc(ref, { ...payload, uid, creado_en: Timestamp.now() })
      }
      return
    } catch (err) {
      console.warn('[sistemaService] Firestore error en guardarUsuario:', err.code)
    }
  }
  // Fallback mock: overlay en localStorage
  const previos = overlay(KEY_USUARIOS_LOCAL)[uid]?.roles
  const roles = Array.isArray(previos) && previos.includes(datos.rol) ? previos : [datos.rol]
  guardarOverlay(KEY_USUARIOS_LOCAL, uid, { ...datos, roles })
}

/**
 * Cambia el rol de un usuario existente.
 * Solo superadmin puede asignar/quitar roles admin y superadmin.
 */
export async function cambiarRolUsuario(uid, nuevoRol, carreraId = null) {
  const updates = { rol: nuevoRol, roles: [nuevoRol] }
  if (carreraId !== undefined) updates.carrera_id = carreraId
  if (db) {
    try { await updateDoc(doc(db, 'usuarios', uid), updates); return } catch (err) {
      console.warn('[sistemaService] Firestore error en cambiarRolUsuario:', err.code)
    }
  }
  guardarOverlay(KEY_USUARIOS_LOCAL, uid, updates)
}

/** Activa o desactiva una cuenta de usuario. */
export async function toggleActivoUsuario(uid, activo) {
  if (db) {
    try { await updateDoc(doc(db, 'usuarios', uid), { activo }); return } catch (err) {
      console.warn('[sistemaService] Firestore error en toggleActivoUsuario:', err.code)
    }
  }
  guardarOverlay(KEY_USUARIOS_LOCAL, uid, { activo })
}

// ── CARRERAS ──────────────────────────────────────────────────────────────────

/** Devuelve todas las carreras. */
export async function getCarreras() {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'carreras'), orderBy('nombre')))
      if (!snap.empty) return snap.docs.map(d => ({ ...d.data(), id: d.id }))
    } catch (err) {
      console.warn('[sistemaService] Firestore no disponible (carreras):', err.code)
    }
  }
  return carrerasLocal()
}

/**
 * Crea una nueva carrera.
 * El id debe ser un slug único: 'nueva-carrera'.
 */
export async function crearCarrera(datos) {
  const id = datos.id || datos.nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const nueva = {
    id,
    nombre:          datos.nombre,
    facultad:        datos.facultad ?? datos.escuela ?? null,
    director_uid:    datos.director_uid ?? null,
    coordinador_uid: datos.coordinador_uid ?? null,
    activo:          true,
  }
  if (db) {
    try {
      await setDoc(doc(db, 'carreras', id), { ...nueva, fecha_creacion: Timestamp.now() })
      return id
    } catch (err) {
      console.warn('[sistemaService] Firestore error en crearCarrera:', err.code)
    }
  }
  guardarOverlay(KEY_CARRERAS_LOCAL, id, nueva)
  return id
}

/** Actualiza datos de una carrera (nombre, facultad, director, coordinador). */
export async function actualizarCarrera(id, datos) {
  if (db) {
    try {
      await updateDoc(doc(db, 'carreras', id), { ...datos, ultima_modificacion: Timestamp.now() })
      return
    } catch (err) {
      console.warn('[sistemaService] Firestore error en actualizarCarrera:', err.code)
    }
  }
  guardarOverlay(KEY_CARRERAS_LOCAL, id, datos)
}

/** Habilita o deshabilita una carrera. */
export async function toggleActivoCarrera(id, activo) {
  if (db) {
    try { await updateDoc(doc(db, 'carreras', id), { activo }); return } catch (err) {
      console.warn('[sistemaService] Firestore error en toggleActivoCarrera:', err.code)
    }
  }
  guardarOverlay(KEY_CARRERAS_LOCAL, id, { activo })
}
