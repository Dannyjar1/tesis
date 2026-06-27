/**
 * actividadesService.js — Actividades ASIGNADAS por el director al docente.
 *
 * Concepto (PROJECT_BRIEF §5, §10, §15 · RESTRUCTURE §3): el director crea y
 * asigna actividades a un docente con categoría, prioridad y fechas; el docente
 * las ve, actualiza su estado y sube evidencia. NO es un tablero personal: el
 * docente no crea actividades por su cuenta.
 *
 * Firestore /actividades con fallback localStorage (mock). En mock se guarda la
 * lista completa del período bajo una sola clave; las vistas filtran en cliente.
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, onSnapshot, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { getDistributivo } from './distributivoService'
import { crearNotificacion } from './notificacionesService'
import { ESTADOS_ACTIVIDAD, CATEGORIA_A_HORAS_DISTRIBUTIVO, CATEGORIA_LABELS } from '../utils/constants'

const COL = 'actividades'
const LOCAL_KEY = (periodo) => `uide_actividades_${periodo}`
// Al cambiar la versión se recargan las actividades semilla del período (para
// que quien ya tenga localStorage viejo reciba el seed nuevo).
const SEED_VERSION = '2026-06-18'

const DIR = { uid: 'uid_locondezh', nombre: 'Lorena Conde Zhingre' }
const iso = (y, m, d) => new Date(y, m - 1, d).toISOString()

// Actividades semilla del período activo 2026-A (PROJECT_BRIEF C.3):
// 6 a docentes de Sistemas con estados variados + 2 asignadas a Lorena (docente).
const SEED_ACTIVIDADES = {
  '2026-A': [
    { id: 'act_seed_1', titulo: 'Elaborar artículo Q2', descripcion: 'Artículo para revista indexada.', categoria_ces: 'investigacion', subcategoria: '2.2', prioridad: 'urgente', estado: 'pendiente', asignada_a_uid: 'uid_mipalaciosmo', asignada_a_nombre: 'Milton Palacios Morocho', fecha_limite: iso(2026, 7, 20), evidencia_url: null },
    { id: 'act_seed_2', titulo: 'Informe de prácticas comunitarias', descripcion: 'Consolidar avances del semestre.', categoria_ces: 'vinculacion', subcategoria: '3.1', prioridad: 'normal', estado: 'en_progreso', asignada_a_uid: 'uid_mipalaciosmo', asignada_a_nombre: 'Milton Palacios Morocho', fecha_limite: iso(2026, 7, 30), evidencia_url: null },
    { id: 'act_seed_3', titulo: 'Subir notas parciales', descripcion: 'Registro de calificaciones del primer parcial.', categoria_ces: 'docencia', subcategoria: '1.1', prioridad: 'normal', estado: 'completada', asignada_a_uid: 'uid_mipalaciosmo', asignada_a_nombre: 'Milton Palacios Morocho', fecha_limite: iso(2026, 6, 10), fecha_completada: iso(2026, 6, 9), evidencia_url: 'https://drive.google.com/uide/notas-parciales.pdf' },
    { id: 'act_seed_4', titulo: 'Plan de tutorías académicas', descripcion: 'Definir horario de tutorías repartido en la semana.', categoria_ces: 'docencia', subcategoria: '1.2', prioridad: 'normal', estado: 'pendiente', asignada_a_uid: 'uid_yetorresbe', asignada_a_nombre: 'Yeferson Torres Berru', fecha_limite: iso(2026, 7, 25), evidencia_url: null },
    { id: 'act_seed_5', titulo: 'Actualizar sílabos', descripcion: 'Revisión de sílabos según malla vigente.', categoria_ces: 'gestion', subcategoria: '4.10', prioridad: 'normal', estado: 'en_progreso', asignada_a_uid: 'uid_yetorresbe', asignada_a_nombre: 'Yeferson Torres Berru', fecha_limite: iso(2026, 7, 28), evidencia_url: null },
    { id: 'act_seed_6', titulo: 'Revisión de artículo de coautoría', descripcion: 'Pendiente desde el período anterior.', categoria_ces: 'investigacion', subcategoria: '2.2', prioridad: 'urgente', estado: 'pendiente', asignada_a_uid: 'uid_davalarezole', asignada_a_nombre: 'Darío Valarezo León', fecha_limite: iso(2026, 5, 1), evidencia_url: null },
    // Asignadas A Lorena (su vista de docente)
    { id: 'act_seed_7', titulo: 'Plan operativo de la carrera', descripcion: 'Documento POA de Ingeniería en Sistemas.', categoria_ces: 'gestion', subcategoria: '4.6', prioridad: 'normal', estado: 'pendiente', asignada_a_uid: 'uid_locondezh', asignada_a_nombre: 'Lorena Conde Zhingre', fecha_limite: iso(2026, 7, 30), evidencia_url: null },
    { id: 'act_seed_8', titulo: 'Artículo conjunto CEDIA', descripcion: 'Investigación colaborativa interuniversitaria.', categoria_ces: 'investigacion', subcategoria: '2.2', prioridad: 'urgente', estado: 'en_progreso', asignada_a_uid: 'uid_locondezh', asignada_a_nombre: 'Lorena Conde Zhingre', fecha_limite: iso(2026, 7, 22), evidencia_url: null },
  ].map(a => ({
    descripcion: '', observacion: null, fecha_inicio: iso(2026, 5, 4), fecha_completada: null,
    asignada_por_uid: DIR.uid, asignada_por_nombre: DIR.nombre,
    carrera_id: 'sistemas-informacion', periodo_id: '2026-A', creada_en: iso(2026, 5, 4),
    ...a,
  })),
}

// ── Helpers localStorage (lista completa del período) ─────────────────────────

function localCargar(periodo) {
  try {
    const ver = localStorage.getItem(LOCAL_KEY(periodo) + '_ver')
    const raw = localStorage.getItem(LOCAL_KEY(periodo))
    const tieneSeed = (SEED_ACTIVIDADES[periodo] ?? []).length > 0
    // Datos vigentes: hay datos y (la versión coincide o el período no tiene seed propio).
    if (raw && (ver === SEED_VERSION || !tieneSeed)) return JSON.parse(raw)
    if (tieneSeed) {
      const seed = SEED_ACTIVIDADES[periodo]
      localGuardar(periodo, seed)
      localStorage.setItem(LOCAL_KEY(periodo) + '_ver', SEED_VERSION)
      return seed
    }
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function localGuardar(periodo, lista) {
  localStorage.setItem(LOCAL_KEY(periodo), JSON.stringify(lista))
}

function aISO(v) {
  return v?.toDate?.()?.toISOString() ?? v ?? null
}

function normalizar(data, id) {
  return {
    ...data,
    id: id ?? data.id,
    fecha_inicio:     aISO(data.fecha_inicio),
    fecha_limite:     aISO(data.fecha_limite),
    fecha_completada: aISO(data.fecha_completada),
    creada_en:        aISO(data.creada_en),
  }
}

// ── Lógica de estado ──────────────────────────────────────────────────────────

/**
 * Estado efectivo para mostrar: una actividad no completada cuya fecha límite
 * ya pasó se considera "vencida" sin necesidad de un proceso programado.
 * @returns {string} uno de ESTADOS_ACTIVIDAD
 */
export function estadoEfectivo(actividad) {
  if (!actividad) return ESTADOS_ACTIVIDAD.PENDIENTE
  if (actividad.estado === ESTADOS_ACTIVIDAD.COMPLETADA) return ESTADOS_ACTIVIDAD.COMPLETADA
  if (actividad.estado === ESTADOS_ACTIVIDAD.VENCIDA) return ESTADOS_ACTIVIDAD.VENCIDA
  if (actividad.fecha_limite && new Date(actividad.fecha_limite) < new Date()) {
    return ESTADOS_ACTIVIDAD.VENCIDA
  }
  return actividad.estado ?? ESTADOS_ACTIVIDAD.PENDIENTE
}

// ── Lectura ─────────────────────────────────────────────────────────────────

async function getTodasPeriodo(periodoId) {
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, COL), where('periodo_id', '==', periodoId))
      )
      // Solo confiamos en Firestore cuando devuelve datos. Un resultado vacío
      // (sin servidor o caché offline) NO debe pisar el localStorage del modo mock.
      if (!snap.empty) {
        const lista = snap.docs.map(d => normalizar(d.data(), d.id))
        localGuardar(periodoId, lista)
        return lista
      }
    } catch (err) {
      console.warn('[actividadesService] Firestore no disponible:', err.code)
    }
  }
  return localCargar(periodoId)
}

/** Actividades asignadas a un docente en el período (vista del docente). */
export async function getActividadesDocente(docenteUid, periodoId) {
  const todas = await getTodasPeriodo(periodoId)
  return todas.filter(a => a.asignada_a_uid === docenteUid)
}

/**
 * Actividades del período para el panel del director (todas o por carrera).
 * @param {string} periodoId
 * @param {string|null} carreraId — si se indica, filtra por carrera
 */
export async function getActividadesDirector(periodoId, carreraId = null) {
  const todas = await getTodasPeriodo(periodoId)
  return carreraId ? todas.filter(a => a.carrera_id === carreraId) : todas
}

/**
 * Suscripción en tiempo real (onSnapshot en Firestore, una sola carga en mock).
 * @param {{ periodoId: string, docenteUid?: string, carreraId?: string }} filtros
 * @param {Function} callback — recibe la lista ya filtrada
 * @returns {Function} unsubscribe
 */
export function suscribirseActividades({ periodoId, docenteUid = null, carreraId = null }, callback) {
  const filtrar = (lista) => lista.filter(a =>
    (!docenteUid || a.asignada_a_uid === docenteUid) &&
    (!carreraId  || a.carrera_id === carreraId)
  )

  if (db) {
    // Garantía anti-cuelgue: si Firestore no responde (offline/conexión
    // atascada) en 4s, resolvemos con localStorage para que la vista no se
    // quede "cargando para siempre". El snapshot real, si llega, refresca.
    let primerResultado = false
    const safety = setTimeout(() => {
      if (!primerResultado) {
        primerResultado = true
        callback(filtrar(localCargar(periodoId)))
      }
    }, 4000)

    const unsub = onSnapshot(
      query(collection(db, COL), where('periodo_id', '==', periodoId)),
      snap => {
        primerResultado = true
        clearTimeout(safety)
        const lista = snap.docs.map(d => normalizar(d.data(), d.id))
        // No pisar localStorage con un resultado vacío de Firestore offline.
        if (!snap.empty) localGuardar(periodoId, lista)
        callback(filtrar(snap.empty ? localCargar(periodoId) : lista))
      },
      // El error tampoco debe dejar la vista cargando: caemos a localStorage.
      err => {
        primerResultado = true
        clearTimeout(safety)
        console.warn('[actividadesService] onSnapshot error:', err.code)
        callback(filtrar(localCargar(periodoId)))
      }
    )
    return () => { clearTimeout(safety); unsub() }
  }
  getTodasPeriodo(periodoId).then(lista => callback(filtrar(lista)))
  return () => {}
}

// ── Coherencia distributivo ↔ actividad (PROJECT_BRIEF §5.4 / RESTRUCTURE §3.3)

/**
 * Verifica que el docente tenga horas de la categoría en su distributivo.
 * No bloquea: devuelve una alerta para que el director confirme.
 * @returns {Promise<{ alerta: boolean, mensaje?: string }>}
 */
export async function verificarCoherenciaDistributivo(docenteUid, categoria, periodoId) {
  const distributivo = await getDistributivo(docenteUid, periodoId)
  if (!distributivo) {
    return { alerta: true, mensaje: 'El docente aún no tiene un distributivo en este período.' }
  }
  const campos = CATEGORIA_A_HORAS_DISTRIBUTIVO[categoria] ?? []
  const horas = campos.reduce((sum, campo) => sum + (Number(distributivo[campo]) || 0), 0)
  if (horas <= 0) {
    return {
      alerta: true,
      mensaje: `El docente no tiene horas de "${CATEGORIA_LABELS[categoria] ?? categoria}" en su distributivo.`,
    }
  }
  return { alerta: false }
}

// ── Escritura ─────────────────────────────────────────────────────────────────

/**
 * Crea (asigna) una actividad y genera la notificación in-app al docente.
 * @param {{ titulo, descripcion?, categoria_ces, asignada_por_uid, asignada_por_nombre?,
 *           asignada_a_uid, asignada_a_nombre?, carrera_id?, periodo_id,
 *           prioridad, fecha_inicio?, fecha_limite }} datos
 */
export async function crearActividad(datos) {
  const id = `act_${datos.asignada_a_uid}_${Date.now()}`
  const nueva = {
    id,
    titulo:             datos.titulo,
    descripcion:        datos.descripcion ?? '',
    categoria_ces:      datos.categoria_ces,
    // Subcategoría oficial (ej. "1.2", "3.3", "4.9"). Captura manual; opcional en
    // el modelo de datos por compatibilidad con actividades antiguas (D2-bis).
    subcategoria:       datos.subcategoria ?? null,
    asignada_por_uid:   datos.asignada_por_uid,
    asignada_por_nombre: datos.asignada_por_nombre ?? '',
    asignada_a_uid:     datos.asignada_a_uid,
    asignada_a_nombre:  datos.asignada_a_nombre ?? '',
    carrera_id:         datos.carrera_id ?? null,
    periodo_id:         datos.periodo_id,
    prioridad:          datos.prioridad,
    estado:             ESTADOS_ACTIVIDAD.PENDIENTE,
    fecha_inicio:       datos.fecha_inicio ?? new Date().toISOString(),
    fecha_limite:       datos.fecha_limite ?? null,
    fecha_completada:   null,
    evidencia_url:      null,
    observacion:        null,
    creada_en:          new Date().toISOString(),
  }

  if (db) {
    try {
      await setDoc(doc(db, COL, id), {
        ...nueva,
        fecha_inicio: nueva.fecha_inicio ? Timestamp.fromDate(new Date(nueva.fecha_inicio)) : null,
        fecha_limite: nueva.fecha_limite ? Timestamp.fromDate(new Date(nueva.fecha_limite)) : null,
        creada_en:    Timestamp.now(),
      })
    } catch (err) {
      console.warn('[actividadesService] Firestore error en crearActividad:', err.code)
      guardarLocal(nueva)
    }
  } else {
    guardarLocal(nueva)
  }

  // Notificación in-app al docente (PROJECT_BRIEF §5.6)
  await crearNotificacion({
    destinatario_uid: nueva.asignada_a_uid,
    tipo:             'nueva_actividad',
    titulo:           'Nueva actividad asignada',
    mensaje:          `${nueva.titulo}${nueva.fecha_limite ? ` · Vence: ${new Date(nueva.fecha_limite).toLocaleDateString('es-EC')}` : ''}`,
  })

  return nueva
}

function guardarLocal(act) {
  const lista = localCargar(act.periodo_id)
  const idx = lista.findIndex(a => a.id === act.id)
  if (idx === -1) lista.push(act)
  else lista[idx] = act
  localGuardar(act.periodo_id, lista)
}

/** Aplica cambios parciales a una actividad (Firestore o mock). */
async function aplicarCambios(actividad, cambios) {
  if (db) {
    try {
      const ref = doc(db, COL, actividad.id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const payload = { ...cambios }
        if ('fecha_limite' in cambios && cambios.fecha_limite) {
          payload.fecha_limite = Timestamp.fromDate(new Date(cambios.fecha_limite))
        }
        if ('fecha_completada' in cambios && cambios.fecha_completada) {
          payload.fecha_completada = Timestamp.fromDate(new Date(cambios.fecha_completada))
        }
        await updateDoc(ref, payload)
        return normalizar({ ...snap.data(), ...cambios }, actividad.id)
      }
    } catch (err) {
      console.warn('[actividadesService] Firestore error al actualizar:', err.code)
    }
  }
  const actualizada = { ...actividad, ...cambios }
  guardarLocal(actualizada)
  return actualizada
}

/**
 * El docente avanza el estado de su actividad (pendiente → en_progreso →
 * completada). Al completar registra la fecha.
 */
export async function actualizarEstadoActividad(actividad, nuevoEstado) {
  const cambios = { estado: nuevoEstado }
  if (nuevoEstado === ESTADOS_ACTIVIDAD.COMPLETADA) {
    cambios.fecha_completada = new Date().toISOString()
  }
  return aplicarCambios(actividad, cambios)
}

/** Registra la evidencia (archivo/URL) y marca la actividad como completada. */
export async function registrarEvidencia(actividad, evidenciaUrl, evidenciaNombre = null) {
  return aplicarCambios(actividad, {
    evidencia_url:    evidenciaUrl,
    evidencia_nombre: evidenciaNombre,
    estado:           ESTADOS_ACTIVIDAD.COMPLETADA,
    fecha_completada: new Date().toISOString(),
  })
}

/**
 * Edita la evidencia (archivo/URL) SIN cambiar el estado de la actividad
 * (PROJECT_BRIEF C.2): el docente puede agregar o corregir la evidencia
 * después, en actividades en progreso o ya completadas.
 */
export async function editarEvidencia(actividad, evidenciaUrl, evidenciaNombre = null) {
  return aplicarCambios(actividad, { evidencia_url: evidenciaUrl, evidencia_nombre: evidenciaNombre })
}

/**
 * El director amplía el plazo de una actividad con una observación obligatoria
 * (PROJECT_BRIEF §5.4). La actividad vuelve a estado pendiente y notifica.
 */
export async function ampliarPlazo(actividad, nuevaFechaLimite, observacion) {
  if (!observacion?.trim()) throw new Error('La observación es obligatoria para ampliar el plazo.')
  const actualizada = await aplicarCambios(actividad, {
    fecha_limite: nuevaFechaLimite,
    observacion:  observacion.trim(),
    estado:       ESTADOS_ACTIVIDAD.PENDIENTE,
  })
  await crearNotificacion({
    destinatario_uid: actividad.asignada_a_uid,
    tipo:             'plazo_ampliado',
    titulo:           'Plazo de actividad ampliado',
    mensaje:          `"${actividad.titulo}" — nuevo vencimiento: ${new Date(nuevaFechaLimite).toLocaleDateString('es-EC')}. ${observacion.trim()}`,
  })
  return actualizada
}

/** El director marca una actividad como vencida (PROJECT_BRIEF §15.4). */
export async function marcarVencida(actividad) {
  const actualizada = await aplicarCambios(actividad, { estado: ESTADOS_ACTIVIDAD.VENCIDA })
  await crearNotificacion({
    destinatario_uid: actividad.asignada_a_uid,
    tipo:             'actividad_vencida',
    titulo:           'Actividad marcada como vencida',
    mensaje:          `"${actividad.titulo}" superó su fecha límite.`,
  })
  return actualizada
}
