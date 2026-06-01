/**
 * Servicio mock de gestión del personal de una carrera.
 * Almacena en localStorage, inicializado con los datos seed.
 * Al migrar a Firebase: reemplazar las funciones con llamadas a Firestore /usuarios
 * filtrando por carreraId, sin cambiar la interfaz pública.
 */
import { USUARIOS_SEED } from './seedData'

function storageKey(carreraId) {
  return `personal_${carreraId}`
}

function cargarPersonal(carreraId) {
  const raw = localStorage.getItem(storageKey(carreraId))
  if (raw) return JSON.parse(raw)
  // Primera vez: inicializar desde seed, excluir admin global y al propio director
  const seed = USUARIOS_SEED
    .filter(u => u.carrera_id === carreraId)
    .map(({ password: _, ...u }) => u)
  localStorage.setItem(storageKey(carreraId), JSON.stringify(seed))
  return seed
}

function guardarPersonal(carreraId, lista) {
  localStorage.setItem(storageKey(carreraId), JSON.stringify(lista))
}

/**
 * Devuelve todos los usuarios de la carrera (docentes + coordinador).
 * @param {string} carreraId
 * @returns {Promise<Object[]>}
 */
export async function getPersonal(carreraId) {
  await new Promise(r => setTimeout(r, 300))
  return cargarPersonal(carreraId)
}

/**
 * Crea un nuevo usuario en la carrera.
 * @param {string} carreraId
 * @param {Object} datos — { nombre, apellido, email, rol, tipo_contrato }
 * @returns {Promise<Object>} usuario creado
 */
export async function crearPersonal(carreraId, datos) {
  await new Promise(r => setTimeout(r, 400))
  const lista = cargarPersonal(carreraId)
  const nuevo = {
    uid:             `uid_${Date.now()}`,
    nombre:          datos.nombre.trim(),
    apellido:        datos.apellido.trim(),
    nombre_completo: `${datos.nombre.trim()} ${datos.apellido.trim()}`,
    email:           datos.email.trim().toLowerCase(),
    rol:             datos.rol,
    tipo_contrato:   datos.tipo_contrato || null,
    carrera_id:      carreraId,
    activo:          true,
  }
  lista.push(nuevo)
  guardarPersonal(carreraId, lista)
  return nuevo
}

/**
 * Actualiza los datos de un usuario existente.
 * @param {string} carreraId
 * @param {string} uid
 * @param {Object} datos
 * @returns {Promise<Object>} usuario actualizado
 */
export async function actualizarPersonal(carreraId, uid, datos) {
  await new Promise(r => setTimeout(r, 300))
  const lista = cargarPersonal(carreraId)
  const idx = lista.findIndex(u => u.uid === uid)
  if (idx === -1) throw new Error('Usuario no encontrado')
  const actualizado = {
    ...lista[idx],
    nombre:          datos.nombre.trim(),
    apellido:        datos.apellido.trim(),
    nombre_completo: `${datos.nombre.trim()} ${datos.apellido.trim()}`,
    email:           datos.email.trim().toLowerCase(),
    rol:             datos.rol,
    tipo_contrato:   datos.tipo_contrato || null,
  }
  lista[idx] = actualizado
  guardarPersonal(carreraId, lista)
  return actualizado
}

/**
 * Alterna el estado activo/inactivo de un usuario.
 * @param {string} carreraId
 * @param {string} uid
 * @returns {Promise<Object>} usuario actualizado
 */
export async function toggleActivo(carreraId, uid) {
  await new Promise(r => setTimeout(r, 200))
  const lista = cargarPersonal(carreraId)
  const idx = lista.findIndex(u => u.uid === uid)
  if (idx === -1) throw new Error('Usuario no encontrado')
  lista[idx] = { ...lista[idx], activo: !lista[idx].activo }
  guardarPersonal(carreraId, lista)
  return lista[idx]
}
