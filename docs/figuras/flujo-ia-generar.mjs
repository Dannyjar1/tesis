/**
 * flujo-ia-generar.mjs — Diagrama de flujo del componente de IA (clasificación
 * NLP de actividades). Refleja el pipeline real de functions/clasificacion/ +
 * la confirmación/corrección humana y el reentrenamiento offline.
 *   node docs/figuras/flujo-ia-generar.mjs   →  docs/figuras/flujo-ia.svg + .png
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.resolve('docs/figuras')

const C = {
  azulOsc: '#003087', azul: '#0057B7', naranja: '#E8500A', verde: '#13633A',
  rojo: '#DC2626', gris: '#6B7280', linea: '#334155', txt: '#1F2937',
}

// ── Nodos ─────────────────────────────────────────────────────────────────────
// shape: term | proc | dec | io | db
const N = {
  start: { shape: 'term', x: 380, y: 70, w: 440, h: 52, fill: '#E8F0FE', stroke: C.azulOsc,
    text: ['Usuario redacta el texto de la actividad/evento', '(título + descripción)'] },
  req: { shape: 'io', x: 360, y: 150, w: 480, h: 60, fill: '#EEF6FF', stroke: C.azul,
    text: ['POST /clasificar', '{ texto, evento_id, docente_uid, periodo_id } + Firebase ID token'] },
  valid: { shape: 'dec', x: 495, y: 244, w: 210, h: 96, fill: '#FFF7E6', stroke: C.naranja,
    text: ['¿texto válido', '(no vacío)?'] },
  err: { shape: 'term', x: 905, y: 268, w: 220, h: 50, fill: '#FDECEC', stroke: C.rojo,
    text: ['HTTP 400', "Campo 'texto' requerido"] },
  pre: { shape: 'proc', x: 360, y: 376, w: 480, h: 66, fill: '#FFFFFF', stroke: C.azul,
    text: ['Preprocesamiento', 'minúsculas · normalización Unicode (NFKD) · limpieza de caracteres'] },
  modo: { shape: 'dec', x: 485, y: 478, w: 230, h: 100, fill: '#FFF7E6', stroke: C.naranja,
    text: ['CLASIFICADOR_MODO'] },
  beto: { shape: 'proc', x: 95, y: 622, w: 380, h: 140, fill: '#DCE7FB', stroke: C.azulOsc, bold: true,
    text: ['BETO fine-tuned (español)', 'dccuchile/bert-base-spanish-wwm-cased',
      'AutoModelForSequenceClassification', '(Transformer + capa softmax)',
      'tokeniza (máx. 128) → logits → softmax → argmax'] },
  betoOk: { shape: 'dec', x: 175, y: 800, w: 220, h: 96, fill: '#FFF7E6', stroke: C.naranja,
    text: ['¿BETO disponible?', '(torch / modelo / memoria)'] },
  heur: { shape: 'proc', x: 730, y: 622, w: 375, h: 140, fill: '#F3F4F6', stroke: C.gris,
    text: ['Clasificador heurístico', '(modo por defecto / fallback)',
      'keywords × pesos → normaliza → argmax', "sin señal → 'gestión' (conf. 0.58)",
      'confianza ∈ [0.58, 0.97]'] },
  result: { shape: 'proc', x: 370, y: 930, w: 460, h: 64, fill: '#FFFFFF', stroke: C.azul,
    text: ['Resultado provisional', '{ categoria, confianza, probabilidades, motor }'] },
  persist: { shape: 'db', x: 360, y: 1030, w: 480, h: 96, fill: '#EAF6EF', stroke: C.verde,
    text: ['Persistencia en Cloud Firestore', "/clasificaciones_ia  (estado = 'provisional')",
      "evento → estado_clasificacion = 'provisional'"] },
  resp: { shape: 'io', x: 360, y: 1158, w: 480, h: 58, fill: '#EEF6FF', stroke: C.azul,
    text: ['HTTP 200 → el frontend muestra la sugerencia provisional'] },
  revisa: { shape: 'dec', x: 480, y: 1252, w: 240, h: 108, fill: '#FFF7E6', stroke: C.naranja,
    text: ['El usuario (director/', 'coordinador) revisa:', '¿categoría correcta?'] },
  confirma: { shape: 'proc', x: 760, y: 1272, w: 345, h: 70, fill: '#EAF6EF', stroke: C.verde,
    text: ['Confirmar', "evento.estado_clasificacion = 'confirmada'"] },
  corrige: { shape: 'proc', x: 95, y: 1262, w: 380, h: 96, fill: '#FDEFE8', stroke: C.naranja,
    text: ['Corrección manual', 'categoria_corregida · fue_corregida = true',
      'guarda registro en /feedback'] },
  end: { shape: 'term', x: 470, y: 1410, w: 260, h: 50, fill: '#E8F0FE', stroke: C.azulOsc,
    text: ['Fin: clasificación confirmada'] },
  // Reentrenamiento offline
  ds: { shape: 'proc', x: 110, y: 1540, w: 300, h: 72, fill: '#F5F7FA', stroke: C.verde,
    text: ['generar_dataset.py', '/feedback → dataset_beto.csv (etiquetado)'] },
  train: { shape: 'proc', x: 450, y: 1540, w: 350, h: 72, fill: '#F5F7FA', stroke: C.verde,
    text: ['entrenar.py · fine-tuning de BETO', '4 epochs · lr 2e-5 · meta F1 ≥ 0.80'] },
  store: { shape: 'db', x: 840, y: 1540, w: 255, h: 72, fill: '#EAF6EF', stroke: C.verde,
    text: ['Modelo → Cloud Storage'] },
}

// ── Aristas ───────────────────────────────────────────────────────────────────
// {from,to, fs,ts (lados), label, dashed, points(opcional)}
const E = [
  ['start', 'bottom', 'req', 'top'],
  ['req', 'bottom', 'valid', 'top'],
  ['valid', 'right', 'err', 'left', 'No'],
  ['valid', 'bottom', 'pre', 'top', 'Sí'],
  ['pre', 'bottom', 'modo', 'top'],
  ['modo', 'left', 'beto', 'top', 'beto'],
  ['modo', 'right', 'heur', 'top', 'heurística (default)'],
  ['beto', 'bottom', 'betoOk', 'top'],
  ['betoOk', 'right', 'heur', 'left', 'No → fallback', true],
  ['betoOk', 'bottom', 'result', 'left', 'Sí'],
  ['heur', 'bottom', 'result', 'right'],
  ['result', 'bottom', 'persist', 'top'],
  ['persist', 'bottom', 'resp', 'top'],
  ['resp', 'bottom', 'revisa', 'top'],
  ['revisa', 'right', 'confirma', 'left', 'Sí: confirmar'],
  ['revisa', 'left', 'corrige', 'right', 'No: corregir'],
  ['confirma', 'bottom', 'end', 'right'],
  ['corrige', 'bottom', 'end', 'left'],
  // Reentrenamiento (mejora continua, discontinuo)
  ['corrige', 'bottom', 'ds', 'top', 'registros /feedback', true],
  ['ds', 'right', 'train', 'left', '', true],
  ['train', 'right', 'store', 'left', '', true],
  // retorno del modelo reentrenado a BETO (ruta por el margen izquierdo)
  ['store', 'bottom', 'beto', 'left', 'redespliegue del modelo', true,
    [[967, 1635], [55, 1635], [55, 692]]],
]

// ── Render ────────────────────────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function cx(n) { return n.x + n.w / 2 }
function cy(n) { return n.y + n.h / 2 }
function anchor(n, side) {
  switch (side) {
    case 'top': return [cx(n), n.y]
    case 'bottom': return [cx(n), n.y + n.h]
    case 'left': return [n.x, cy(n)]
    case 'right': return [n.x + n.w, cy(n)]
    default: return [cx(n), cy(n)]
  }
}

function nodeShape(n) {
  const { x, y, w, h } = n
  const sw = n.bold ? 2.4 : 1.6
  if (n.shape === 'dec') {
    const pts = `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`
    return `<polygon points="${pts}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>`
  }
  if (n.shape === 'io') {
    const s = 18
    const pts = `${x + s},${y} ${x + w},${y} ${x + w - s},${y + h} ${x},${y + h}`
    return `<polygon points="${pts}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>`
  }
  if (n.shape === 'db') {
    const ry = 9
    return `
      <path d="M${x},${y + ry} a${w / 2},${ry} 0 0 1 ${w},0 v${h - 2 * ry} a${w / 2},${ry} 0 0 1 -${w},0 Z"
        fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
      <path d="M${x},${y + ry} a${w / 2},${ry} 0 0 0 ${w},0" fill="none" stroke="${n.stroke}" stroke-width="${sw}"/>`
  }
  const r = n.shape === 'term' ? h / 2 : 8
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>`
}

function nodeText(n) {
  const lines = n.text
  const fs = 11.5
  const lh = 14.5
  const startY = cy(n) - ((lines.length - 1) * lh) / 2 + 4
  return lines.map((ln, i) => {
    const bold = n.bold && i === 0 ? '700' : '400'
    return `<text x="${cx(n)}" y="${startY + i * lh}" text-anchor="middle" font-size="${fs}" font-weight="${bold}" fill="${C.txt}">${esc(ln)}</text>`
  }).join('\n')
}

function edge(e) {
  const [from, fs, to, ts, label = '', dashed = false, pts = null] = e
  const a = anchor(N[from], fs)
  const b = anchor(N[to], ts)
  const dash = dashed ? ' stroke-dasharray="6 5"' : ''
  let d, mid
  if (pts) {
    const all = [a, ...pts, b]
    d = 'M' + all.map(p => `${p[0]},${p[1]}`).join(' L')
    mid = pts[Math.floor(pts.length / 2)]
  } else {
    d = `M${a[0]},${a[1]} L${b[0]},${b[1]}`
    mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  }
  let lbl = ''
  if (label) {
    const lw = label.length * 5.8 + 10
    lbl = `
      <rect x="${(mid[0] - lw / 2).toFixed(1)}" y="${(mid[1] - 9).toFixed(1)}" width="${lw.toFixed(1)}" height="16" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.8"/>
      <text x="${mid[0].toFixed(1)}" y="${(mid[1] + 2.5).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#334155">${esc(label)}</text>`
  }
  return `<path d="${d}" fill="none" stroke="${C.linea}" stroke-width="1.5"${dash} marker-end="url(#ar)"/>${lbl}`
}

const edgesSvg = E.map(edge).join('\n')
const nodesSvg = Object.values(N).map(n => nodeShape(n) + '\n' + nodeText(n)).join('\n')

const W = 1180, H = 1690
// panel reentrenamiento
const panel = `
  <rect x="70" y="1500" width="1060" height="130" rx="12" fill="#F8FAF9" stroke="#13633A" stroke-width="1.2" stroke-dasharray="7 5"/>
  <text x="90" y="1522" font-size="12" font-weight="700" fill="#13633A">Reentrenamiento offline (manual) — mejora continua del modelo</text>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Arial, Helvetica, sans-serif">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${C.linea}"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="${W / 2}" y="38" text-anchor="middle" font-size="22" font-weight="700" fill="#001F5B">Pipeline de clasificación de actividades con NLP (BETO)</text>
  <text x="${W / 2}" y="60" text-anchor="middle" font-size="13" fill="#6B7280">Cloud Function 'clasificar' (Python) — preprocesamiento, clasificación, confirmación humana y reentrenamiento</text>
  ${panel}
  ${edgesSvg}
  ${nodesSvg}

  <!-- Leyenda de formas -->
  <g font-size="11" fill="#374151">
    <rect x="70" y="${H - 40}" width="26" height="15" rx="7.5" fill="#E8F0FE" stroke="${C.azulOsc}"/>
    <text x="104" y="${H - 29}">inicio/fin</text>
    <rect x="190" y="${H - 40}" width="26" height="15" rx="4" fill="#FFFFFF" stroke="${C.azul}"/>
    <text x="224" y="${H - 29}">proceso</text>
    <polygon points="320,${H - 40} 344,${H - 32.5} 320,${H - 25} 296,${H - 32.5}" fill="#FFF7E6" stroke="${C.naranja}"/>
    <text x="352" y="${H - 29}">decisión</text>
    <polygon points="455,${H - 40} 478,${H - 40} 472,${H - 25} 449,${H - 25}" fill="#EEF6FF" stroke="${C.azul}"/>
    <text x="486" y="${H - 29}">entrada/salida</text>
    <path d="M610,${H - 38} a13,4 0 0 1 26,0 v9 a13,4 0 0 1 -26,0 Z" fill="#EAF6EF" stroke="${C.verde}"/>
    <text x="644" y="${H - 29}">almacenamiento</text>
    <line x1="760" y1="${H - 32}" x2="800" y2="${H - 32}" stroke="${C.linea}" stroke-width="1.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
    <text x="808" y="${H - 29}">flujo de mejora / fallback</text>
  </g>
</svg>
`

writeFileSync(path.join(DIR, 'flujo-ia.svg'), svg, 'utf8')
console.log(`SVG generado: ${W}x${H}`)

const { chromium } = await import('playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: 'networkidle' })
await (await page.$('svg')).screenshot({ path: path.join(DIR, 'flujo-ia.png') })
await browser.close()
console.log('PNG generado (scale 2)')
