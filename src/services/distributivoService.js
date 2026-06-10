/**
 * distributivoService.js — Firestore /distributivos con fallback localStorage.
 * ID de documento: {docenteUid}_{periodoId}
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, Timestamp, onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { validarCierreDistributivo } from '../utils/calculos'
import { ESTADOS_DISTRIBUTIVO } from '../utils/constants'
import { USUARIOS_SEED } from './seedData'

const LOCAL_KEY = 'uide_distributivos'
const COL = 'distributivos'
const COL_USUARIOS = 'usuarios'

const SEED_LOCAL = [
  {
    id: 'uid_mipalaciosmo_2026-A',
    docente_uid: 'uid_mipalaciosmo',
    periodo_id: '2026-A',
    tipo_contrato: 'tiempo_completo',
    estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
    horas_docencia_directa: 18,
    horas_preparacion: 10.8,
    horas_tutoria: 2,
    horas_investigacion: 4,
    horas_vinculacion: 3,
    horas_titulacion: 1,
    horas_gestion: 1.2,
    horas_reduccion_cargo: 0,
    total_horas: 40,
    materias_asignadas: 4,
    estudiantes_pc: 20,
    estudiantes_ppp: 15,
    proyectos_director: 1,
    proyectos_tribunal: 0,
    aprobado_por: null,
    fecha_aprobacion: null,
    fecha_ultima_modificacion: new Date().toISOString(),
  },
]

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localCargar() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(SEED_LOCAL))
    return SEED_LOCAL
  } catch { return SEED_LOCAL }
}

function localGuardar(lista) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lista))
}

// ── Normalización Firestore → JS ──────────────────────────────────────────────

function normalizar(data, id) {
  return {
    ...data,
    id: id ?? data.id,
    fecha_ultima_modificacion:
      data.fecha_ultima_modificacion?.toDate?.()?.toISOString() ?? data.fecha_ultima_modificacion,
    fecha_aprobacion:
      data.fecha_aprobacion?.toDate?.()?.toISOString() ?? data.fecha_aprobacion ?? null,
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Obtiene el distributivo de un docente para un período. */
export async function getDistributivo(docenteUid, periodoId) {
  if (db) {
    try {
      const id = `${docenteUid}_${periodoId}`
      const snap = await getDoc(doc(db, COL, id))
      return snap.exists() ? normalizar(snap.data(), snap.id) : null
    } catch (err) {
      console.warn('[distributivoService] Firestore no disponible, usando localStorage:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 100))
  return localCargar().find(d => d.docente_uid === docenteUid && d.periodo_id === periodoId) ?? null
}

/** Devuelve todos los distributivos del período (director/coordinador). */
export async function getDistributivosPorPeriodo(periodoId) {
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, COL), where('periodo_id', '==', periodoId))
      )
      return snap.docs.map(d => normalizar(d.data(), d.id))
    } catch (err) {
      console.warn('[distributivoService] Firestore no disponible, usando localStorage:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 100))
  return localCargar().filter(d => d.periodo_id === periodoId)
}

/**
 * Crea un distributivo en estado borrador.
 * Lanza error si ya existe uno aprobado/vigente para el mismo docente+período (RN-001).
 */
export async function crearDistributivo(datos) {
  const id = `${datos.docente_uid}_${datos.periodo_id}`

  if (db) {
    try {
      const ref = doc(db, COL, id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const existente = snap.data()
        if ([ESTADOS_DISTRIBUTIVO.APROBADO, ESTADOS_DISTRIBUTIVO.VIGENTE].includes(existente.estado)) {
          throw new Error('Ya existe un distributivo aprobado/vigente para este docente en el período (RN-001).')
        }
      }
      const nuevo = {
        id,
        ...datos,
        estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
        aprobado_por: null,
        fecha_aprobacion: null,
        fecha_ultima_modificacion: Timestamp.now(),
      }
      await setDoc(ref, nuevo)
      return normalizar(nuevo, id)
    } catch (err) {
      if (err.message.includes('RN-001')) throw err
      console.warn('[distributivoService] Firestore error en crearDistributivo:', err.code)
    }
  }

  // Fallback localStorage
  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  const existente = lista.find(d => d.id === id)
  if (existente && [ESTADOS_DISTRIBUTIVO.APROBADO, ESTADOS_DISTRIBUTIVO.VIGENTE].includes(existente.estado)) {
    throw new Error('Ya existe un distributivo aprobado/vigente para este docente en el período (RN-001).')
  }
  const nuevo = {
    id,
    ...datos,
    estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
    aprobado_por: null,
    fecha_aprobacion: null,
    fecha_ultima_modificacion: new Date().toISOString(),
  }
  localGuardar([...lista.filter(d => d.id !== id), nuevo])
  return nuevo
}

/** Actualiza un distributivo (solo en estado borrador o en_revision). */
export async function actualizarDistributivo(distributivoId, cambios) {
  if (db) {
    try {
      const ref = doc(db, COL, distributivoId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Distributivo no encontrado.')
      const actual = snap.data()
      if ([ESTADOS_DISTRIBUTIVO.APROBADO, ESTADOS_DISTRIBUTIVO.VIGENTE].includes(actual.estado)) {
        throw new Error('No se puede editar un distributivo aprobado o vigente.')
      }
      const actualizado = { ...cambios, fecha_ultima_modificacion: Timestamp.now() }
      await updateDoc(ref, actualizado)
      return normalizar({ ...actual, ...actualizado }, distributivoId)
    } catch (err) {
      if (!err.code) throw err
      console.warn('[distributivoService] Firestore error en actualizarDistributivo:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')
  const actual = lista[idx]
  if ([ESTADOS_DISTRIBUTIVO.APROBADO, ESTADOS_DISTRIBUTIVO.VIGENTE].includes(actual.estado)) {
    throw new Error('No se puede editar un distributivo aprobado o vigente.')
  }
  const actualizado = { ...actual, ...cambios, id: distributivoId, fecha_ultima_modificacion: new Date().toISOString() }
  lista[idx] = actualizado
  localGuardar(lista)
  return actualizado
}

/**
 * Aprueba un distributivo validado. Verifica suma de horas (RN-014).
 * @param {string} distributivoId
 * @param {string} aprobadoPorUid — UID del director
 * @param {number} horasContrato — 40 (TC) | 20 (MT)
 */
export async function aprobarDistributivo(distributivoId, aprobadoPorUid, horasContrato) {
  if (db) {
    try {
      const ref = doc(db, COL, distributivoId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Distributivo no encontrado.')
      const dist = snap.data()
      const validacion = validarCierreDistributivo(dist, horasContrato)
      if (!validacion.valido) throw new Error(validacion.mensaje)
      const cambios = {
        estado: ESTADOS_DISTRIBUTIVO.APROBADO,
        aprobado_por: aprobadoPorUid,
        fecha_aprobacion: Timestamp.now(),
        fecha_ultima_modificacion: Timestamp.now(),
      }
      await updateDoc(ref, cambios)
      return normalizar({ ...dist, ...cambios }, distributivoId)
    } catch (err) {
      if (!err.code) throw err
      console.warn('[distributivoService] Firestore error en aprobarDistributivo:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')
  const dist = lista[idx]
  const validacion = validarCierreDistributivo(dist, horasContrato)
  if (!validacion.valido) throw new Error(validacion.mensaje)
  const aprobado = {
    ...dist,
    estado: ESTADOS_DISTRIBUTIVO.APROBADO,
    aprobado_por: aprobadoPorUid,
    fecha_aprobacion: new Date().toISOString(),
    fecha_ultima_modificacion: new Date().toISOString(),
  }
  lista[idx] = aprobado
  localGuardar(lista)
  return aprobado
}

/** Cambia el estado del distributivo según el flujo permitido (RN-002). */
export async function cambiarEstadoDistributivo(distributivoId, nuevoEstado) {
  if (db) {
    try {
      const ref = doc(db, COL, distributivoId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Distributivo no encontrado.')
      const cambios = { estado: nuevoEstado, fecha_ultima_modificacion: Timestamp.now() }
      await updateDoc(ref, cambios)
      return normalizar({ ...snap.data(), ...cambios }, distributivoId)
    } catch (err) {
      if (!err.code) throw err
      console.warn('[distributivoService] Firestore error en cambiarEstado:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 150))
  const lista = localCargar()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')
  lista[idx] = { ...lista[idx], estado: nuevoEstado, fecha_ultima_modificacion: new Date().toISOString() }
  localGuardar(lista)
  return lista[idx]
}

/**
 * Suscripción en tiempo real al distributivo de un docente.
 * @returns {Function} unsubscribe
 */
export function suscribirseDistributivo(docenteUid, periodoId, callback) {
  if (db) {
    const id = `${docenteUid}_${periodoId}`
    return onSnapshot(
      doc(db, COL, id),
      snap => callback(snap.exists() ? normalizar(snap.data(), snap.id) : null),
      err => console.warn('[distributivoService] onSnapshot error:', err.code)
    )
  }
  getDistributivo(docenteUid, periodoId).then(callback)
  return () => {}
}

/**
 * Devuelve docentes de una carrera (o todos) desde Firestore /usuarios.
 * Fallback: USUARIOS_SEED filtrados por rol==='docente'.
 */
export async function getDocentes(carreraId = null) {
  if (db) {
    try {
      const condiciones = [where('rol', '==', 'docente'), where('activo', '==', true)]
      if (carreraId) condiciones.push(where('carrera_id', '==', carreraId))
      const snap = await getDocs(query(collection(db, COL_USUARIOS), ...condiciones))
      return snap.docs.map(d => d.data())
    } catch (err) {
      console.warn('[distributivoService] Firestore error en getDocentes:', err.code)
    }
  }
  const docentes = USUARIOS_SEED.filter(u => u.rol === 'docente' && u.activo)
  return carreraId ? docentes.filter(u => u.carrera_id === carreraId) : docentes
}

/** @deprecated Usar getDocentes(). Mantenido por compatibilidad. */
export function getDocentesMock() {
  return USUARIOS_SEED.filter(u => u.rol === 'docente' && u.activo)
}

/** Reinicia datos mock (solo desarrollo/tests). */
export function resetMock() {
  localStorage.removeItem(LOCAL_KEY)
}
