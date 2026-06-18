/**
 * authService.js — Autenticación del sistema (MOD-01).
 *
 * Conforme a PROJECT.md RF-001:
 *   Firebase Authentication + Microsoft Azure AD + OAuth 2.0.
 *   Login exclusivo con cuentas institucionales @uide.edu.ec.
 *
 * - Identidad y sesión: Firebase Auth (proveedor microsoft.com) → da
 *   request.auth.token.email para que las reglas verifiquen el dominio.
 * - Perfil/rol: se resuelve consultando /usuarios por email en Firestore.
 * - Calendario/correo (Graph API): MSAL solicita Calendars.Read y Mail.Read
 *   por separado cuando el docente conecta Outlook (ver calendarioService).
 */
import {
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from './firebase'
import { USUARIOS_SEED } from './seedData'
import { authLog } from './authDebug'

const SESSION_KEY = 'uide_session'

// Proveedor Microsoft — scopes mínimos de login (User.Read).
// Los scopes de Graph (Calendars.Read, Mail.Read) se piden aparte vía MSAL
// para no requerir consentimiento de administrador en el login.
const provider = new OAuthProvider('microsoft.com')
provider.addScope('User.Read')
provider.setCustomParameters({ tenant: 'common', prompt: 'select_account' })

// ── Normalización multi-rol ───────────────────────────────────────────────────
// Firestore guarda roles: ["director","coordinador"] (array — un usuario puede
// ejercer varios roles a la vez). El código legado usa rol (string). Esta
// normalización garantiza AMBOS campos en el perfil de sesión:
//   roles → array para checks roles.includes('x')
//   rol   → rol principal (mayor jerarquía) para menú, home y etiquetas UI.
const JERARQUIA_ROLES = ['superadmin', 'director', 'coordinador', 'docente']

export function normalizarRolesPerfil(perfil) {
  if (!perfil) return perfil
  const roles = Array.isArray(perfil.roles) && perfil.roles.length > 0
    ? perfil.roles
    : perfil.rol ? [perfil.rol] : []
  const rol = JERARQUIA_ROLES.find(r => roles.includes(r)) ?? roles[0] ?? null
  return { ...perfil, roles, rol }
}

// ── Resolución del perfil por email ───────────────────────────────────────────

async function resolverPerfil(email) {
  const emailNorm = email?.toLowerCase()
  authLog('resolverPerfil:email', emailNorm ?? '(null)')
  if (!emailNorm) throw new Error('No se pudo obtener el email de la cuenta Microsoft.')

  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'usuarios'), where('email', '==', emailNorm)))
      authLog('resolverPerfil:firestore', `encontrados=${snap.size}`)
      if (!snap.empty) return snap.docs[0].data()
    } catch (err) {
      authLog('resolverPerfil:firestore-error', err.code ?? err.message)
    }
  }

  const perfil = USUARIOS_SEED.find(u => u.email.toLowerCase() === emailNorm)
  if (!perfil) {
    authLog('resolverPerfil:NO-REGISTRADO', emailNorm)
    throw new Error(
      `La cuenta ${email} no está registrada en el sistema UIDE. ` +
      'Contacta al administrador TIC para que te asigne acceso.'
    )
  }
  authLog('resolverPerfil:OK-seed', `${perfil.rol}`)
  const datos = { ...perfil }; delete datos.password
  return datos
}

/** Resuelve el perfil a partir del usuario de Firebase (para onAuthStateChanged). */
export async function resolverPerfilDesdeFirebase(firebaseUser) {
  // El email puede venir en .email o en providerData (según el tipo de cuenta MS)
  const email =
    firebaseUser.email ??
    firebaseUser.providerData?.find(p => p.email)?.email ??
    null
  const perfil = normalizarRolesPerfil(await resolverPerfil(email))
  localStorage.setItem(SESSION_KEY, JSON.stringify(perfil))
  return perfil
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Login con cuenta Microsoft institucional (Firebase Auth, redirect).
 * Usa redirect en vez de popup: las extensiones del navegador (wallets, etc.)
 * interceptan la mensajería entre ventanas y cuelgan el popup. El redirect es
 * una navegación completa, sin ese handshake. La página navega fuera y el
 * resultado se recoge con procesarRedirect() al volver.
 */
export async function loginConMicrosoft() {
  if (!auth) throw new Error('Firebase no está configurado. Completa el .env.local.')
  authLog('login:signInWithRedirect', 'navegando a Microsoft…')
  await signInWithRedirect(auth, provider)
}

/**
 * Procesa el retorno del redirect de Microsoft. Llamar al arrancar la app.
 * onAuthStateChanged se encarga de cargar el perfil; aquí solo capturamos
 * errores del proveedor para mostrarlos.
 * @returns {Promise<void>}
 */
export async function procesarRedirect() {
  if (!auth) { authLog('procesarRedirect', 'auth=null'); return }
  authLog('procesarRedirect:start', `origin=${window.location.origin}`)
  try {
    const result = await getRedirectResult(auth)
    authLog('procesarRedirect:result', result ? `user=${result.user?.email}` : 'null (sin redirect pendiente)')
  } catch (err) {
    authLog('procesarRedirect:ERROR', `${err.code} | ${err.message}`)
    throw err
  }
}

/**
 * Login de desarrollo — solo para el panel DEV del login.
 * No crea sesión de Firebase; opera sobre el seed local.
 */
export async function loginMock(email, password) {
  await new Promise(r => setTimeout(r, 200))
  const user = USUARIOS_SEED.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Credenciales incorrectas.')
  const session = { ...user }; delete session.password
  const normalizada = normalizarRolesPerfil(session)
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalizada))
  return normalizada
}

/**
 * Cierra la sesión de Firebase y limpia la sesión local (RF-003).
 */
export async function logout() {
  localStorage.removeItem(SESSION_KEY)
  try { if (auth) await signOut(auth) } catch { /* ignorar */ }
}

/**
 * Devuelve el usuario de la sesión activa o null.
 */
export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? normalizarRolesPerfil(JSON.parse(raw)) : null
}
