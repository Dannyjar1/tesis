/**
 * distributivoService.js — Firestore /distributivos con fallback localStorage.
 * ID de documento: {docenteUid}_{periodoId}
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, Timestamp, onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { ESTADOS_DISTRIBUTIVO } from '../utils/constants'
import { USUARIOS_SEED } from './seedData'
import { construirDistributivoDoc, normalizarDistributivo } from '../modules/distributivo/modeloDistributivo'

const LOCAL_KEY = 'uide_distributivos'
const COL = 'distributivos'
const COL_USUARIOS = 'usuarios'
// Versión del seed: al cambiarla se fuerza una recarga de los datos semilla,
// para que quien ya tenga localStorage viejo reciba los nuevos distributivos.
// 2026-06-24: nueva estructura oficial de 4 bloques (plantilla UIDE).
const SEED_VERSION = '2026-06-24'

// Distributivos semilla con la estructura oficial de 4 bloques (plantilla UIDE),
// para los docentes de Ingeniería en Sistemas, con estados variados para demo
// (borrador, en_revisión, aprobado). Se construyen con construirDistributivoDoc
// para que incluyan tanto los campos nuevos como los derivados (compatibilidad).
const SEED_LOCAL = [
  // Palacios (docente TC) — borrador (40h)
  construirDistributivoDoc(
    {
      asignaturas: [
        { dia: 'lunes',     materia: 'Base de Datos',          inicio: '08:00', fin: '10:00' },
        { dia: 'martes',    materia: 'Estructura de Datos',    inicio: '15:00', fin: '18:00' },
        { dia: 'miercoles', materia: 'Programación Avanzada',  inicio: '08:00', fin: '11:00' },
        { dia: 'jueves',    materia: 'Arquitectura de Computadoras', inicio: '08:00', fin: '10:00' },
        { dia: 'jueves',    materia: 'Arquitectura de Computadoras', inicio: '11:00', fin: '13:00' },
        { dia: 'viernes',   materia: 'Redes de Computadoras',  inicio: '15:00', fin: '17:00' },
      ],
      horas_tutorias: 3, horas_otras_docencia: 3,
      horas_proyecto_investigacion: 6,
      horas_proyectos_vinculacion: 3, horas_practicas_preprofesionales: 2,
      gestion_poa: 2, gestion_coordinacion_academica: 2, gestion_acreditaciones: 2, gestion_clubes_proyectos_eventos: 3,
    },
    {
      id: 'uid_mipalaciosmo_2026-A', docente_uid: 'uid_mipalaciosmo', periodo_id: '2026-A',
      tipo_contrato: 'tiempo_completo', estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
      aprobado_por: null, fecha_aprobacion: null,
      fecha_ultima_modificacion: new Date().toISOString(),
    },
  ),
  // Conde (directora + docente TC) — aprobado (doble firma)
  construirDistributivoDoc(
    {
      asignaturas: [
        { dia: 'martes', materia: 'Inteligencia Artificial', inicio: '08:00', fin: '10:00' },
        { dia: 'jueves', materia: 'Trabajo de Titulación',   inicio: '15:00', fin: '18:00' },
      ],
      horas_tutorias: 1, horas_otras_docencia: 1,
      horas_proyecto_investigacion: 6,
      horas_proyectos_vinculacion: 2,
      gestion_direccion_escuela: 12, gestion_acreditaciones: 5, gestion_poa: 4,
      gestion_internacionalizacion: 2, gestion_clubes_proyectos_eventos: 2,
    },
    {
      id: 'uid_locondezh_2026-A', docente_uid: 'uid_locondezh', periodo_id: '2026-A',
      tipo_contrato: 'tiempo_completo', estado: ESTADOS_DISTRIBUTIVO.APROBADO,
      aprobado_por: 'uid_locondezh', confirmado_por_docente: 'uid_locondezh',
      fecha_aprobacion: new Date(2026, 4, 18).toISOString(),
      fecha_ultima_modificacion: new Date(2026, 4, 18).toISOString(),
    },
  ),
  // Valarezo (coordinador + docente TC) — en revisión (espera su confirmación)
  construirDistributivoDoc(
    {
      asignaturas: [
        { dia: 'lunes',     materia: 'Calidad de Software',        inicio: '08:00', fin: '11:00' },
        { dia: 'miercoles', materia: 'Ingeniería de Software',     inicio: '15:00', fin: '18:00' },
      ],
      horas_tutorias: 2, horas_otras_docencia: 1,
      horas_proyecto_investigacion: 4,
      horas_proyectos_vinculacion: 2, horas_seguimiento_graduados: 1,
      gestion_coordinacion_academica: 14, gestion_poa: 4, gestion_representantes_saic: 2, gestion_clubes_proyectos_eventos: 4,
    },
    {
      id: 'uid_davalarezole_2026-A', docente_uid: 'uid_davalarezole', periodo_id: '2026-A',
      tipo_contrato: 'tiempo_completo', estado: ESTADOS_DISTRIBUTIVO.EN_REVISION,
      aprobado_por: 'uid_locondezh', fecha_aprobacion: new Date(2026, 4, 19).toISOString(),
      fecha_ultima_modificacion: new Date(2026, 4, 19).toISOString(),
    },
  ),
  // Torres (docente MT) — borrador (20h)
  construirDistributivoDoc(
    {
      asignaturas: [
        { dia: 'martes',  materia: 'Programación Web',      inicio: '15:00', fin: '18:00' },
        { dia: 'jueves',  materia: 'Sistemas Operativos',   inicio: '08:00', fin: '10:00' },
        { dia: 'jueves',  materia: 'Sistemas Operativos',   inicio: '11:00', fin: '13:00' },
        { dia: 'viernes', materia: 'Bases de Datos II',     inicio: '15:00', fin: '18:00' },
      ],
      horas_tutorias: 1, horas_otras_docencia: 1,
      horas_proyectos_vinculacion: 2,
      gestion_poa: 3, gestion_clubes_proyectos_eventos: 3,
    },
    {
      id: 'uid_yetorresbe_2026-A', docente_uid: 'uid_yetorresbe', periodo_id: '2026-A',
      tipo_contrato: 'medio_tiempo', estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
      aprobado_por: null, fecha_aprobacion: null,
      fecha_ultima_modificacion: new Date().toISOString(),
    },
  ),
]

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localCargar() {
  try {
    const ver = localStorage.getItem(LOCAL_KEY + '_ver')
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw && ver === SEED_VERSION) return JSON.parse(raw)
    // Sin datos o seed desactualizado → (re)cargar el seed actual.
    localStorage.setItem(LOCAL_KEY, JSON.stringify(SEED_LOCAL))
    localStorage.setItem(LOCAL_KEY + '_ver', SEED_VERSION)
    return SEED_LOCAL
  } catch { return SEED_LOCAL }
}

function localGuardar(lista) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lista))
}

// ── Normalización Firestore → JS ──────────────────────────────────────────────

function normalizar(data, id) {
  // normalizarDistributivo migra registros del esquema anterior a los 4 bloques.
  return normalizarDistributivo({
    ...data,
    id: id ?? data.id,
    fecha_ultima_modificacion:
      data.fecha_ultima_modificacion?.toDate?.()?.toISOString() ?? data.fecha_ultima_modificacion,
    fecha_aprobacion:
      data.fecha_aprobacion?.toDate?.()?.toISOString() ?? data.fecha_aprobacion ?? null,
  })
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
  const local = localCargar().find(d => d.docente_uid === docenteUid && d.periodo_id === periodoId)
  return local ? normalizarDistributivo(local) : null
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
  return localCargar().filter(d => d.periodo_id === periodoId).map(normalizarDistributivo)
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
 * Aprobación del director: deja el distributivo EN REVISIÓN, a la espera de la
 * confirmación del docente. La validación de 40h es informativa y NO bloquea la
 * aprobación (estructura oficial UIDE). La aprobación NO es definitiva hasta que
 * el docente confirma (doble firma). Si el docente observa, vuelve a borrador.
 * @param {string} distributivoId
 * @param {string} aprobadoPorUid — UID del director
 * @param {number} [_horasContrato] — referencia de contrato (informativo, sin uso)
 */
export async function aprobarDistributivo(distributivoId, aprobadoPorUid, _horasContrato) {
  if (db) {
    try {
      const ref = doc(db, COL, distributivoId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Distributivo no encontrado.')
      const dist = snap.data()
      // La validación de 40h es informativa (estructura oficial UIDE): NO bloquea
      // la aprobación. El total se muestra en el formulario y el PDF.
      const cambios = {
        estado: ESTADOS_DISTRIBUTIVO.EN_REVISION,
        aprobado_por: aprobadoPorUid,
        fecha_aprobacion: Timestamp.now(),
        observacion_docente: null,
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
  // Validación 40h informativa: NO bloquea la aprobación.
  const enRevision = {
    ...dist,
    estado: ESTADOS_DISTRIBUTIVO.EN_REVISION,
    aprobado_por: aprobadoPorUid,
    fecha_aprobacion: new Date().toISOString(),
    observacion_docente: null,
    fecha_ultima_modificacion: new Date().toISOString(),
  }
  lista[idx] = enRevision
  localGuardar(lista)
  return enRevision
}

/**
 * Confirmación del docente (segunda firma). Solo válida si el director ya
 * aprobó (estado EN_REVISIÓN). Deja el distributivo APROBADO definitivamente.
 * @param {string} distributivoId
 * @param {string} docenteUid — UID del docente que confirma
 */
export async function confirmarDistributivoDocente(distributivoId, docenteUid) {
  const sello = {
    estado: ESTADOS_DISTRIBUTIVO.APROBADO,
    confirmado_por_docente: docenteUid,
  }
  if (db) {
    try {
      const ref = doc(db, COL, distributivoId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Distributivo no encontrado.')
      const dist = snap.data()
      if (dist.estado !== ESTADOS_DISTRIBUTIVO.EN_REVISION) {
        throw new Error('El distributivo no está pendiente de tu confirmación.')
      }
      const cambios = { ...sello, fecha_confirmacion_docente: Timestamp.now(), fecha_ultima_modificacion: Timestamp.now() }
      await updateDoc(ref, cambios)
      return normalizar({ ...dist, ...cambios }, distributivoId)
    } catch (err) {
      if (!err.code) throw err
      console.warn('[distributivoService] Firestore error en confirmarDistributivoDocente:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')
  if (lista[idx].estado !== ESTADOS_DISTRIBUTIVO.EN_REVISION) {
    throw new Error('El distributivo no está pendiente de tu confirmación.')
  }
  lista[idx] = { ...lista[idx], ...sello, fecha_confirmacion_docente: new Date().toISOString(), fecha_ultima_modificacion: new Date().toISOString() }
  localGuardar(lista)
  return lista[idx]
}

/**
 * Observación del docente: rechaza la propuesta del director y devuelve el
 * distributivo a BORRADOR con la observación registrada (vuelve a revisión).
 * @param {string} distributivoId
 * @param {string} observacion — motivo (obligatorio)
 */
export async function observarDistributivo(distributivoId, observacion) {
  if (!observacion?.trim()) throw new Error('La observación es obligatoria.')
  const cambiosBase = {
    estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
    observacion_docente: observacion.trim(),
    aprobado_por: null,
    fecha_aprobacion: null,
  }
  if (db) {
    try {
      const ref = doc(db, COL, distributivoId)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Distributivo no encontrado.')
      const cambios = { ...cambiosBase, fecha_ultima_modificacion: Timestamp.now() }
      await updateDoc(ref, cambios)
      return normalizar({ ...snap.data(), ...cambios }, distributivoId)
    } catch (err) {
      if (!err.code) throw err
      console.warn('[distributivoService] Firestore error en observarDistributivo:', err.code)
    }
  }

  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')
  lista[idx] = { ...lista[idx], ...cambiosBase, fecha_ultima_modificacion: new Date().toISOString() }
  localGuardar(lista)
  return lista[idx]
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
    // Consistente con el resto del servicio: si Firestore está inalcanzable
    // (modo mock/offline) cae a localStorage en lugar de devolver null.
    const fallback = () => getDistributivo(docenteUid, periodoId).then(callback)
    // Garantía anti-cuelgue: si Firestore no responde en 4s, resolvemos local.
    let primerResultado = false
    const safety = setTimeout(() => { if (!primerResultado) { primerResultado = true; fallback() } }, 4000)
    const unsub = onSnapshot(
      doc(db, COL, id),
      snap => {
        primerResultado = true; clearTimeout(safety)
        if (snap.exists()) callback(normalizar(snap.data(), snap.id))
        else if (snap.metadata?.fromCache) fallback()   // offline, sin dato del servidor
        else callback(null)
      },
      err => { primerResultado = true; clearTimeout(safety); console.warn('[distributivoService] onSnapshot error:', err.code); fallback() }
    )
    return () => { clearTimeout(safety); unsub() }
  }
  getDistributivo(docenteUid, periodoId).then(callback)
  return () => {}
}

/** ¿El usuario es docente? Considera el array roles[] (multi-rol), no solo el
 *  rol principal: un director/coordinador también es docente. */
function esDocente(u) {
  return (u.roles ?? (u.rol ? [u.rol] : [])).includes('docente')
}

/** Overlay de cambios de usuarios (mismo que sistemaService/authService) para
 *  que los cambios de rol/carrera se reflejen en los listados de docentes. */
function overlayUsuariosLocal() {
  try { return JSON.parse(localStorage.getItem('uide_sistema_usuarios')) ?? {} } catch { return {} }
}

/**
 * Devuelve docentes de una carrera (o todos) desde Firestore /usuarios.
 * Incluye a quienes son docente + cargo (director/coordinador) porque todo
 * cargo lo ejerce un docente. Fallback: USUARIOS_SEED.
 */
export async function getDocentes(carreraId = null) {
  if (db) {
    try {
      const condiciones = [where('roles', 'array-contains', 'docente'), where('activo', '==', true)]
      if (carreraId) condiciones.push(where('carrera_id', '==', carreraId))
      const snap = await getDocs(query(collection(db, COL_USUARIOS), ...condiciones))
      return snap.docs.map(d => d.data())
    } catch (err) {
      console.warn('[distributivoService] Firestore error en getDocentes:', err.code)
    }
  }
  const overlay = overlayUsuariosLocal()
  const docentes = USUARIOS_SEED
    .map(u => ({ ...u, ...(overlay[u.uid] ?? {}) }))   // aplicar cambios persistidos
    .filter(u => esDocente(u) && u.activo)
  return carreraId ? docentes.filter(u => u.carrera_id === carreraId) : docentes
}

/** @deprecated Usar getDocentes(). Mantenido por compatibilidad. */
export function getDocentesMock() {
  const overlay = overlayUsuariosLocal()
  return USUARIOS_SEED
    .map(u => ({ ...u, ...(overlay[u.uid] ?? {}) }))
    .filter(u => esDocente(u) && u.activo)
}

/** Reinicia datos mock (solo desarrollo/tests). */
export function resetMock() {
  localStorage.removeItem(LOCAL_KEY)
}
