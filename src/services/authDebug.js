/**
 * authDebug.js — Logger de diagnóstico de autenticación que PERSISTE en
 * localStorage. Necesario porque el flujo de redirect recarga la página y los
 * logs de consola se pierden. El panel del LoginPage lee de aquí.
 */
const KEY = 'uide_auth_log'
const MAX = 40

export function authLog(paso, detalle = '') {
  try {
    const logs = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    const hora = new Date().toLocaleTimeString('es-EC', { hour12: false })
    logs.push({ hora, paso, detalle: String(detalle).slice(0, 300), origin: window.location.origin })
    localStorage.setItem(KEY, JSON.stringify(logs.slice(-MAX)))
    // También a consola por si acaso
    console.log(`[authDebug] ${hora} ${paso}`, detalle)
  } catch { /* ignore */ }
}

export function getAuthLog() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch { return [] }
}

export function clearAuthLog() {
  localStorage.removeItem(KEY)
}
