/**
 * Servicio del distributivo académico — implementación mock (localStorage).
 * Sprint 1 (Firebase): reemplazar cada función con llamadas a Firestore SDK v10.
 * La interfaz de funciones no cambia al migrar a Firebase.
 */
import { validarCierreDistributivo } from '../utils/calculos'
import { ESTADOS_DISTRIBUTIVO } from '../utils/constants'

const KEY = 'uide_distributivos'

// Docentes mock — en Firebase vendrán de la colección /docentes
export const MOCK_DOCENTES = [
  {
    uid: 'mock-docente-tc-001',
    nombre_completo: 'MSc. Luis Peña Cabrera',
    tipo_contrato: 'TC',
    horas_contrato: 40,
    categoria_escalafon: 'Agregado',
    carrera: 'Ingeniería en TI',
  },
  {
    uid: 'mock-docente-mt-001',
    nombre_completo: 'Lic. Ana Mora Ríos',
    tipo_contrato: 'MT',
    horas_contrato: 20,
    categoria_escalafon: 'Auxiliar',
    carrera: 'Ingeniería en TI',
  },
]

const SEED = [
  {
    id: 'mock-docente-tc-001_2026-A',
    docente_uid: 'mock-docente-tc-001',
    periodo_id: '2026-A',
    tipo_contrato: 'TC',
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

function leer() {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(SEED))
    return SEED
  }
  return JSON.parse(raw)
}

function guardar(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista))
}

/**
 * Obtiene el distributivo de un docente para un período.
 * @param {string} docenteUid
 * @param {string} periodoId
 * @returns {Promise<Object|null>}
 */
export async function getDistributivo(docenteUid, periodoId) {
  const lista = leer()
  return lista.find(d => d.docente_uid === docenteUid && d.periodo_id === periodoId) ?? null
}

/**
 * Devuelve todos los distributivos del período (para el director).
 * @param {string} periodoId
 * @returns {Promise<Object[]>}
 */
export async function getDistributivosPorPeriodo(periodoId) {
  return leer().filter(d => d.periodo_id === periodoId)
}

/**
 * Crea un distributivo nuevo en estado borrador.
 * Bloquea si ya existe uno activo/aprobado para el mismo docente+período (RN-001).
 * @param {Object} datos
 * @returns {Promise<Object>} distributivo creado
 */
export async function crearDistributivo(datos) {
  const lista = leer()
  const id = `${datos.docente_uid}_${datos.periodo_id}`

  const existente = lista.find(d => d.id === id)
  if (existente && [ESTADOS_DISTRIBUTIVO.APROBADO, ESTADOS_DISTRIBUTIVO.VIGENTE].includes(existente.estado)) {
    throw new Error('Ya existe un distributivo aprobado/vigente para este docente en el período activo (RN-001).')
  }

  const nuevo = {
    id,
    ...datos,
    estado: ESTADOS_DISTRIBUTIVO.BORRADOR,
    aprobado_por: null,
    fecha_aprobacion: null,
    fecha_ultima_modificacion: new Date().toISOString(),
  }

  const sinExistente = lista.filter(d => d.id !== id)
  guardar([...sinExistente, nuevo])
  return nuevo
}

/**
 * Actualiza un distributivo existente (solo en estado borrador o en_revision).
 * @param {string} distributivoId
 * @param {Object} cambios
 * @returns {Promise<Object>} distributivo actualizado
 */
export async function actualizarDistributivo(distributivoId, cambios) {
  const lista = leer()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')

  const actual = lista[idx]
  if (actual.estado === ESTADOS_DISTRIBUTIVO.APROBADO || actual.estado === ESTADOS_DISTRIBUTIVO.VIGENTE) {
    throw new Error('No se puede editar un distributivo aprobado o vigente.')
  }

  const actualizado = {
    ...actual,
    ...cambios,
    id: distributivoId,
    fecha_ultima_modificacion: new Date().toISOString(),
  }
  lista[idx] = actualizado
  guardar(lista)
  return actualizado
}

/**
 * Aprueba un distributivo validado. Verifica la suma de horas antes de aprobar (RN-014).
 * @param {string} distributivoId
 * @param {string} aprobadoPorUid - UID del director
 * @param {number} horasContrato - 40 (TC) | 20 (MT)
 * @returns {Promise<Object>} distributivo aprobado
 */
export async function aprobarDistributivo(distributivoId, aprobadoPorUid, horasContrato) {
  const lista = leer()
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
  guardar(lista)
  return aprobado
}

/**
 * Cambia el estado del distributivo según el flujo permitido (RN-002).
 * @param {string} distributivoId
 * @param {string} nuevoEstado
 */
export async function cambiarEstadoDistributivo(distributivoId, nuevoEstado) {
  const lista = leer()
  const idx = lista.findIndex(d => d.id === distributivoId)
  if (idx === -1) throw new Error('Distributivo no encontrado.')

  lista[idx] = {
    ...lista[idx],
    estado: nuevoEstado,
    fecha_ultima_modificacion: new Date().toISOString(),
  }
  guardar(lista)
  return lista[idx]
}

/**
 * Suscripción simulada (mock). En Firebase: usa onSnapshot.
 * @param {string} docenteUid
 * @param {string} periodoId
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function suscribirseDistributivo(docenteUid, periodoId, callback) {
  getDistributivo(docenteUid, periodoId).then(callback)
  return () => {}
}

/**
 * Devuelve la lista de docentes mock. En Firebase: colección /docentes.
 */
export function getDocentesMock() {
  return MOCK_DOCENTES
}

/**
 * Reinicia los datos mock (solo para tests).
 */
export function resetMock() {
  localStorage.removeItem(KEY)
}
