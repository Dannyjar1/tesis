/**
 * seed-firestore.mjs — Inicializa Firestore con datos semilla.
 * Usa el cliente SDK con la API key del proyecto (no requiere Admin SDK).
 * Ejecutar con reglas temporalmente abiertas.
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'

const app = initializeApp({
  apiKey:     'AIzaSyBxtTxxdT4ggq24z-073T0vrH84jXf0TkA',
  projectId:  'uide-distributivo-loja',
  authDomain: 'uide-distributivo-loja.firebaseapp.com',
})
const db = getFirestore(app)

const CARRERAS = [
  { id: 'administracion-empresas',  nombre: 'Administración de Empresas',              escuela: null,                                       activo: true },
  { id: 'arquitectura',             nombre: 'Arquitectura',                              escuela: null,                                       activo: true },
  { id: 'derecho',                  nombre: 'Derecho',                                  escuela: null,                                       activo: true },
  { id: 'sistemas-informacion',     nombre: 'Ingeniería en Sistemas de la Información', escuela: 'Escuela de Tecnologías de la Información', director_uid: 'uid_locondezh', coordinador_uid: 'uid_davalarezole', activo: true },
  { id: 'psicologia-clinica',       nombre: 'Psicología Clínica',                       escuela: null,                                       activo: true },
  { id: 'marketing',                nombre: 'Marketing',                                escuela: null,                                       activo: true },
  { id: 'negocios-internacionales', nombre: 'Negocios Internacionales',                escuela: null,                                       activo: true },
]

const USUARIOS = [
  { uid: 'uid_hcueva',        nombre: 'Henri Apolo',       apellido: 'Cueva Jaramillo',  nombre_completo: 'Henri Apolo Cueva Jaramillo',         email: 'hcueva@uide.edu.ec',        rol: 'superadmin', roles: ['superadmin'],    tipo_contrato: null,              carrera_id: null,                   cargo: 'Asistente de Soporte Usuario — TIC Ext. Loja', activo: true },
  { uid: 'uid_paruizag',      nombre: 'Pablo',             apellido: 'Ruiz Aguirre',     nombre_completo: 'Pablo Ruiz Aguirre',                  email: 'paruizag@uide.edu.ec',      rol: 'admin', roles: ['admin'],         tipo_contrato: null,              carrera_id: null,                   activo: true },
  { uid: 'uid_locondezh',     nombre: 'Lorena Elizabeth',  apellido: 'Conde Zhingre',    nombre_completo: 'Lorena Elizabeth Conde Zhingre',      email: 'locondezh@uide.edu.ec',     rol: 'director', roles: ['director'],      tipo_contrato: 'tiempo_completo', carrera_id: 'sistemas-informacion', activo: true },
  { uid: 'uid_davalarezole',  nombre: 'Darío Javier',      apellido: 'Valarezo León',    nombre_completo: 'Darío Javier Valarezo León',          email: 'davalarezole@uide.edu.ec',  rol: 'coordinador', roles: ['coordinador'],   tipo_contrato: 'tiempo_completo', carrera_id: 'sistemas-informacion', activo: true },
  { uid: 'uid_mipalaciosmo',  nombre: 'Milton Ricardo',    apellido: 'Palacios Morocho', nombre_completo: 'Milton Ricardo Palacios Morocho',     email: 'mipalaciosmo@uide.edu.ec',  rol: 'docente', roles: ['docente'],       tipo_contrato: 'tiempo_completo', carrera_id: 'sistemas-informacion', activo: true },
  { uid: 'uid_yetorresbe',    nombre: 'Yeferson Mauricio', apellido: 'Torres Berru',     nombre_completo: 'Yeferson Mauricio Torres Berru',      email: 'yetorresbe@uide.edu.ec',    rol: 'docente', roles: ['docente'],       tipo_contrato: 'medio_tiempo',    carrera_id: 'sistemas-informacion', activo: true },
  { uid: 'uid_dajaramillogu', nombre: 'Danny',             apellido: 'Jaramillo',        nombre_completo: 'Danny Jaramillo',                     email: 'dajaramillogu@uide.edu.ec', rol: 'administrativo', roles: ['administrativo'], tipo_contrato: null,             carrera_id: null,                   cargo: 'representante_estudiantil', activo: true },
]

const DISTRIBUTIVOS = [
  {
    id: 'uid_mipalaciosmo_2026-A', docente_uid: 'uid_mipalaciosmo', periodo_id: '2026-A',
    tipo_contrato: 'tiempo_completo', estado: 'borrador',
    horas_docencia_directa: 18, horas_preparacion: 10.8, horas_tutoria: 2,
    horas_investigacion: 4, horas_vinculacion: 3, horas_titulacion: 1,
    horas_gestion: 1.2, horas_reduccion_cargo: 0, total_horas: 40,
    materias_asignadas: 4, estudiantes_pc: 20, estudiantes_ppp: 15,
    proyectos_director: 1, proyectos_tribunal: 0, aprobado_por: null, fecha_aprobacion: null,
  },
  {
    id: 'uid_yetorresbe_2026-A', docente_uid: 'uid_yetorresbe', periodo_id: '2026-A',
    tipo_contrato: 'medio_tiempo', estado: 'borrador',
    horas_docencia_directa: 10, horas_preparacion: 6, horas_tutoria: 1,
    horas_investigacion: 2, horas_vinculacion: 1, horas_titulacion: 0,
    horas_gestion: 0, horas_reduccion_cargo: 0, total_horas: 20,
    materias_asignadas: 2, estudiantes_pc: 12, estudiantes_ppp: 0,
    proyectos_director: 0, proyectos_tribunal: 1, aprobado_por: null, fecha_aprobacion: null,
  },
]

async function escribirSiNoExiste(coleccion, id, datos) {
  const ref = doc(db, coleccion, id)
  const snap = await getDoc(ref)
  if (snap.exists()) return false
  await setDoc(ref, { ...datos, creado_en: Timestamp.now() })
  return true
}

async function main() {
  console.log('🔥 Inicializando Firestore...\n')

  let c = 0
  for (const carrera of CARRERAS) {
    if (await escribirSiNoExiste('carreras', carrera.id, carrera)) c++
  }
  console.log(`✅ Carreras:       ${c} creadas`)

  let u = 0
  for (const usuario of USUARIOS) {
    if (await escribirSiNoExiste('usuarios', usuario.uid, usuario)) u++
  }
  console.log(`✅ Usuarios:       ${u} creados`)

  const periodoRef = doc(db, 'periodos_academicos', '2026-A')
  const periodoSnap = await getDoc(periodoRef)
  if (!periodoSnap.exists()) {
    await setDoc(periodoRef, {
      id: '2026-A', nombre: 'Mayo–Agosto 2026',
      fecha_inicio: Timestamp.fromDate(new Date('2026-05-04')),
      fecha_fin:    Timestamp.fromDate(new Date('2026-08-21')),
      estado: 'activo', docentes_uid: ['uid_mipalaciosmo', 'uid_yetorresbe'],
      creado_por: 'uid_paruizag', creado_automaticamente: false,
      fecha_creacion: Timestamp.now(),
    })
    console.log('✅ Período activo: creado (2026-A)')
  } else {
    console.log('ℹ️  Período activo: ya existía')
  }

  let d = 0
  for (const dist of DISTRIBUTIVOS) {
    if (await escribirSiNoExiste('distributivos', dist.id, {
      ...dist, fecha_ultima_modificacion: Timestamp.now()
    })) d++
  }
  console.log(`✅ Distributivos:  ${d} creados`)

  console.log('\n🎉 Listo. Ya puedes entrar a la app.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
