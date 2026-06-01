/**
 * Servicio de autenticación — mock para desarrollo.
 * Al integrar Firebase + Azure AD, reemplazar login/logout/getCurrentUser
 * con las llamadas reales sin cambiar la interfaz pública.
 */
import { USUARIOS_SEED } from './seedData'

const SESSION_KEY = 'uide_session'

/**
 * Autentica con email y contraseña contra los datos seed.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} usuario autenticado (sin campo password)
 */
export async function login(email, password) {
  await new Promise(r => setTimeout(r, 500))

  const user = USUARIOS_SEED.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.')

  const { password: _, ...session } = user
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function logout() {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Devuelve el usuario de la sesión activa o null.
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}
