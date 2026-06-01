import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', err => consoleErrors.push(err.message));

await page.goto('http://localhost:5173/');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'ss-login.png', fullPage: true });

// Obtener todos los inputs visibles
const inputs = await page.$$eval('input', els =>
  els.map(e => ({ type: e.type, name: e.name, placeholder: e.placeholder, id: e.id }))
);

writeFileSync('check-azure-report.txt', [
  'URL: ' + page.url(),
  'Inputs encontrados: ' + JSON.stringify(inputs, null, 2),
  '',
  'Errores de consola:',
  consoleErrors.length === 0 ? '(ninguno)' : consoleErrors.join('\n'),
].join('\n'));

await browser.close();
console.log('Listo');
