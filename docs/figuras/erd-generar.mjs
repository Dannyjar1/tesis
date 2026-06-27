/**
 * erd-generar.mjs — Genera el diagrama entidad-relación (ERD) del esquema
 * Firestore real del proyecto (docs/figuras/erd-base-datos.svg + .png).
 *
 * El esquema se define como datos (abajo) a partir de la inspección del código:
 * firestore.rules, firestore.indexes.json y la capa de servicios. Reproducible:
 *   node docs/figuras/erd-generar.mjs
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.resolve('docs/figuras')

// Paleta
const C = {
  core: '#003087', child: '#0057B7', dist: '#E8500A', sub: '#13633A',
  border: '#C7D2E0', pk: '#E8500A', fk: '#0057B7', text: '#1F2937',
  type: '#6B7280', line: '#5B6B8C', bg: '#FFFFFF',
}

// f(name, type, kind) — kind: 'PK' | 'FK' | undefined
const f = (n, t, k) => ({ n, t, k })

// ── Definición del esquema (colecciones implementadas) ────────────────────────
const entities = {
  usuarios: {
    title: 'usuarios', color: C.core, x: 470, y: 80, w: 280,
    fields: [
      f('uid', 'str', 'PK'), f('nombre', 'str'), f('apellido', 'str'),
      f('nombre_completo', 'str'), f('email', 'str'), f('rol', 'str'),
      f('roles', 'str[]'), f('tipo_contrato', 'str|null'),
      f('carrera_id', 'str|null', 'FK'), f('cargo', 'str'),
      f('titulo_academico', 'str'), f('activo', 'bool'),
      f('telefono_whatsapp', 'str|null'), f('creado_en', 'ts'),
      f('ultima_modificacion', 'ts'), f('actualizado_en', 'ts'),
    ],
  },
  carreras: {
    title: 'carreras', color: C.core, x: 60, y: 80, w: 255,
    fields: [
      f('id', 'str', 'PK'), f('nombre', 'str'), f('facultad', 'str'),
      f('facultad_escuela_pdf', 'str'), f('director_uid', 'str', 'FK'),
      f('coordinador_uid', 'str', 'FK'), f('activo', 'bool'),
      f('fecha_creacion', 'ts'), f('ultima_modificacion', 'ts'),
    ],
  },
  periodos_academicos: {
    title: 'periodos_academicos', color: C.core, x: 60, y: 330, w: 270,
    fields: [
      f('id', 'str', 'PK'), f('nombre', 'str'), f('fecha_inicio', 'ts'),
      f('fecha_fin', 'ts'), f('estado', 'str'),
      f('docentes_uid', 'str[]', 'FK'), f('fecha_creacion', 'ts'),
      f('creado_por', 'str|null', 'FK'), f('creado_automaticamente', 'bool'),
    ],
  },
  estructura_periodo_carrera: {
    title: 'periodos_academicos/{id}/carreras/{id}', subtitle: 'subcolección',
    color: C.sub, x: 60, y: 585, w: 300,
    fields: [
      f('periodo_id', 'str', 'FK'), f('carrera_id', 'str', 'FK'),
      f('director_uid', 'str|null', 'FK'), f('coordinador_uid', 'str|null', 'FK'),
      f('docentes_uid', 'str[]', 'FK'), f('administrativos_uid', 'str[]', 'FK'),
      f('indicadores', 'obj[]'), f('actividades_plantilla', 'obj[]'),
      f('eliminada', 'bool'), f('actualizado_en', 'ts'),
    ],
  },
  distributivos: {
    title: 'distributivos', color: C.dist, x: 470, y: 470, w: 500,
    cols: [
      [
        { label: 'Identificación', fields: [
          f('id  (= docente_uid_periodo_id)', 'str', 'PK'),
          f('docente_uid', 'str', 'FK'), f('periodo_id', 'str', 'FK'),
          f('tipo_contrato', 'str'), f('estado', 'str'),
        ]},
        { label: '1. Docencia', fields: [
          f('asignaturas', 'obj[]  {dia,materia,inicio,fin}'),
          f('horas_tutorias', 'num'), f('horas_otras_docencia', 'num'),
        ]},
        { label: '2. Investigación', fields: [
          f('horas_proyecto_investigacion', 'num'),
          f('horas_articulo_cientifico', 'num'),
        ]},
        { label: '3. Vinculación', fields: [
          f('horas_proyectos_vinculacion', 'num'),
          f('horas_practicas_preprofesionales', 'num'),
          f('horas_seguimiento_graduados', 'num'),
        ]},
        { label: 'Flujo de aprobación', fields: [
          f('aprobado_por', 'str|null', 'FK'), f('fecha_aprobacion', 'ts|null'),
          f('confirmado_por_docente', 'str|null', 'FK'),
          f('fecha_confirmacion_docente', 'ts'),
          f('observacion_docente', 'str|null'),
          f('fecha_ultima_modificacion', 'ts'),
        ]},
      ],
      [
        { label: '4. Gestión académica', fields: [
          f('gestion_direccion_escuela', 'num'),
          f('gestion_coordinacion_academica', 'num'),
          f('gestion_coordinacion_investigacion', 'num'),
          f('gestion_coordinacion_vinculacion', 'num'),
          f('gestion_internacionalizacion', 'num'),
          f('gestion_poa', 'num'),
          f('gestion_representantes_saic', 'num'),
          f('gestion_acreditaciones', 'num'),
          f('gestion_tutores_lectores_grados', 'num'),
          f('gestion_clubes_proyectos_eventos', 'num'),
        ]},
        { label: 'Totales', fields: [
          f('horas_clase_total', 'num'), f('total_horas', 'num'),
        ]},
        { label: 'Derivados (legacy, compat.)', fields: [
          f('horas_docencia_directa', 'num'), f('horas_preparacion', 'num'),
          f('horas_tutoria', 'num'), f('horas_investigacion', 'num'),
          f('horas_vinculacion', 'num'), f('horas_gestion', 'num'),
          f('horas_reduccion_cargo', 'num'),
        ]},
      ],
    ],
  },
  actividades: {
    title: 'actividades', color: C.child, x: 1290, y: 80, w: 290,
    fields: [
      f('id', 'str', 'PK'), f('titulo', 'str'), f('descripcion', 'str'),
      f('categoria_ces', 'str (4 ofic.)'), f('subcategoria', 'str|null'), f('asignada_por_uid', 'str', 'FK'),
      f('asignada_por_nombre', 'str'), f('asignada_a_uid', 'str', 'FK'),
      f('asignada_a_nombre', 'str'), f('carrera_id', 'str|null', 'FK'),
      f('periodo_id', 'str', 'FK'), f('prioridad', 'str'), f('estado', 'str'),
      f('fecha_inicio', 'ts'), f('fecha_limite', 'ts|null'),
      f('fecha_completada', 'ts|null'), f('evidencia_url', 'str|null'),
      f('evidencia_nombre', 'str|null'), f('observacion', 'str|null'),
      f('creada_en', 'ts'),
    ],
  },
  horario_semanal: {
    title: 'horario_semanal', color: C.child, x: 1290, y: 540, w: 255,
    fields: [
      f('id', 'str', 'PK'), f('docente_uid', 'str', 'FK'), f('dia', 'str'),
      f('hora_inicio', 'str'), f('hora_fin', 'str'), f('materia', 'str'),
      f('aula', 'str'), f('tipo', 'str'), f('creado_en', 'ts'),
    ],
  },
  clasificaciones_ia: {
    title: 'clasificaciones_ia', color: C.child, x: 1290, y: 770, w: 300,
    fields: [
      f('id', 'str', 'PK'), f('evento_id', 'str  (ref. externa)'),
      f('docente_uid', 'str', 'FK'), f('periodo_id', 'str', 'FK'),
      f('texto_analizado', 'str'), f('categoria_predicha', 'str'),
      f('confianza', 'num'), f('categoria_corregida', 'str|null'),
      f('fue_corregida', 'bool'), f('fecha_clasificacion', 'ts'),
      f('estado', 'str'),
    ],
  },
  feedback: {
    title: 'feedback', color: C.child, x: 1290, y: 1085, w: 300,
    fields: [
      f('id', 'str', 'PK'), f('clasificacion_id', 'str', 'FK'),
      f('docente_uid', 'str', 'FK'), f('texto_original', 'str'),
      f('categoria_predicha', 'str'), f('categoria_correcta', 'str'),
      f('fecha_correccion', 'ts'),
    ],
  },
  notificaciones: {
    title: 'notificaciones', color: C.child, x: 800, y: 980, w: 310,
    fields: [
      f('id', 'str', 'PK'), f('destinatario_uid', 'str', 'FK'),
      f('tipo', 'str'), f('titulo', 'str'), f('mensaje', 'str'),
      f('docente_uid_ref', 'str|null', 'FK'),
      f('solicitud', 'map|null  {solicitante_uid,…}'),
      f('leida', 'bool'), f('resuelta', 'str|null'), f('fecha_creacion', 'ts'),
    ],
  },
  reportes: {
    title: 'reportes', color: C.child, x: 110, y: 870, w: 290,
    fields: [
      f('id', 'str', 'PK'), f('generado_por_uid', 'str', 'FK'),
      f('tipo', 'str'), f('periodo_id', 'str', 'FK'),
      f('docente_uid', 'str|null', 'FK'), f('codigo_verificacion', 'str'),
      f('fecha_generacion', 'ts'),
    ],
  },
}

// ── Relaciones (child → parent), agrupando FKs hacia el mismo destino ─────────
const rels = [
  ['usuarios', 'carreras', 'carrera_id'],
  ['carreras', 'usuarios', 'director_uid, coordinador_uid'],
  ['periodos_academicos', 'usuarios', 'creado_por, docentes_uid[]'],
  ['estructura_periodo_carrera', 'periodos_academicos', 'subcolección'],
  ['estructura_periodo_carrera', 'carreras', 'carrera_id'],
  ['estructura_periodo_carrera', 'usuarios', 'director/coordinador/docentes/admin'],
  ['distributivos', 'usuarios', 'docente_uid, aprobado_por, confirmado_por_docente'],
  ['distributivos', 'periodos_academicos', 'periodo_id'],
  ['actividades', 'usuarios', 'asignada_a_uid, asignada_por_uid'],
  ['actividades', 'carreras', 'carrera_id'],
  ['actividades', 'periodos_academicos', 'periodo_id'],
  ['horario_semanal', 'usuarios', 'docente_uid'],
  ['clasificaciones_ia', 'usuarios', 'docente_uid'],
  ['clasificaciones_ia', 'periodos_academicos', 'periodo_id'],
  ['feedback', 'clasificaciones_ia', 'clasificacion_id'],
  ['feedback', 'usuarios', 'docente_uid'],
  ['notificaciones', 'usuarios', 'destinatario_uid, docente_uid_ref'],
  ['reportes', 'usuarios', 'generado_por_uid, docente_uid'],
  ['reportes', 'periodos_academicos', 'periodo_id'],
]

// ── Layout / medidas ──────────────────────────────────────────────────────────
const ROW = 17, HEAD = 30, GHEAD = 17, PAD = 8

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

function entityHeight(e) {
  if (e.cols) {
    const colRows = e.cols.map(col => col.reduce((n, g) => n + 1 + g.fields.length, 0))
    return HEAD + Math.max(...colRows) * ROW + PAD * 2
  }
  return HEAD + e.fields.length * ROW + PAD
}

for (const e of Object.values(entities)) e.h = entityHeight(e)

function rowText(x, y, w, fld) {
  const color = fld.k === 'FK' ? C.fk : C.text
  const weight = fld.k === 'PK' ? '700' : '400'
  const style = fld.k === 'FK' ? 'italic' : 'normal'
  let badge = ''
  if (fld.k) {
    const bc = fld.k === 'PK' ? C.pk : C.fk
    badge = `<text x="${x + w - 12}" y="${y}" text-anchor="end" font-size="8.5" font-weight="700" fill="${bc}">${fld.k}</text>`
  }
  return `
    <text x="${x + 12}" y="${y}" font-size="11" font-weight="${weight}" font-style="${style}" fill="${color}">${esc(fld.n)}</text>
    <text x="${x + w - 34}" y="${y}" text-anchor="end" font-size="9.5" fill="${C.type}">${esc(fld.t)}</text>
    ${badge}`
}

function renderEntity(e) {
  const parts = []
  parts.push(`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="9" fill="${C.bg}" stroke="${e.color}" stroke-width="1.6"/>`)
  parts.push(`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${HEAD}" rx="9" fill="${e.color}"/>`)
  parts.push(`<rect x="${e.x}" y="${e.y + HEAD - 10}" width="${e.w}" height="10" fill="${e.color}"/>`)
  parts.push(`<text x="${e.x + e.w / 2}" y="${e.y + (e.subtitle ? 15 : 20)}" text-anchor="middle" font-size="${e.subtitle ? 11.5 : 13}" font-weight="700" fill="#FFFFFF">${esc(e.title)}</text>`)
  if (e.subtitle) parts.push(`<text x="${e.x + e.w / 2}" y="${e.y + 26}" text-anchor="middle" font-size="9" fill="#D6E4DC">${esc(e.subtitle)}</text>`)

  if (e.cols) {
    const colW = (e.w - PAD * 3) / 2
    e.cols.forEach((col, ci) => {
      let cy = e.y + HEAD + PAD + 11
      const cx = e.x + PAD + ci * (colW + PAD)
      for (const g of col) {
        parts.push(`<text x="${cx + 6}" y="${cy}" font-size="10" font-weight="700" fill="${e.color}">${esc(g.label)}</text>`)
        cy += GHEAD
        for (const fld of g.fields) { parts.push(rowText(cx, cy, colW, fld)); cy += ROW }
      }
    })
    // separador vertical entre columnas
    const mx = e.x + PAD + colW + PAD / 2
    parts.push(`<line x1="${mx}" y1="${e.y + HEAD + 4}" x2="${mx}" y2="${e.y + e.h - 6}" stroke="${C.border}" stroke-width="1"/>`)
  } else {
    let cy = e.y + HEAD + PAD + 8
    for (const fld of e.fields) { parts.push(rowText(e.x, cy, e.w, fld)); cy += ROW }
  }
  return parts.join('\n')
}

function clip(r, tx, ty) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2
  const dx = tx - cx, dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const sx = dx !== 0 ? (r.w / 2) / Math.abs(dx) : Infinity
  const sy = dy !== 0 ? (r.h / 2) / Math.abs(dy) : Infinity
  const s = Math.min(sx, sy)
  return { x: cx + dx * s, y: cy + dy * s }
}

function renderRel([from, to, label]) {
  const a = entities[from], b = entities[to]
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  const p1 = clip(a, bc.x, bc.y)
  const p2 = clip(b, ac.x, ac.y)
  const mx = p1.x + (p2.x - p1.x) * 0.5
  const my = p1.y + (p2.y - p1.y) * 0.5
  const lw = label.length * 5.6 + 8
  return `
    <line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="${C.line}" stroke-width="1.3" marker-end="url(#fk)"/>
    <circle cx="${p1.x.toFixed(1)}" cy="${p1.y.toFixed(1)}" r="2.6" fill="${C.line}"/>
    <rect x="${(mx - lw / 2).toFixed(1)}" y="${(my - 8).toFixed(1)}" width="${lw.toFixed(1)}" height="15" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.8"/>
    <text x="${mx.toFixed(1)}" y="${(my + 2.5).toFixed(1)}" text-anchor="middle" font-size="9" fill="#334155">${esc(label)}</text>`
}

// ── Canvas ────────────────────────────────────────────────────────────────────
const maxRight = Math.max(...Object.values(entities).map(e => e.x + e.w))
const maxBottom = Math.max(...Object.values(entities).map(e => e.y + e.h))
const W = maxRight + 60
const H = maxBottom + 150

const relSvg = rels.map(renderRel).join('\n')
const entSvg = Object.values(entities).map(renderEntity).join('\n')

const legendY = maxBottom + 50
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Arial, Helvetica, sans-serif">
  <defs>
    <marker id="fk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${C.line}"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="${W / 2}" y="40" text-anchor="middle" font-size="22" font-weight="700" fill="#001F5B">Esquema de la base de datos — UIDE Distributivo (Cloud Firestore)</text>
  <text x="${W / 2}" y="62" text-anchor="middle" font-size="13" fill="#6B7280">Modelo de documentos: colecciones, campos reales y referencias entre colecciones</text>

  <!-- relaciones primero (debajo de las entidades) -->
  ${relSvg}
  <!-- entidades -->
  ${entSvg}

  <!-- Leyenda -->
  <rect x="60" y="${legendY}" width="${W - 120}" height="64" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="80" y="${legendY + 24}" font-size="11.5" font-weight="700" fill="${C.pk}">PK</text>
  <text x="104" y="${legendY + 24}" font-size="11.5" fill="#374151">clave del documento (id)</text>
  <text x="300" y="${legendY + 24}" font-size="11.5" font-style="italic" font-weight="700" fill="${C.fk}">FK</text>
  <text x="324" y="${legendY + 24}" font-size="11.5" fill="#374151">referencia a otra colección</text>
  <line x1="560" y1="${legendY + 20}" x2="610" y2="${legendY + 20}" stroke="${C.line}" stroke-width="1.3" marker-end="url(#fk)"/>
  <circle cx="560" cy="${legendY + 20}" r="2.6" fill="${C.line}"/>
  <text x="620" y="${legendY + 24}" font-size="11.5" fill="#374151">relación (muchos → uno) hacia la colección referenciada</text>
  <text x="80" y="${legendY + 48}" font-size="10.5" fill="#6B7280">Tipos: str = texto · num = número · bool = booleano · ts = timestamp/fecha · str[] = arreglo · obj[]/map = anidado.  Firestore es NoSQL: las "FK" son referencias por id, sin integridad referencial impuesta por el motor.</text>
  <text x="80" y="${legendY + 62}" font-size="10.5" fill="#6B7280">Subcolección en verde. En distributivos, "Derivados (legacy)" se calculan a partir de los 4 bloques y se guardan por compatibilidad. clasificaciones_ia.evento_id es una referencia externa (fuera de alcance).</text>
</svg>
`

writeFileSync(path.join(DIR, 'erd-base-datos.svg'), svg, 'utf8')
console.log(`SVG generado: ${W}x${H}`)

// ── PNG de alta resolución (Playwright Chromium) ──────────────────────────────
const { chromium } = await import('playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: 'networkidle' })
await (await page.$('svg')).screenshot({ path: path.join(DIR, 'erd-base-datos.png') })
await browser.close()
console.log('PNG generado (scale 2)')
