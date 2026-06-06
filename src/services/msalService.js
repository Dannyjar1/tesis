/**
 * msalService.js — Autenticación Microsoft con MSAL.js.
 * - loginSistema(): login del sistema con User.Read (MOD-01)
 * - loginOutlook(): autorización individual del docente para Outlook (RF-013)
 * - getAccessToken(): token para Microsoft Graph API
 */
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'

const CLIENT_ID    = import.meta.env.VITE_MSAL_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin

// Scopes mínimos para login del sistema (MOD-01)
export const LOGIN_SCOPES = ['User.Read', 'offline_access']

// Scopes completos para sincronización Outlook/Graph API (MOD-03, RF-013, RF-023)
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

/** Limpia el flag interaction_in_progress de sessionStorage que queda colgado
 *  cuando un popup falla o se cancela sin resolver correctamente. */
function clearInteractionState() {
  Object.keys(sessionStorage)
    .filter(k => k.includes('interaction.status') || k.includes('request.params'))
    .forEach(k => sessionStorage.removeItem(k))
}

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
    initPromise = (async () => {
      await msalInstance.initialize()
      // handleRedirectPromise() es obligatorio antes de cualquier interacción
      // en MSAL v3+. También limpia el flag interaction_in_progress.
      await msalInstance.handleRedirectPromise().catch(() => {})
    })()
  }
  await initPromise
  return msalInstance
}

/**
 * Login del sistema con Microsoft. Solicita solo User.Read (MOD-01).
 * Si hay un interaction_in_progress colgado, limpia el estado y reintenta.
 * @returns {Promise<import('@azure/msal-browser').AccountInfo>}
 */
export async function loginSistema() {
  const msal = await getMsal()
  try {
    const result = await msal.loginPopup({ scopes: LOGIN_SCOPES })
    return result.account
  } catch (err) {
    if (err?.errorCode === 'interaction_in_progress') {
      // Limpiar el flag colgado y reintentar con la misma instancia MSAL
      clearInteractionState()
      const result = await msal.loginPopup({ scopes: LOGIN_SCOPES })
      return result.account
    }
    throw err
  }
}

/**
 * Abre el popup de Outlook para el docente (RF-013 — autorización individual).
 * Agrega scopes de Calendar y Mail sobre la cuenta ya existente si la hay.
 * @returns {Promise<import('@azure/msal-browser').AccountInfo>}
 */
export async function loginOutlook() {
  const msal = await getMsal()
  const accounts = msal.getAllAccounts()
  const result = await msal.loginPopup({
    scopes: OUTLOOK_SCOPES,
    account: accounts.length > 0 ? accounts[0] : undefined,
    prompt: accounts.length > 0 ? undefined : 'select_account',
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
 * Inicializa MSAL sin abrir ningún popup.
 * Debe llamarse al arrancar la app para que el popup pueda hacer el
 * handshake con el parent cuando Azure AD redirige de vuelta a /login.
 */
export async function initMsal() {
  if (!CLIENT_ID) return
  try {
    await getMsal()
  } catch (e) {
    console.warn('[msalService] initMsal:', e.message)
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
