/**
 * firestoreInitService.js — Carga inicial de datos semilla a Firestore.
 * Llamar desde AdminPage (rol admin) una sola vez al desplegar.
 * Verifica existencia antes de escribir para ser idempotente.
 */
import {
  collection, doc, getDoc, setDoc, getDocs, limit, query, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { CARRERAS_SEED, USUARIOS_SEED } from './seedData'
import { ESTADOS_DISTRIBUTIVO } from '../utils/constants'

/**
 * Carga carreras y usuarios semilla en Firestore.
 * Solo escribe documentos que no existan aún (idempotente).
 * @returns {{ carreras: number, usuarios: number }} — cuántos documentos se crearon
 */
export async function inicializarFirestore() {
  if (!db) throw new Error('Firestore no está configurado. Verifica .env.local.')

  let carrerasCreadas = 0
  let usuariosCreados = 0

  for (const carrera of CARRERAS_SEED) {
    const ref = doc(db, 'carreras', carrera.id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { ...carrera, fecha_creacion: Timestamp.now() })
      carrerasCreadas++
    }
  }

  for (const usuario of USUARIOS_SEED) {
    const { password: _, ...datos } = usuario
    const ref = doc(db, 'usuarios', datos.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { ...datos, creado_en: Timestamp.now() })
      usuariosCreados++
    }
  }

  return { carreras: carrerasCreadas, usuarios: usuariosCreados }
}

/**
 * Crea el período activo inicial si no existe ningún período activo.
 * Período: "Mayo–Agosto 2026", estado "activo".
 */
export async function inicializarPeriodoActivo() {
  if (!db) throw new Error('Firestore no configurado.')

  const ref = doc(db, 'periodos_academicos', '2026-A')
  const snap = await getDoc(ref)
  if (snap.exists()) return { creado: false }

  await setDoc(ref, {
    id:                    '2026-A',
    nombre:                'Mayo–Agosto 2026',
    fecha_inicio:          Timestamp.fromDate(new Date('2026-05-04')),
    fecha_fin:             Timestamp.fromDate(new Date('2026-08-21')),
    estado:                'activo',
    docentes_uid:          ['uid_mipalaciosmo', 'uid_yetorresbe'],
    fecha_creacion:        Timestamp.now(),
    creado_por:            'uid_paruizag',
    creado_automaticamente: false,
  })

  return { creado: true }
}

/**
 * Crea distributivos semilla para los docentes del período activo.
 * Solo escribe documentos que no existan (idempotente).
 */
export async function inicializarDistributivos() {
  if (!db) throw new Error('Firestore no configurado.')

  const SEED = [
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
      fecha_ultima_modificacion: Timestamp.now(),
    },
    {
      id: 'uid_yetorresbe_2026-A',
      docente_uid: 'uid_yetorresbe',
      periodo_id: '2026-A',
      tipo_contrato: 'medio_tiempo',
      estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
      horas_docencia_directa: 10,
      horas_preparacion: 6,
      horas_tutoria: 1,
      horas_investigacion: 2,
      horas_vinculacion: 1,
      horas_titulacion: 0,
      horas_gestion: 0,
      horas_reduccion_cargo: 0,
      total_horas: 20,
      materias_asignadas: 2,
      estudiantes_pc: 12,
      estudiantes_ppp: 0,
      proyectos_director: 0,
      proyectos_tribunal: 1,
      aprobado_por: null,
      fecha_aprobacion: null,
      fecha_ultima_modificacion: Timestamp.now(),
    },
  ]

  let creados = 0
  for (const dist of SEED) {
    const ref = doc(db, 'distributivos', dist.id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, dist)
      creados++
    }
  }
  return { distributivos: creados }
}

/**
 * Verifica si Firestore ya tiene datos semilla.
 * @returns {boolean}
 */
export async function firestoreYaInicializado() {
  if (!db) return false
  try {
    const snap = await getDocs(query(collection(db, 'carreras'), limit(1)))
    return !snap.empty
  } catch {
    return false
  }
}
