/**
 * smoke-test.mjs — Verificación funcional en navegador de los módulos nuevos.
 * Recorre login mock por rol y comprueba que cada vista renderiza su contenido.
 * Uso: node scripts/smoke-test.mjs   (requiere `npm run dev` corriendo)
 */
import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'
const resultados = []
let browser, page

function ok(nombre)  { resultados.push(['OK  ', nombre]); console.log('OK  ', nombre) }
function fail(nombre, e) { resultados.push(['FAIL', `${nombre} — ${e}`]); console.log('FAIL', nombre, '—', String(e).slice(0, 120)) }

async function check(nombre, fn) {
  try { await fn(); ok(nombre) } catch (e) { fail(nombre, e.message ?? e) }
}

async function login(etiqueta) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: etiqueta }).click()
  await page.waitForURL(u => !u.href.includes('/login'), { timeout: 10000 })
}

async function logout() {
  await page.evaluate(() => localStorage.removeItem('uide_session'))
}

const t0 = Date.now()
browser = await chromium.launch()
page = await browser.newPage()
page.setDefaultTimeout(8000)

// ── 1. Login carga ──
await check('Login renderiza con panel DEV', async () => {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Director — Sistemas/ }).waitFor()
})

// ── 2. Director: dashboard + RolBanner + planes de mejora ──
await check('Director: login → /dashboard', async () => {
  await login('Director — Sistemas')
  if (!page.url().includes('/dashboard')) throw new Error(`url=${page.url()}`)
})
await check('RF-040 RolBanner: rol y accesos rápidos', async () => {
  await page.getByText('Director de Carrera').first().waitFor()
  await page.getByRole('link', { name: 'Reportes' }).first().waitFor()
})
await check('RF-037 Panel planes de mejora visible', async () => {
  await page.getByText('Planes de mejora (incumplimiento)').waitFor()
})
await check('RF-037 Modal registrar plan abre (Liquid Glass)', async () => {
  await page.getByRole('button', { name: '+ Registrar plan' }).click()
  await page.getByText('Plan de mejoras *').waitFor()
  await page.keyboard.press('Escape')
})

// ── 3. Sidebar: Mi Perfil y Ayuda para todos ──
await check('Sidebar: entradas Mi Perfil y Ayuda', async () => {
  await page.getByRole('link', { name: 'Mi Perfil' }).waitFor()
  await page.getByRole('link', { name: 'Ayuda' }).waitFor()
})

// ── 4. /perfil: datos + campo WhatsApp con validación ──
await check('RF-038 /perfil: campo WhatsApp valida formato', async () => {
  await page.goto(`${BASE}/perfil`)
  await page.getByText('Notificaciones por WhatsApp').waitFor()
  const input = page.locator('#telefono_whatsapp')
  await input.fill('0991234567')
  await page.getByText(/debe empezar con \+/).waitFor()
  await input.fill('+593991234567')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.getByText(/Número de WhatsApp guardado/).waitFor()
})

// ── 5. /ayuda: secciones por rol + buscador + tutoriales ──
await check('RF-039 /ayuda: FAQ del rol director + tutoriales', async () => {
  await page.goto(`${BASE}/ayuda`)
  await page.getByText('Gestión de distributivos').waitFor()
  await page.getByText('Tutoriales paso a paso').waitFor()
  await page.getByPlaceholder('Buscar en la ayuda…').fill('whatsapp')
  await page.getByText(/registrar mi número de WhatsApp/i).waitFor()
})

// ── 6. Docente: home, calendario con pestaña correos, IA ──
await check('Docente: login → /mi-distributivo', async () => {
  await logout()
  await login('Docente TC — Palacios')
  await page.waitForURL(/mi-distributivo/, { timeout: 8000 })
})
await check('RF-023 Calendario: toggle Agenda|Correos DIST/*', async () => {
  await page.goto(`${BASE}/calendario`)
  await page.getByRole('button', { name: /Correos DIST/ }).click()
  await page.getByText(/correos con etiqueta DIST/).waitFor()
})
await check('RF-023 Correos mock listados + selector etiqueta', async () => {
  await page.getByText('Acta de calificaciones primer parcial — Programación Web').waitFor()
  await page.getByText('Modo demostración:').waitFor()
})
await check('IA: botón Crear tareas To Do con IA presente', async () => {
  await page.getByRole('button', { name: /Crear tareas To Do con IA/ }).waitFor()
})
await check('RF-041 Mis Actividades: checkbox imprevista + validación 2 semanas', async () => {
  await page.goto(`${BASE}/mis-actividades`)
  await page.getByRole('button', { name: /Nueva/ }).first().click()
  await page.getByText('Actividad imprevista').waitFor()
  await page.getByPlaceholder(/Preparar material/).fill('Prueba imprevista smoke')
  await page.getByRole('checkbox').check()
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  await page.locator('input[type="date"]').fill(manana)
  await page.getByRole('button', { name: /Agregar/ }).last().click()
  await page.getByText(/mínimo 2 semanas de anticipación/).first().waitFor()
  await page.keyboard.press('Escape')
})

// ── 7. Admin y Administrativo: banners por rol ──
await check('Admin: RolBanner alcance global', async () => {
  await logout()
  await login('Admin — Pro-Rector Ruiz')
  await page.getByText('Alcance global — todas las carreras').waitFor()
})
await check('Administrativo: home /mi-panel + banner', async () => {
  await logout()
  await login('Administrativo — Jaramillo')
  await page.waitForURL(/mi-panel/, { timeout: 8000 })
  await page.getByText('Personal administrativo').waitFor()
})

// ── 8. Superadmin: carreras con facultad + jerarquía + gestión de usuarios ──
await check('Superadmin: login → /sistema con 7 carreras', async () => {
  await logout()
  await login('TIC — Cueva (Superadmin)')
  await page.waitForURL(/sistema/, { timeout: 8000 })
  await page.getByText('7 carrera(s) registradas').waitFor()
})
await check('Carreras: facultades UIDE correctas', async () => {
  await page.getByText('Facultad de Ingenierías Digitales y Tecnologías Emergentes').waitFor()
  await page.getByText('Facultad de Jurisprudencia, Ciencias Sociales y Humanidades').waitFor()
  await page.getByText('Facultad de Arquitectura, Diseño y Arte').waitFor()
  await page.getByText('Facultad de Ciencias Médicas, de la Salud y la Vida').waitFor()
  const bs = await page.getByText('Business School', { exact: false }).count()
  if (bs < 3) throw new Error(`Business School aparece ${bs} veces (esperado 3)`)
})
await check('Carreras: jerarquía director → coordinador → docentes', async () => {
  await page.getByText('Lorena Elizabeth Conde Zhingre').waitFor()   // director Sistemas
  await page.getByText('Darío Javier Valarezo León').waitFor()       // coordinador Sistemas
  await page.getByText('Docentes (2)').waitFor()                     // Palacios + Torres
  await page.getByText('Sin director asignado').first().waitFor()    // carreras sin asignar
})
await check('Carreras: botón Agregar usuario abre modal con la carrera', async () => {
  await page.getByRole('button', { name: '+ Agregar usuario' }).first().click()
  await page.getByText(/Nuevo usuario — /).waitFor()
  await page.keyboard.press('Escape')
})

await check('RBAC: selección múltiple de roles con docente automático', async () => {
  await page.getByRole('link', { name: 'Usuarios y Roles' }).click()
  const fila = page.getByRole('row', { name: /Valarezo/ })
  await fila.getByRole('button', { name: 'Editar' }).click()
  await page.getByText('Cargos institucionales (selección múltiple)').waitFor()
  // Marcar el cargo Director → "Docente" debe marcarse solo (regla RBAC)
  await page.getByRole('checkbox', { name: 'Director de Carrera' }).check()
  const docenteChk = page.getByRole('checkbox', { name: 'Docente', exact: true })
  if (!(await docenteChk.isChecked())) throw new Error('Docente no se marcó automáticamente al asignar cargo')
  await page.getByRole('button', { name: 'Guardar' }).click()
  // La tabla muestra los chips de TODOS los roles del usuario
  await fila.getByText('Director de Carrera').waitFor()
  await fila.getByText('Docente', { exact: true }).waitFor()
})
await check('RBAC: la jerarquía de la carrera refleja el multi-rol', async () => {
  await page.getByRole('button', { name: 'Carreras', exact: true }).click()
  await page.getByText('Docentes (3)').waitFor()   // Valarezo ahora también cuenta como docente
})

await check('Superadmin: pestaña Períodos Académicos con estructura completa', async () => {
  await page.getByRole('link', { name: 'Períodos' }).click()
  await page.getByRole('button', { name: '+ Nuevo período' }).waitFor()      // crear período
  await page.getByRole('button', { name: 'Estructura' }).first().waitFor()  // configurar jerarquía
  await page.getByRole('button', { name: 'Estructura' }).first().click()
  await page.getByText('Coordinador / responsable del período').waitFor()   // asignaciones
  await page.keyboard.press('Escape')
})

// ── 9. Multi-rol: superadmin vinculado también como docente ──
await check('Superadmin+docente: ve módulos de sistema Y docentes (fusión)', async () => {
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('uide_session'))
    s.roles = ['superadmin', 'docente']
    s.carrera_id = 'sistemas-informacion'
    s.tipo_contrato = 'tiempo_completo'
    localStorage.setItem('uide_session', JSON.stringify(s))
  })
  await page.goto(`${BASE}/sistema`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: 'Carreras', exact: true }).waitFor()        // menú superadmin
  await page.getByRole('link', { name: 'Mi Distributivo' }).waitFor()              // menú docente
  await page.goto(`${BASE}/mi-distributivo`, { waitUntil: 'domcontentloaded' })    // acceso docente permitido
  if (page.url().includes('/login')) throw new Error('redirigido fuera de módulo docente')
})

// ── 10. Estructura jerárquica del período (Período → Carreras → Usuarios) ──
await check('Estructura del período: modal con carreras y asignaciones', async () => {
  await logout()
  await login('Director — Sistemas')
  await page.goto(`${BASE}/admin/periodos`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Estructura' }).first().click()
  await page.getByText('Coordinador / responsable del período').waitFor()
  await page.getByRole('button', { name: 'Derecho' }).waitFor()                    // selector de carreras
  await page.keyboard.press('Escape')
})
await check('Historial inmutable: período finalizado en modo consulta', async () => {
  await page.getByRole('button', { name: 'Consultar' }).first().click()
  await page.getByText('historial inmutable').waitFor()
  await page.keyboard.press('Escape')
})

await browser.close()
const fails = resultados.filter(r => r[0] === 'FAIL').length
console.log(`\n══ ${resultados.length} checks · ${resultados.length - fails} OK · ${fails} FAIL · ${((Date.now() - t0) / 1000).toFixed(1)}s ══`)
process.exit(fails > 0 ? 1 : 0)
