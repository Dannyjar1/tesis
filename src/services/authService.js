/**
 * authService.js — Autenticación con Firebase Auth + Microsoft Azure AD.
 *
 * Usa signInWithRedirect (en lugar de popup) porque Chrome convierte
 * los popups a pestañas, lo que rompe el handshake de Firebase.
 *
 * Flujo:
 *  1. loginConMicrosoft() → redirige la página a Microsoft login
 *  2. Microsoft autentica → redirige al handler de Firebase
 *  3. Firebase redirige de vuelta a la app
 *  4. getResultadoRedireccion() recoge el resultado en AuthContext
 */
import {
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { USUARIOS_SEED } from './seedData'

const SESSION_KEY = 'uide_session'

const provider = new OAuthProvider('microsoft.com')
provider.addScope('User.Read')
provider.setCustomParameters({
  tenant: 'common',
  prompt: 'select_account',
})
// Nota: Calendars.Read y Mail.Read se solicitan por separado via MSAL
// cuando el docente conecta su calendario (RF-013, msalService.js)

async function resolverPerfil(firebaseUser) {
  const email = firebaseUser.email?.toLowerCase()

  if (db) {
    try {
      // 1. Buscar por UID exacto (usuario ya registrado)
      const snapUid = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      if (snapUid.exists()) return snapUid.data()

      // 2. Buscar por email (primer login — el superadmin pre-creó el usuario)
      const q = query(collection(db, 'usuarios'), where('email', '==', email))
      const snapEmail = await getDocs(q)
      if (!snapEmail.empty) {
        const datos = snapEmail.docs[0].data()
        // Migrar documento al UID real de Firebase Auth
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
          ...datos,
          uid: firebaseUser.uid,
          ultima_sesion: Timestamp.now(),
        })
        return { ...datos, uid: firebaseUser.uid }
      }
    } catch { /* Firestore sin reglas o sin conexión */ }
  }

  // Fallback: buscar en seed local (desarrollo sin Firebase)
  const perfil = USUARIOS_SEED.find(u => u.email.toLowerCase() === email)
  if (!perfil) {
    throw new Error(
      `La cuenta ${email} no está registrada en el sistema. ` +
      'Contacta al administrador de TIC para que te asigne acceso.'
    )
  }
  const { password: _, ...datos } = perfil
  return { ...datos, uid: firebaseUser.uid }
}

/**
 * Inicia el flujo de login con Microsoft.
 * Redirige la página actual — no devuelve nada.
 */
export async function loginConMicrosoft() {
  if (!auth) throw new Error('Firebase no está configurado. Completa el .env.local.')
  await signInWithRedirect(auth, provider)
}

/**
 * Recoge el resultado del redirect de Microsoft al volver a la app.
 * Llamar en el useEffect del AuthProvider al arrancar.
 * @returns {Promise<Object|null>} perfil del usuario o null si no hay redirect pendiente
 */
export async function getResultadoRedireccion() {
  if (!auth) return null
  try {
    const resultado = await getRedirectResult(auth)
    if (!resultado) return null
    const perfil = await resolverPerfil(resultado.user)
    localStorage.setItem(SESSION_KEY, JSON.stringify(perfil))
    return perfil
  } catch (err) {
    const ignorar = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']
    if (ignorar.includes(err?.code)) return null
    throw err
  }
}

/**
 * Login de desarrollo — solo para el panel DEV.
 */
export async function loginMock(email, password) {
  await new Promise(r => setTimeout(r, 300))
  const user = USUARIOS_SEED.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Credenciales incorrectas.')
  const { password: _, ...session } = user
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Cierra sesión de Firebase y limpia la sesión local.
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
  return raw ? JSON.parse(raw) : null
}
