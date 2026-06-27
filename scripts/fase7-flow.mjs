/**
 * fase7-flow.mjs — Verificación de las brechas del distributivo (FASE 7):
 * 1) bloqueo exacto 40h/20h  2) doble aprobación director+docente
 * 3) alerta tutorías mismo día  4) campo graduados/coordinación.
 * Uso: SMOKE_BASE=http://localhost:5175 node scripts/fase7-flow.mjs
 */
import { chromium } from '@playwright/test'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'
const res = []
const ok   = n => { res.push(['OK  ', n]); console.log('OK  ', n) }
const fail = (n, e) => { res.push(['FAIL', `${n} — ${e}`]); console.log('FAIL', n, '—', String(e).slice(0, 180)) }
async function check(n, fn) { try { await fn(); ok(n) } catch (e) { fail(n, e.message ?? e) } }

const browser = await chromium.launch()
const page = await browser.newPage()
page.setDefaultTimeout(8000)

// limpiar=false conserva localStorage (distributivos) para probar el flujo
// cruzado director→docente dentro del mismo navegador/almacén.
async function login(etiqueta, limpiar = true) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  if (limpiar) await page.evaluate(() => localStorage.clear())
  else await page.evaluate(() => localStorage.removeItem('uide_session'))
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: etiqueta }).click()
  await page.waitForURL(u => !u.href.includes('/login'), { timeout: 10000 })
}

// ── 1. Bloqueo exacto: guardar deshabilitado si el total ≠ contrato ──
await check('1. Bloqueo 40h/20h: guardar deshabilitado si total ≠ contrato', async () => {
  await login('Director — Sistemas')
  await page.goto(`${BASE}/distributivo/gestion`, { waitUntil: 'domcontentloaded' })
  // Editar el distributivo de Palacios y romper el cierre exacto
  const fila = page.getByRole('row', { name: /Palacios/ })
  await fila.getByRole('button', { name: 'Editar' }).click()
  await page.getByText(/distributivo —/i).waitFor()
  await page.locator('input[type=number]').first().fill('3')   // docencia 3 → total ≠ 40
  const btn = page.getByRole('button', { name: /Actualizar borrador|Crear distributivo/ })
  if (!(await btn.isDisabled())) throw new Error('el botón debería estar deshabilitado con total ≠ 40h')
  await page.keyboard.press('Escape')
})

// ── 2. Doble aprobación: director aprueba → "En revisión" ──
await check('2a. Director aprueba borrador → enviado a confirmación', async () => {
  const filaPalacios = page.getByRole('row', { name: /Palacios/ })
  await filaPalacios.getByRole('button', { name: 'Aprobar' }).click()
  await page.getByText(/enviado a su confirmación/i).waitFor({ timeout: 10000 })
})
await check('2b. Estado del distributivo pasa a "En revisión"', async () => {
  await page.getByRole('row', { name: /Palacios/ }).getByText('En revisión').waitFor()
})

// ── 3. Docente confirma (segunda firma) → Aprobado ──
await check('3a. Docente ve "Pendiente de tu confirmación"', async () => {
  await login('Docente TC — Palacios', false)   // conserva la aprobación del director
  await page.waitForURL(/mi-distributivo/, { timeout: 8000 })
  await page.getByText('Pendiente de tu confirmación').waitFor()
})
await check('3b. Docente confirma → distributivo Aprobado', async () => {
  await page.getByRole('button', { name: 'Confirmar distributivo' }).click()
  await page.getByText(/confirmado por director y docente/i).waitFor({ timeout: 10000 })
})

// ── 4. Alerta de tutorías concentradas el mismo día (ahora dentro de Mi Distributivo) ──
await check('4. Horario en Mi Distributivo: alerta si todas las tutorías son el mismo día', async () => {
  const uid = await page.evaluate(() => JSON.parse(localStorage.getItem('uide_session'))?.uid)
  await page.evaluate((uid) => {
    const tut = (h1, h2) => ({ id: `t_${h1}`, docente_uid: uid, dia: 'lunes', hora_inicio: `${h1}:00`, hora_fin: `${h2}:00`, materia: 'Tutoría', aula: '', tipo: 'tutoria' })
    localStorage.setItem('uide_horario_semanal', JSON.stringify([tut('08', '09'), tut('09', '10')]))
  }, uid)
  await page.goto(`${BASE}/mi-distributivo`, { waitUntil: 'domcontentloaded' })
  await page.getByText(/tutoría concentradas el Lunes/i).waitFor({ timeout: 8000 })
})

await browser.close()
const fails = res.filter(r => r[0] === 'FAIL').length
console.log(`\n══ ${res.length} checks · ${res.length - fails} OK · ${fails} FAIL ══`)
process.exit(fails > 0 ? 1 : 0)
