/**
 * personalService.js — Gestión del personal de una carrera (vista "Mi Personal"
 * del director). Usa la MISMA fuente única que el resto del sistema:
 * sistemaService (seed + overlay localStorage `uide_sistema_usuarios`), que es
 * también lo que authService fusiona al iniciar sesión. Así, un cambio de rol
 * hecho aquí se refleja en TODAS las vistas y en la sesión del usuario.
 */
import { getTodosUsuarios, guardarUsuario, toggleActivoUsuario } from './sistemaService'

/** Regla institucional: todo cargo lo ejerce un docente. Deriva roles[] desde
 *  el cargo elegido (docente → ['docente']; cargo → ['docente', cargo]). */
function rolesDesdeCargo(rol) {
  return rol === 'docente' ? ['docente'] : ['docente', rol]
}

/** Devuelve los usuarios de una carrera (docentes + cargos), con sus cambios. */
export async function getPersonal(carreraId) {
  const todos = await getTodosUsuarios()
  return todos.filter(u => u.carrera_id === carreraId)
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
    titulo_academico: (datos.titulo_academico ?? '').trim(),
    rol:             datos.rol,
    roles:           rolesDesdeCargo(datos.rol),
    tipo_contrato:   datos.tipo_contrato || null,
    carrera_id:      carreraId,
    activo:          true,
  }
  await guardarUsuario(uid, nuevo)
  return nuevo
}

/** Actualiza los datos/rol de un usuario existente (se refleja en su sesión). */
export async function actualizarPersonal(carreraId, uid, datos) {
  const cambios = {
    nombre:          datos.nombre.trim(),
    apellido:        datos.apellido.trim(),
    nombre_completo: `${datos.nombre.trim()} ${datos.apellido.trim()}`,
    email:           datos.email.trim().toLowerCase(),
    titulo_academico: (datos.titulo_academico ?? '').trim(),
    rol:             datos.rol,
    roles:           rolesDesdeCargo(datos.rol),
    tipo_contrato:   datos.tipo_contrato || null,
    carrera_id:      carreraId,
  }
  await guardarUsuario(uid, cambios)
  return { uid, ...cambios }
}

/** Alterna el estado activo/inactivo de un usuario. */
export async function toggleActivo(carreraId, uid) {
  const todos = await getTodosUsuarios()
  const u = todos.find(x => x.uid === uid)
  const nuevoEstado = !(u?.activo)
  await toggleActivoUsuario(uid, nuevoEstado)
  return { uid, activo: nuevoEstado }
}
