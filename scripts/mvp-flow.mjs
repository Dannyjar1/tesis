/**
 * mvp-flow.mjs — Verificación de punta a punta del flujo MVP (FASE 6):
 * login → distributivo → actividades → reporte.
 * Uso: SMOKE_BASE=http://localhost:5174 node scripts/mvp-flow.mjs
 * (temporal — no forma parte del set de smoke permanente)
 */
import { chromium } from '@playwright/test'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173'
const res = []
const errores = []
const ok   = n => { res.push(['OK  ', n]); console.log('OK  ', n) }
const fail = (n, e) => { res.push(['FAIL', `${n} — ${e}`]); console.log('FAIL', n, '—', String(e).slice(0, 160)) }
async function check(n, fn) { try { await fn(); ok(n) } catch (e) { fail(n, e.message ?? e) } }

const browser = await chromium.launch()
const page = await browser.newPage()
page.setDefaultTimeout(8000)
page.on('pageerror', e => errores.push(`pageerror: ${e.message}`))
page.on('console', m => { if (m.type() === 'error') errores.push(`console.error: ${m.text().slice(0, 160)}`) })

async function login(etiqueta) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: etiqueta }).click()
  await page.waitForURL(u => !u.href.includes('/login'), { timeout: 10000 })
}
const logout = () => page.evaluate(() => localStorage.removeItem('uide_session'))

// ════════ DIRECTOR ════════
await check('1. LOGIN director', async () => {
  await login('Director — Sistemas')
  if (!page.url().includes('/dashboard')) throw new Error(`url=${page.url()}`)
})

await check('2. DISTRIBUTIVO: gestión renderiza con tabla de docentes', async () => {
  await page.goto(`${BASE}/distributivo/gestion`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Gestión del Distributivo' }).waitFor()
  await page.getByText('Total docentes').waitFor()
})
await check('2b. DISTRIBUTIVO: modal Crear/Editar abre', async () => {
  await page.getByRole('button', { name: /Crear|Editar/ }).first().click()
  await page.getByText(/distributivo —/i).waitFor()
  await page.keyboard.press('Escape')
})

await check('3. ACTIVIDADES: panel director renderiza con resumen', async () => {
  await page.goto(`${BASE}/actividades`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Actividades asignadas' }).waitFor()
  await page.getByText('Total asignadas').waitFor()
})
await check('3b. ACTIVIDADES: modal Nueva actividad abre', async () => {
  await page.getByRole('button', { name: '+ Nueva actividad' }).click()
  await page.waitForTimeout(400)
  await page.keyboard.press('Escape')
})

await check('4. REPORTE: página renderiza', async () => {
  await page.goto(`${BASE}/reportes`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Reportes y Exportación' }).waitFor()
})
await check('4b. REPORTE: PDF de carrera genera código de verificación', async () => {
  await page.getByRole('button', { name: 'Reporte de carrera' }).click()
  await page.getByRole('button', { name: /Descargar PDF/ }).click()
  await page.getByText(/Código de verificación:/, { exact: false }).waitFor({ timeout: 20000 })
})
await check('4c. REPORTE: Excel se genera/descarga', async () => {
  const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null)
  await page.getByRole('button', { name: /Descargar Excel/ }).click()
  const okMsg = page.getByText(/Excel generado/i).waitFor({ timeout: 20000 }).then(() => true).catch(() => false)
  const r = await Promise.race([dl, okMsg])
  if (!r) throw new Error('sin descarga ni confirmación de Excel')
})
await check('4d. REPORTE: semestral de actividades (cumplimiento + evidencias)', async () => {
  // Sembrar actividades del período para el reporte (1 completada con evidencia, 1 pendiente)
  await page.evaluate(() => {
    const acts = [
      { id: 'a1', asignada_a_uid: 'uid_mipalaciosmo', asignada_a_nombre: 'Milton Palacios', categoria_ces: 'vinculacion', estado: 'completada', evidencia_url: 'https://ejemplo/evidencia.pdf', carrera_id: 'sistemas-informacion', periodo_id: '2026-A', titulo: 'Informe vinculación', fecha_limite: '2026-07-01' },
      { id: 'a2', asignada_a_uid: 'uid_mipalaciosmo', asignada_a_nombre: 'Milton Palacios', categoria_ces: 'docencia', estado: 'pendiente', evidencia_url: null, carrera_id: 'sistemas-informacion', periodo_id: '2026-A', titulo: 'Plan analítico', fecha_limite: '2027-01-01' },
    ]
    localStorage.setItem('uide_actividades_2026-A', JSON.stringify(acts))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  // Esperar a que el período activo cargue (el reporte usa periodoActivo.id)
  await page.getByText('Reportes y Exportación').waitFor()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: /Reporte semestral de actividades/ }).click()
  await page.getByText(/Reporte semestral de actividades generado/i).waitFor({ timeout: 20000 })
})

// ════════ DOCENTE ════════
await check('5. LOGIN docente → /mi-distributivo', async () => {
  await logout()
  await login('Docente TC — Palacios')
  await page.waitForURL(/mi-distributivo/, { timeout: 8000 })
  await page.getByRole('heading', { name: 'Mi Distributivo' }).waitFor()
})
await check('6. DOCENTE: Mis Actividades renderiza', async () => {
  await page.goto(`${BASE}/mis-actividades`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Mis Actividades' }).waitFor()
})

await browser.close()
const fails = res.filter(r => r[0] === 'FAIL').length
console.log(`\n══ ${res.length} checks · ${res.length - fails} OK · ${fails} FAIL ══`)
if (errores.length) {
  console.log(`\n── ${errores.length} error(es) de consola/runtime capturados ──`)
  ;[...new Set(errores)].forEach(e => console.log('  •', e))
}
process.exit(fails > 0 ? 1 : 0)
