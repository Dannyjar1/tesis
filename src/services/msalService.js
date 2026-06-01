/**
 * msalService.js — Autenticación Microsoft con MSAL.js para Outlook / Graph API.
 * Maneja el ciclo de vida del token de forma independiente del login mock del sistema.
 * RF-013: autorización individual del docente para acceder a su calendario.
 */
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'

const CLIENT_ID   = import.meta.env.VITE_MSAL_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin

// Scopes requeridos por Graph API (PROJECT.md §13 y RF-023)
export const OUTLOOK_SCOPES = [
  'User.Read',
  'Calendars.Read',
  'Mail.Read',
  'offline_access',
]

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    // 'common' acepta cuentas organizacionales (UIDE @uide.edu.ec) y personales
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

let msalInstance = null
let initPromise   = null

async function getMsal() {
  if (!msalInstance) {
    if (!CLIENT_ID) {
      throw new Error(
        'VITE_MSAL_CLIENT_ID no está configurado. ' +
        'Agrega el Client ID de Azure en .env.local y reinicia el servidor de desarrollo.'
      )
    }
    msalInstance = new PublicClientApplication(msalConfig)
  }
  if (!initPromise) {
    initPromise = msalInstance.initialize()
  }
  await initPromise
  return msalInstance
}

/**
 * Abre el popup de login de Microsoft y retorna la cuenta autenticada.
 * @returns {Promise<import('@azure/msal-browser').AccountInfo>}
 */
export async function loginOutlook() {
  const msal = await getMsal()
  const result = await msal.loginPopup({
    scopes: OUTLOOK_SCOPES,
    prompt: 'select_account',
  })
  return result.account
}

/**
 * Cierra la sesión de Microsoft (solo del contexto Outlook, no del sistema).
 */
export async function logoutOutlook() {
  const msal = await getMsal()
  const accounts = msal.getAllAccounts()
  if (accounts.length > 0) {
    await msal.logoutPopup({ account: accounts[0] })
  }
}

/**
 * Devuelve la cuenta de Microsoft activa, o null si no hay sesión.
 * @returns {Promise<import('@azure/msal-browser').AccountInfo|null>}
 */
export async function getOutlookAccount() {
  const msal = await getMsal()
  const accounts = msal.getAllAccounts()
  return accounts.length > 0 ? accounts[0] : null
}

/**
 * Devuelve un access token válido para Microsoft Graph API.
 * Intenta silent primero; si falla muestra popup.
 * @returns {Promise<string|null>} access token o null si no hay sesión
 */
export async function getAccessToken() {
  const msal = await getMsal()
  const accounts = msal.getAllAccounts()
  if (accounts.length === 0) return null

  try {
    const result = await msal.acquireTokenSilent({
      scopes: OUTLOOK_SCOPES,
      account: accounts[0],
    })
    return result.accessToken
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await msal.acquireTokenPopup({
        scopes: OUTLOOK_SCOPES,
        account: accounts[0],
      })
      return result.accessToken
    }
    console.error('[msalService] Error al obtener token:', err)
    throw err
  }
}

/**
 * Indica si hay una sesión de Outlook activa.
 * @returns {Promise<boolean>}
 */
export async function isOutlookConectado() {
  try {
    const account = await getOutlookAccount()
    return account !== null
  } catch {
    return false
  }
}
