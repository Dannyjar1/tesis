/**
 * Generación de reportes PDF institucionales con pdfmake.
 * Estrategia: la imagen del formato institucional UIDE se usa como fondo
 * de página completa (background). El contenido se escribe encima dentro
 * de los márgenes del área blanca (entre logo y pie de página).
 * Referencia: RF-018, RN-007, RN-017.
 *
 * pdfmake 0.3.x: fuentes registradas con addVirtualFileSystem(vfs).
 */
import pdfMakeLib    from 'pdfmake/build/pdfmake'
import vfs           from 'pdfmake/build/vfs_fonts'
import templateUrl    from '../assets/NUEVO FORMATO INSTITUCIONAL_page-0001.jpg'
import { TIPOS_CONTRATO } from './constants'

pdfMakeLib.addVirtualFileSystem(vfs)

if (!vfs || !Object.keys(vfs).length) {
  console.error('[exportPDF] VFS vacío — fuentes de pdfmake no cargadas. Ejecuta: npm run dev -- --force')
}

const getPdfMake = () => pdfMakeLib

// ── Paleta de colores UIDE ────────────────────────────────────────────────────
const C = {
  vino:      '#9B1A3E',
  vinoOscuro:'#7A1030',
  grisClaro: '#F5F5F5',
  grisBorde: '#D1D5DB',
  grisTexto: '#374151',
  grisSubtxt:'#6B7280',
  verde:     '#059669',
  rojo:      '#DC2626',
  blanco:    '#FFFFFF',
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatH(h) {
  if (h === null || h === undefined) return '—'
  const ent = Math.floor(h)
  const min = Math.round((h - ent) * 60)
  return min === 0 ? `${ent}h` : `${ent}h ${min}min`
}

function codigoVerificacion(periodoId, docenteNombre) {
  const ini = (docenteNombre ?? '')
    .split(' ').filter(p => p.length > 2).slice(0, 3)
    .map(p => p[0].toUpperCase()).join('')
  const ts = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14)
  return `UIDE-${(periodoId ?? '').replace('-', '')}-${ini}-${ts}`
}

async function urlABase64(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const b = await r.blob()
    return await new Promise(res => {
      const rd = new FileReader()
      rd.onloadend = () => res(rd.result)
      rd.onerror   = () => res(null)
      rd.readAsDataURL(b)
    })
  } catch { return null }
}

async function generarQR(texto) {
  try {
    const mod = await import('qrcode')
    const QRCode = mod.default ?? mod
    return await QRCode.toDataURL(texto, {
      width: 80, margin: 1,
      color: { dark: C.vino, light: '#FFFFFF' },
    })
  } catch { return null }
}

// pdfmake 0.3.x: getBlob() es async, ya no acepta callback
function descargarBlob(docDef, filename) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('El PDF tardó demasiado. Recarga la página e inténtalo de nuevo.')),
      20_000,
    )
  )
  const generate = async () => {
    const blob = await getPdfMake().createPdf(docDef).getBlob()
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  return Promise.race([generate(), timeout])
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOQUES DE CONTENIDO
// (el header y footer vienen de la imagen de fondo — no se construyen aquí)
// ─────────────────────────────────────────────────────────────────────────────

function separador(color = C.grisBorde, grosor = 0.5, margin = [0, 0, 0, 12]) {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: grosor, lineColor: color }],
    margin,
  }
}

// ── Ficha de datos del docente ────────────────────────────────────────────────
function fichaDocente(docente, distributivo, periodo) {
  const hc          = TIPOS_CONTRATO[docente?.tipo_contrato]?.horas ?? 40
  const contratoNom = TIPOS_CONTRATO[docente?.tipo_contrato]?.nombre ?? '—'

  const filas = [
    ['Docente:',             docente?.nombre_completo ?? '—'],
    ['Tipo de contrato:',    `${contratoNom} (${hc}h/semana)`],
    ['Carrera / Unidad:',    docente?.carrera ?? '—'],
    ['Período académico:',   periodo?.nombre ?? '—'],
    ['Categoría escalafón:', docente?.categoria_escalafon ?? '—'],
    ['Estado:',              (distributivo?.estado ?? '—').toUpperCase()],
  ]

  return {
    table: {
      widths: [145, '*'],
      body: [
        [
          {
            text: 'DATOS DEL DOCENTE', colSpan: 2,
            fontSize: 9, bold: true, color: C.blanco, fillColor: C.vino,
            margin: [8, 7, 8, 7], border: [true, true, true, true],
          },
          {},
        ],
        ...filas.map(([label, valor], i) => [
          {
            text: label, fontSize: 8, bold: true, color: C.grisSubtxt,
            fillColor: i % 2 === 0 ? C.grisClaro : C.blanco,
            margin: [8, 5, 8, 5], border: [true, false, true, false],
          },
          {
            text: valor, fontSize: 9, color: C.grisTexto,
            fillColor: i % 2 === 0 ? C.grisClaro : C.blanco,
            margin: [8, 5, 8, 5], border: [true, false, true, false],
          },
        ]),
      ],
    },
    layout: {
      hLineColor: () => C.grisBorde,
      vLineColor: () => C.grisBorde,
      hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
      vLineWidth: () => 0.5,
    },
    margin: [0, 0, 0, 14],
  }
}

// ── Tabla: Categoría CES | Actividad | Horas ──────────────────────────────────
function tablaActividades(distributivo) {
  const FILAS = [
    { cat: 'Docencia',              actividad: 'Docencia directa',               key: 'horas_docencia_directa' },
    { cat: 'Docencia',              actividad: 'Dirección / Tribunal titulación', key: 'horas_titulacion' },
    { cat: 'Tutoría y preparación', actividad: 'Preparación de clases',           key: 'horas_preparacion' },
    { cat: 'Tutoría y preparación', actividad: 'Tutoría académica',               key: 'horas_tutoria' },
    { cat: 'Investigación',         actividad: 'Investigación',                   key: 'horas_investigacion' },
    { cat: 'Vinculación',           actividad: 'Vinculación con la Sociedad',     key: 'horas_vinculacion' },
    { cat: 'Gestión Institucional', actividad: 'Gestión institucional',           key: 'horas_gestion' },
    { cat: 'Gestión Institucional', actividad: 'Reducción cargo directivo',       key: 'horas_reduccion_cargo' },
  ].filter(f => (distributivo[f.key] ?? 0) > 0)

  const total         = distributivo.total_horas ?? 0
  const horasContrato = TIPOS_CONTRATO[distributivo.tipo_contrato]?.horas ?? 40
  const esValido      = Math.abs(total - horasContrato) < 0.01

  const headerRow = [
    { text: 'CATEGORÍA CES', style: 'thTabla' },
    { text: 'ACTIVIDAD',     style: 'thTabla' },
    { text: 'HORAS/SEM.',    style: 'thTabla', alignment: 'center' },
  ]

  const bodyRows = FILAS.map(({ cat, actividad, key }, i) => {
    const h  = distributivo[key] ?? 0
    const bg = i % 2 === 0 ? C.blanco : C.grisClaro
    return [
      { text: cat,        fontSize: 9, color: C.grisTexto, fillColor: bg, margin: [8, 6, 8, 6] },
      { text: actividad,  fontSize: 9, color: C.grisTexto, fillColor: bg, margin: [8, 6, 8, 6] },
      { text: formatH(h), fontSize: 10, bold: true, alignment: 'center', color: C.vino, fillColor: bg, margin: [8, 6, 8, 6] },
    ]
  })

  const totalRow = [
    { text: 'TOTAL', colSpan: 2, fontSize: 10, bold: true, color: C.blanco, fillColor: C.vinoOscuro, margin: [8, 8, 8, 8] },
    {},
    { text: `${total}h`, fontSize: 12, bold: true, alignment: 'center', color: esValido ? C.verde : C.rojo, fillColor: '#F9EEF2', margin: [8, 8, 8, 8] },
  ]

  return {
    table: {
      headerRows: 1,
      widths: [155, '*', 85],
      body: [headerRow, ...bodyRows, totalRow],
    },
    layout: {
      hLineColor: () => C.grisBorde,
      vLineColor: () => C.grisBorde,
      hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.5,
      vLineWidth: () => 0.5,
    },
    margin: [0, 0, 0, 5],
  }
}

function notaValidacion(distributivo) {
  const horasContrato = TIPOS_CONTRATO[distributivo.tipo_contrato]?.horas ?? 40
  const total         = distributivo.total_horas ?? 0
  const esValido      = Math.abs(total - horasContrato) < 0.01
  return {
    text: esValido
      ? `Válido — suma exactamente ${horasContrato}h semanales (Reglamento CES 2021, Art. 6)`
      : `Inválido — suma ${total}h; diferencia de ${Math.abs(horasContrato - total).toFixed(1)}h respecto al contrato`,
    fontSize: 8,
    color: esValido ? C.verde : C.rojo,
    margin: [0, 0, 0, 16],
  }
}

// ── Validación cruzada con líneas de firma ────────────────────────────────────
function bloqueValidacionCruzada() {
  const firmaFila = (label) => ({
    stack: [
      { text: label, fontSize: 8.5, bold: true, color: C.grisSubtxt, margin: [0, 0, 0, 18] },
      {
        columns: [
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 248, y2: 0, lineWidth: 0.8, lineColor: C.grisTexto }] },
              { text: 'Firma y nombre', fontSize: 7, color: C.grisSubtxt, margin: [0, 3, 0, 0] },
            ],
          },
          {
            stack: [
              { text: 'Fecha:', fontSize: 8, bold: true, color: C.grisSubtxt, margin: [0, 0, 0, 3] },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 110, y2: 0, lineWidth: 0.8, lineColor: C.grisTexto }] },
            ],
            width: 145,
          },
        ],
        columnGap: 14,
      },
    ],
    margin: [0, 0, 0, 24],
  })

  return {
    stack: [
      { text: 'VALIDACIÓN CRUZADA', fontSize: 10, bold: true, color: C.vino, margin: [0, 0, 0, 14] },
      firmaFila('Directora de Carrera:'),
      firmaFila('Docente Propietario:'),
    ],
  }
}

// ── Código CACES + QR ─────────────────────────────────────────────────────────
function bloqueAuditoriaCACES(codigo, generadoPorNombre, periodoNombre, qrBase64) {
  const ahora = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })
  return {
    table: {
      widths: ['*', 'auto'],
      body: [[
        {
          stack: [
            { text: 'Código de verificación CACES:', fontSize: 7.5, bold: true, color: C.grisSubtxt },
            { text: codigo, fontSize: 8, color: C.vino, margin: [0, 2, 0, 6] },
            { text: `Generado: ${ahora}`, fontSize: 8, color: C.grisTexto },
            { text: `Por: ${generadoPorNombre}`, fontSize: 8, color: C.grisTexto, margin: [0, 1, 0, 0] },
            { text: `Período: ${periodoNombre}`, fontSize: 8, color: C.grisTexto, margin: [0, 1, 0, 0] },
          ],
          border: [false, false, false, false],
        },
        qrBase64
          ? {
              stack: [
                { image: qrBase64, width: 58, alignment: 'right' },
                { text: 'Escanear para verificar', fontSize: 6, color: C.grisSubtxt, alignment: 'right', margin: [0, 2, 0, 0] },
              ],
              border: [false, false, false, false],
            }
          : { text: '', border: [false, false, false, false] },
      ]],
    },
    layout: 'noBorders',
  }
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const STYLES = {
  thTabla: { fontSize: 8.5, bold: true, color: '#FFFFFF', fillColor: C.vino, margin: [8, 8, 8, 8] },
}
const DEFAULT_STYLE = { font: 'Roboto', fontSize: 9 }

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTACIONES PRINCIPALES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera el PDF del distributivo individual usando la plantilla institucional UIDE como fondo.
 * @param {Object} distributivo
 * @param {Object} docente  — { nombre_completo, tipo_contrato, carrera, categoria_escalafon }
 * @param {Object} periodo  — { id, nombre, fecha_inicio, fecha_fin }
 * @param {string} generadoPorNombre
 * @returns {Promise<string>} código de verificación
 */
export async function exportarDistributivoPDF(distributivo, docente, periodo, generadoPorNombre) {
  const codigo = codigoVerificacion(periodo?.id, docente?.nombre_completo ?? '')

  // Cargamos la plantilla institucional y el QR en paralelo
  const [templateBase64, qrBase64] = await Promise.all([
    urlABase64(templateUrl),
    generarQR(`https://uide.edu.ec/verificar?codigo=${codigo}`),
  ])

  const docDef = {
    pageSize:    'A4',
    // Márgenes ajustados al área blanca de la plantilla:
    //   top    → deja libre el logo UIDE centrado
    //   bottom → deja libre "REINVENTEMOS EL FUTURO" + barra vino
    pageMargins: [55, 145, 55, 118],

    // La plantilla UIDE cubre toda la página (logo + fondo + footer)
    background: templateBase64
      ? (currentPage, pageSize) => ({
          image: templateBase64,
          width:  pageSize.width,
          height: pageSize.height,
          absolutePosition: { x: 0, y: 0 },
        })
      : undefined,

    content: [
      // Título del documento
      { text: 'DISTRIBUTIVO ACADÉMICO', fontSize: 14, bold: true, color: C.vino, alignment: 'center', margin: [0, 0, 0, 3] },
      { text: 'Reglamento CES 2021 (RPC-SE-19-No.055-2021) — Arts. 6, 7 y 8', fontSize: 7, color: C.grisSubtxt, alignment: 'center', margin: [0, 0, 0, 16] },

      // Datos del docente
      fichaDocente(docente, distributivo, periodo),

      // Tabla de actividades
      { text: 'DISTRIBUCIÓN DE ACTIVIDADES SEMANALES', fontSize: 9, bold: true, color: C.vinoOscuro, margin: [0, 0, 0, 7] },
      tablaActividades({ ...distributivo, tipo_contrato: docente?.tipo_contrato }),
      notaValidacion({ ...distributivo, tipo_contrato: docente?.tipo_contrato }),

      // Firmas de validación cruzada
      separador(C.grisBorde, 0.5, [0, 0, 0, 14]),
      bloqueValidacionCruzada(),

      // Código CACES
      separador(C.grisBorde, 0.5, [0, 0, 0, 10]),
      bloqueAuditoriaCACES(codigo, generadoPorNombre, periodo?.nombre ?? '—', qrBase64),
    ],

    styles: STYLES,
    defaultStyle: DEFAULT_STYLE,
  }

  const filename = `distributivo_${(docente?.nombre_completo ?? 'docente').replace(/\s+/g, '_')}_${periodo?.id ?? ''}.pdf`
  await descargarBlob(docDef, filename)
  return codigo
}

/**
 * Genera el PDF del reporte de carrera usando la plantilla institucional UIDE como fondo.
 * @param {Object[]} docentesData  — [{ docente, distributivo }]
 * @param {Object} periodo
 * @param {string} generadoPorNombre
 * @returns {Promise<string>} código de verificación
 */
export async function exportarReporteCarreraPDF(docentesData, periodo, generadoPorNombre) {
  const codigo = codigoVerificacion(periodo?.id, 'CARRERA')

  const [templateBase64, qrBase64] = await Promise.all([
    urlABase64(templateUrl),
    generarQR(`https://uide.edu.ec/verificar?codigo=${codigo}`),
  ])

  const ahora      = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })
  const aprobados  = docentesData.filter(d => d.distributivo?.estado === 'aprobado').length
  const sinAsignar = docentesData.filter(d => !d.distributivo).length
  const promedio   = docentesData.length > 0
    ? Math.round(docentesData.reduce((s, { docente, distributivo }) => {
        const hc = TIPOS_CONTRATO[docente?.tipo_contrato]?.horas ?? 40
        return s + (distributivo ? (distributivo.total_horas / hc) * 100 : 0)
      }, 0) / docentesData.length)
    : 0

  const headerDocentes = [
    { text: 'DOCENTE',      style: 'thTabla' },
    { text: 'CONTRATO',     style: 'thTabla', alignment: 'center' },
    { text: 'HORAS',        style: 'thTabla', alignment: 'center' },
    { text: 'CUMPLIMIENTO', style: 'thTabla', alignment: 'center' },
    { text: 'ESTADO',       style: 'thTabla', alignment: 'center' },
  ]

  const filasDocentes = docentesData.map(({ docente, distributivo }, i) => {
    const hc           = TIPOS_CONTRATO[docente?.tipo_contrato]?.horas ?? 40
    const cumplimiento = distributivo ? Math.round((distributivo.total_horas / hc) * 100) : 0
    const bg           = i % 2 === 0 ? C.blanco : C.grisClaro
    return [
      { text: docente?.nombre_completo ?? '—', fontSize: 9, fillColor: bg, margin: [8, 6, 8, 6] },
      { text: `${TIPOS_CONTRATO[docente?.tipo_contrato]?.nombre ?? '—'} (${hc}h)`, fontSize: 8, alignment: 'center', fillColor: bg, margin: [8, 6, 8, 6] },
      { text: distributivo ? `${distributivo.total_horas}h` : '—', fontSize: 9, bold: true, alignment: 'center', fillColor: bg, margin: [8, 6, 8, 6] },
      { text: `${cumplimiento}%`, fontSize: 10, bold: true, alignment: 'center', color: cumplimiento >= 80 ? C.verde : C.rojo, fillColor: bg, margin: [8, 6, 8, 6] },
      { text: (distributivo?.estado ?? 'Sin asignar').toUpperCase(), fontSize: 7, bold: true, alignment: 'center', color: distributivo?.estado === 'aprobado' ? C.verde : C.grisSubtxt, fillColor: bg, margin: [8, 6, 8, 6] },
    ]
  })

  const docDef = {
    pageSize:    'A4',
    pageMargins: [55, 145, 55, 118],

    background: templateBase64
      ? (currentPage, pageSize) => ({
          image: templateBase64,
          width:  pageSize.width,
          height: pageSize.height,
          absolutePosition: { x: 0, y: 0 },
        })
      : undefined,

    content: [
      { text: 'REPORTE DE CUMPLIMIENTO — CARRERA', fontSize: 13, bold: true, color: C.vino, alignment: 'center', margin: [0, 0, 0, 3] },
      { text: `Período: ${periodo?.nombre ?? '—'}   ·   ${ahora}`, fontSize: 7, color: C.grisSubtxt, alignment: 'center', margin: [0, 0, 0, 16] },

      // KPIs
      {
        columns: [
          kpiBox('Total docentes',        String(docentesData.length), C.grisTexto),
          kpiBox('Aprobados',             String(aprobados),           C.verde),
          kpiBox('Sin asignar',           String(sinAsignar),          C.grisSubtxt),
          kpiBox('Cumplimiento promedio', `${promedio}%`,              promedio >= 80 ? C.verde : C.rojo),
        ],
        columnGap: 10,
        margin: [0, 0, 0, 16],
      },

      { text: 'ESTADO POR DOCENTE', fontSize: 9, bold: true, color: C.vinoOscuro, margin: [0, 0, 0, 7] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 120, 58, 78, 78],
          body: [headerDocentes, ...filasDocentes],
        },
        layout: {
          hLineColor: () => C.grisBorde,
          vLineColor: () => C.grisBorde,
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.5,
          vLineWidth: () => 0.5,
        },
        margin: [0, 0, 0, 18],
      },

      separador(C.grisBorde, 0.5, [0, 0, 0, 10]),
      bloqueAuditoriaCACES(codigo, generadoPorNombre, periodo?.nombre ?? '—', qrBase64),
    ],

    styles: STYLES,
    defaultStyle: DEFAULT_STYLE,
  }

  const filename = `reporte_carrera_${periodo?.id ?? ''}.pdf`
  await descargarBlob(docDef, filename)
  return codigo
}

function kpiBox(label, valor, color) {
  return {
    table: {
      widths: ['*'],
      body: [[{
        stack: [
          { text: valor, fontSize: 20, bold: true, color, alignment: 'center' },
          { text: label, fontSize: 7, color: C.grisSubtxt, alignment: 'center', margin: [0, 3, 0, 0] },
        ],
        fillColor: C.grisClaro,
        margin: [0, 10, 0, 10],
        border: [true, true, true, true],
      }]],
    },
    layout: { hLineColor: () => C.grisBorde, vLineColor: () => C.grisBorde },
  }
}
