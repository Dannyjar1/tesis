/**
 * msalService.js — Autenticación Microsoft con MSAL.js.
 * - loginSistema(): login del sistema con User.Read (MOD-01)
 * - loginOutlook(): autorización individual del docente para Outlook (RF-013)
 * - getAccessToken(): token para Microsoft Graph API
 */
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { authLog } from './authDebug'

const CLIENT_ID    = import.meta.env.VITE_MSAL_CLIENT_ID
// Tenant institucional UIDE (single-tenant). Cuando TI entregue el Directory ID
// se define VITE_MSAL_TENANT_ID en .env.local y el login queda restringido a
// cuentas @uide.edu.ec. Sin él, cae a 'common' para no romper el dev/mock.
const TENANT_ID    = import.meta.env.VITE_MSAL_TENANT_ID
const AUTHORITY    = `https://login.microsoftonline.com/${TENANT_ID || 'common'}`
// El redirect URI se adapta al dominio actual (localhost en dev,
// firebaseapp.com/web.app en producción). Cada origen debe estar registrado
// como "SPA redirect URI" en el portal de Azure.
const REDIRECT_URI = window.location.origin

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
    // Single-tenant cuando VITE_MSAL_TENANT_ID está definido (solo @uide.edu.ec);
    // 'common' como fallback en desarrollo mientras no se tenga el tenant_id.
    authority: AUTHORITY,
    redirectUri: REDIRECT_URI,
  },
  cache: {
    // localStorage + cookie de estado: más confiable para el flujo de redirect
    // (el token/cuenta sobrevive a la navegación completa y a recargas).
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
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
      // en MSAL v3+. Procesa el retorno del redirect de Outlook.
      try {
        const res = await msalInstance.handleRedirectPromise()
        if (res) authLog('msal:redirectResult', `cuenta=${res.account?.username} scopes=${res.scopes?.length}`)
      } catch (e) {
        authLog('msal:redirectResult-ERROR', `${e.errorCode ?? ''} ${e.message ?? e}`)
      }
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
 * Autoriza el calendario Outlook del docente (RF-013) vía REDIRECT.
 * Se usa redirect (no popup) porque las extensiones del navegador cuelgan el
 * popup. La página navega a Microsoft y vuelve; handleRedirectPromise (en la
 * init de getMsal) procesa el retorno y cachea la cuenta + tokens.
 */
export async function loginOutlook() {
  const msal = await getMsal()
  const accounts = msal.getAllAccounts()
  authLog('msal:loginRedirect', `scopes=Calendars.Read,Mail.Read redirectUri=${REDIRECT_URI}`)
  await msal.loginRedirect({
    scopes: OUTLOOK_SCOPES,
    account: accounts.length > 0 ? accounts[0] : undefined,
    prompt: accounts.length > 0 ? undefined : 'select_account',
    // Al volver de Microsoft, regresar a la página donde estaba (el calendario)
    redirectStartPage: window.location.href,
  })
  // La página navega fuera; no retorna.
}

/**
 * Cierra la sesión de Microsoft (solo del contexto Outlook, no del sistema).
 */
export async function logoutOutlook() {
  const msal = await getMsal()
  const accounts = msal.getAllAccounts()
  if (accounts.length > 0) {
    // logoutRedirect navega fuera; usamos clearCache para no perder la sesión
    // de Firebase del sistema. Solo limpiamos la cuenta MSAL localmente.
    await msal.clearCache({ account: accounts[0] })
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
      // Requiere interacción → redirect (no popup). Navega fuera y vuelve.
      await msal.acquireTokenRedirect({
        scopes: OUTLOOK_SCOPES,
        account: accounts[0],
      })
      return null
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
