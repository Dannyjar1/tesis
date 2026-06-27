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
import { CARRERAS_SEED, USUARIOS_SEED } from '../services/seedData'
import {
  DIAS_SEMANA, asignaturasDeDia, horasClaseDia, calcularTotales,
  normalizarDistributivo, GESTION_SUBCATS, VINCULACION_SUBCATS, INVESTIGACION_SUBCATS,
} from '../modules/distributivo/modeloDistributivo'

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

// ─────────────────────────────────────────────────────────────────────────────
// DISTRIBUTIVO INDIVIDUAL — réplica del formato oficial UIDE
// ("2026-Distributivo-Docente-base.xlsx"): blanco y negro, 4 bloques, horario
// semanal por día y bloque de 3 firmas.
// ─────────────────────────────────────────────────────────────────────────────

const NEGRO = '#000000'

/** Formatea horas como valor plano para las celdas de la tabla ('' si es 0). */
function fmtCelda(h) {
  const n = Number(h) || 0
  if (n === 0) return ''
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** Fecha larga en español con día con cero a la izquierda: "04 de mayo de 2026". */
function fechaLarga(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mes = date.toLocaleDateString('es-EC', { month: 'long' })
  return `${dd} de ${mes} de ${date.getFullYear()}`
}

/** Código del documento: GA-U-DDMMAAAA Distributivo <Apellido>. */
function codigoDocumento(docente, date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const ddmmaaaa = `${dd}${mm}${date.getFullYear()}`
  const apellido = (docente?.apellido?.trim().split(/\s+/)[0]) ||
    (docente?.nombre_completo?.trim().split(/\s+/).slice(-2, -1)[0]) ||
    (docente?.nombre_completo?.trim().split(/\s+/).pop()) || 'Docente'
  return `GA-U-${ddmmaaaa} Distributivo ${apellido}`
}

/** Resuelve carrera + firmantes (coordinador/director) desde los datos semilla,
 *  aplicando el overlay local de usuarios para reflejar ediciones (p. ej. el
 *  título académico) hechas en gestión de personal (modo mock). */
function resolverContexto(docente) {
  const carrera = CARRERAS_SEED.find(c => c.id === docente?.carrera_id) ?? null
  let overlay = {}
  try { overlay = JSON.parse(localStorage.getItem('uide_sistema_usuarios')) ?? {} } catch { overlay = {} }
  const buscar = (uid) => {
    const base = USUARIOS_SEED.find(u => u.uid === uid)
    if (!base) return null
    return { ...base, ...(overlay[uid] ?? {}) }
  }
  return {
    carrera,
    coordinador: carrera ? buscar(carrera.coordinador_uid) : null,
    director:    carrera ? buscar(carrera.director_uid) : null,
  }
}

/** Celda del horario para un día: líneas "Materia / HH:MM - HH:MM" por bloque. */
function celdaDiaAsignatura(asignaturas, diaId) {
  const bloques = asignaturasDeDia(asignaturas, diaId)
  if (bloques.length === 0) return { text: '', style: 'celdaDia' }
  const texto = []
  bloques.forEach((b, i) => {
    if (i > 0) texto.push({ text: '\n', fontSize: 4 })
    texto.push({ text: (b.materia || '—'), bold: true })
    texto.push({ text: `\n${b.inicio} - ${b.fin}` })
  })
  return { text: texto, style: 'celdaDia' }
}

/**
 * Genera el PDF del distributivo individual replicando el formato oficial UIDE.
 * @param {Object} distributivo
 * @param {Object} docente — { nombre_completo, apellido, tipo_contrato, carrera_id }
 * @param {Object} periodo — { id, nombre }
 * @param {string} generadoPorNombre  (no se imprime; el formato oficial usa firmas)
 * @returns {Promise<string>} código del documento generado
 */
export async function exportarDistributivoPDF(distributivo, docente, periodo, generadoPorNombre, opciones = {}) {
  const dist = normalizarDistributivo(distributivo) ?? {}
  const asignaturas = dist.asignaturas ?? []
  const t = calcularTotales(dist)
  const { carrera, coordinador, director } = resolverContexto(docente)
  const codigo = codigoDocumento(docente)

  const carreraNom = (carrera?.nombre ?? docente?.carrera ?? '—').toUpperCase()
  const facultadNom = carrera?.facultad ?? '—'
  // Texto literal de la plantilla oficial; fallback al nombre largo institucional.
  const facultadEscuelaPdf = carrera?.facultad_escuela_pdf ?? `${facultadNom} / ${carreraNom}`

  // Estructura por defecto de columnas: Nº | ACTIVIDAD | LUN..VIE | TOTAL
  const diasCols = DIAS_SEMANA.map(d => d.id)

  // Fila de subcategoría con valor único en la columna TOTAL.
  const filaValor = (num, label, valor) => ([
    { text: num, style: 'cNum' },
    { text: label, style: 'cAct' },
    ...diasCols.map(() => ({ text: '', style: 'cDia' })),
    { text: fmtCelda(valor), style: 'cTot' },
  ])

  // Fila de cabecera de bloque (en negrita) con el total del bloque.
  const filaBloque = (num, label, totalBloque) => ([
    { text: num, style: 'cNumB' },
    { text: label, style: 'cActB' },
    ...diasCols.map(() => ({ text: '', style: 'cDia' })),
    { text: fmtCelda(totalBloque), style: 'cTotB' },
  ])

  const headerRow = [
    { text: 'Nº', style: 'th' },
    { text: 'ACTIVIDAD', style: 'th', alignment: 'left' },
    ...DIAS_SEMANA.map(d => ({ text: d.label, style: 'th' })),
    { text: 'TOTAL', style: 'th' },
  ]

  // Fila 1.1 Asignatura con el horario por día.
  const filaAsignatura = [
    { text: '', style: 'cNum' },
    { text: '1.1 Asignatura', style: 'cAct' },
    ...diasCols.map(d => celdaDiaAsignatura(asignaturas, d)),
    { text: fmtCelda(t.horasClase), style: 'cTot' },
  ]

  // Fila TOTAL final: totales por día (solo horas de clase) + total general.
  const filaTotal = [
    { text: '', style: 'cNumB' },
    { text: 'TOTAL', style: 'cActB' },
    ...diasCols.map(d => ({ text: fmtCelda(horasClaseDia(asignaturas, d)), style: 'cTotB' })),
    { text: fmtCelda(t.total), style: 'cTotB' },
  ]

  const body = [
    headerRow,
    // 1. DOCENCIA
    filaBloque('1', 'DOCENCIA', t.docencia),
    filaAsignatura,
    filaValor('', '1.2 Tutorías (20% horas clase)', dist.horas_tutorias),
    filaValor('', '1.3 Otras actividades de docencia (20% horas clase)', dist.horas_otras_docencia),
    // 2. INVESTIGACIÓN
    filaBloque('2', 'INVESTIGACIÓN', t.investigacion),
    ...INVESTIGACION_SUBCATS.map(s => filaValor('', `${s.num} ${s.label}`, dist[s.key])),
    // 3. VINCULACIÓN CON LA SOCIEDAD
    filaBloque('3', 'VINCULACIÓN CON LA SOCIEDAD', t.vinculacion),
    ...VINCULACION_SUBCATS.map(s => filaValor('', `${s.num} ${s.label} (${s.min}-${s.max}h)`, dist[s.key])),
    // 4. GESTIÓN ACADÉMICA
    filaBloque('4', 'GESTIÓN ACADÉMICA', t.gestion),
    ...GESTION_SUBCATS.map(s => filaValor('', `${s.num} ${s.label}`, dist[s.key])),
    // TOTAL
    filaTotal,
  ]

  // Encabezado (datos del documento)
  const filaDato = (label, valor) => ([
    { text: label, bold: true, fontSize: 8, margin: [0, 1, 6, 1] },
    { text: valor, fontSize: 8, margin: [0, 1, 0, 1] },
  ])

  // Nombre con título académico opcional: "Mgs. Lorena Conde" o solo el nombre.
  const conTitulo = (persona) => {
    const nombre = persona?.nombre_completo
    if (!nombre) return '—'
    const titulo = persona?.titulo_academico?.trim()
    return titulo ? `${titulo} ${nombre}` : nombre
  }

  // Bloque de firmas (3 columnas)
  const firma = (rotulo, persona, cargo) => ({
    stack: [
      { text: rotulo, bold: true, fontSize: 8, margin: [0, 0, 0, 26] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.7, lineColor: NEGRO }] },
      { text: conTitulo(persona), fontSize: 8, bold: true, margin: [0, 3, 0, 0] },
      { text: cargo, fontSize: 7, margin: [0, 1, 0, 0] },
      { text: carreraNom, fontSize: 7, margin: [0, 1, 0, 0] },
    ],
    width: '*',
  })

  const docDef = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [28, 28, 28, 28],
    content: [
      {
        columns: [
          { text: 'DISTRIBUTIVO INDIVIDUAL DE CARGA HORARIO', bold: true, fontSize: 13, alignment: 'left' },
          { text: codigo, fontSize: 8, alignment: 'right', margin: [0, 3, 0, 0] },
        ],
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ['auto', '*'],
          body: [
            filaDato('FECHA:', fechaLarga()),
            filaDato('LUGAR:', 'UIDE - LOJA'),
            filaDato('FACULTAD / ESCUELA:', facultadEscuelaPdf),
            filaDato('PERÍODO:', periodo?.nombre ?? '—'),
            filaDato('NOMBRE DEL DOCENTE:', (docente?.nombre_completo ?? '—').toUpperCase()),
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: [20, 175, '*', '*', '*', '*', '*', 38],
          body,
        },
        layout: {
          hLineColor: () => NEGRO,
          vLineColor: () => NEGRO,
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
        },
      },
      opciones.observaciones?.trim()
        ? { text: `Observaciones: ${opciones.observaciones.trim()}`, fontSize: 8, margin: [0, 10, 0, 0] }
        : { text: '' },
      {
        columns: [
          firma('Elaborado por:', docente, 'DOCENTE DE LA CARRERA'),
          firma('Revisado por:', coordinador, 'COORDINADOR ACADÉMICO DE LA CARRERA'),
          firma('Aprobado por:', director, 'DIRECTORA/DIRECTOR DE LA CARRERA DE'),
        ],
        columnGap: 24,
        margin: [0, 28, 0, 0],
      },
    ],
    styles: {
      th: { bold: true, fontSize: 8, alignment: 'center', margin: [2, 4, 2, 4] },
      cNum:  { fontSize: 8, alignment: 'center', margin: [2, 3, 2, 3] },
      cAct:  { fontSize: 8, margin: [3, 3, 3, 3] },
      cDia:  { fontSize: 7, alignment: 'center', margin: [2, 3, 2, 3] },
      cTot:  { fontSize: 8, alignment: 'center', margin: [2, 3, 2, 3] },
      cNumB: { fontSize: 8, bold: true, alignment: 'center', margin: [2, 3, 2, 3] },
      cActB: { fontSize: 8, bold: true, margin: [3, 3, 3, 3] },
      cTotB: { fontSize: 8, bold: true, alignment: 'center', margin: [2, 3, 2, 3] },
      celdaDia: { fontSize: 7, alignment: 'center', margin: [2, 3, 2, 3] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 8, color: NEGRO },
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

/**
 * Reporte semestral de cumplimiento de ACTIVIDADES por docente: actividades
 * completadas vs asignadas por categoría CES, con las evidencias adjuntas.
 * @param {Object[]} docentesData — [{ docente_nombre, totalAsignadas, totalCompletadas,
 *   categorias: [{ categoria, asignadas, completadas }], evidencias: [{ titulo, categoria, url }] }]
 * @param {Object} periodo
 * @param {string} generadoPorNombre
 * @returns {Promise<string>} código de verificación
 */
export async function exportarReporteActividadesPDF(docentesData, periodo, generadoPorNombre, opciones = {}) {
  const codigo = codigoVerificacion(periodo?.id, 'ACTIVIDADES')
  const tituloDoc = opciones.encabezado?.trim() || 'REPORTE SEMESTRAL DE CUMPLIMIENTO DE ACTIVIDADES'

  const [templateBase64, qrBase64] = await Promise.all([
    urlABase64(templateUrl),
    generarQR(`https://uide.edu.ec/verificar?codigo=${codigo}`),
  ])
  const ahora = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })

  const totalAsig = docentesData.reduce((s, d) => s + d.totalAsignadas, 0)
  const totalComp = docentesData.reduce((s, d) => s + d.totalCompletadas, 0)
  const pctGlobal = totalAsig > 0 ? Math.round((totalComp / totalAsig) * 100) : 0

  const bloquesDocente = docentesData.flatMap((d, idx) => {
    const pct = d.totalAsignadas > 0 ? Math.round((d.totalCompletadas / d.totalAsignadas) * 100) : 0
    const headerCat = [
      { text: 'CATEGORÍA CES', style: 'thTabla' },
      { text: 'ASIGNADAS',  style: 'thTabla', alignment: 'center' },
      { text: 'COMPLETADAS', style: 'thTabla', alignment: 'center' },
      { text: '% CUMPL.',   style: 'thTabla', alignment: 'center' },
    ]
    const filasCat = d.categorias.map((c, i) => {
      const bg = i % 2 === 0 ? C.blanco : C.grisClaro
      const p  = c.asignadas > 0 ? Math.round((c.completadas / c.asignadas) * 100) : 0
      return [
        { text: c.categoria, fontSize: 9, color: C.grisTexto, fillColor: bg, margin: [8, 5, 8, 5] },
        { text: String(c.asignadas), fontSize: 9, alignment: 'center', fillColor: bg, margin: [8, 5, 8, 5] },
        { text: String(c.completadas), fontSize: 9, alignment: 'center', fillColor: bg, margin: [8, 5, 8, 5] },
        { text: `${p}%`, fontSize: 9, bold: true, alignment: 'center', color: p >= 80 ? C.verde : C.rojo, fillColor: bg, margin: [8, 5, 8, 5] },
      ]
    })

    const evidencias = d.evidencias.length > 0
      ? {
          ul: d.evidencias.map(e => ({
            text: [
              { text: `${e.titulo} `, fontSize: 8, color: C.grisTexto },
              { text: `(${e.categoria})`, fontSize: 7, color: C.grisSubtxt },
              e.url ? { text: ` — ver evidencia`, fontSize: 8, color: C.vino, link: e.url, decoration: 'underline' } : { text: '' },
            ],
            margin: [0, 1, 0, 1],
          })),
          margin: [0, 4, 0, 0],
        }
      : { text: 'Sin evidencias adjuntas.', fontSize: 8, italics: true, color: C.grisSubtxt, margin: [0, 4, 0, 0] }

    return [
      idx > 0 ? separador(C.grisBorde, 0.5, [0, 6, 0, 10]) : { text: '' },
      {
        columns: [
          { text: d.docente_nombre, fontSize: 10, bold: true, color: C.vinoOscuro },
          { text: `${d.totalCompletadas}/${d.totalAsignadas} · ${pct}%`, fontSize: 9, bold: true, alignment: 'right', color: pct >= 80 ? C.verde : C.rojo },
        ],
        margin: [0, 0, 0, 6],
      },
      {
        table: { headerRows: 1, widths: ['*', 70, 70, 60], body: [headerCat, ...filasCat] },
        layout: {
          hLineColor: () => C.grisBorde, vLineColor: () => C.grisBorde,
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.5,
          vLineWidth: () => 0.5,
        },
        margin: [0, 0, 0, 4],
      },
      { text: 'Evidencias:', fontSize: 8, bold: true, color: C.grisSubtxt, margin: [0, 2, 0, 0] },
      evidencias,
      d.nota?.trim()
        ? { text: `Nota del director: ${d.nota.trim()}`, fontSize: 8, italics: true, color: C.grisTexto, margin: [0, 3, 0, 0] }
        : { text: '' },
    ]
  })

  const docDef = {
    pageSize: 'A4',
    pageMargins: [55, 145, 55, 118],
    background: templateBase64
      ? (currentPage, pageSize) => ({ image: templateBase64, width: pageSize.width, height: pageSize.height, absolutePosition: { x: 0, y: 0 } })
      : undefined,
    content: [
      { text: tituloDoc, fontSize: 12, bold: true, color: C.vino, alignment: 'center', margin: [0, 0, 0, 3] },
      { text: `Período: ${periodo?.nombre ?? '—'}   ·   ${ahora}`, fontSize: 7, color: C.grisSubtxt, alignment: 'center', margin: [0, 0, 0, 14] },
      {
        columns: [
          kpiBox('Docentes',           String(docentesData.length), C.grisTexto),
          kpiBox('Actividades asign.', String(totalAsig),           C.grisTexto),
          kpiBox('Completadas',        String(totalComp),           C.verde),
          kpiBox('Cumplimiento',       `${pctGlobal}%`,             pctGlobal >= 80 ? C.verde : C.rojo),
        ],
        columnGap: 10,
        margin: [0, 0, 0, 16],
      },
      opciones.observaciones?.trim()
        ? {
            stack: [
              { text: 'OBSERVACIONES DEL DIRECTOR', fontSize: 9, bold: true, color: C.vinoOscuro, margin: [0, 0, 0, 4] },
              { text: opciones.observaciones.trim(), fontSize: 9, color: C.grisTexto },
            ],
            margin: [0, 0, 0, 14],
          }
        : { text: '' },
      ...bloquesDocente,
      separador(C.grisBorde, 0.5, [0, 6, 0, 10]),
      bloqueAuditoriaCACES(codigo, generadoPorNombre, periodo?.nombre ?? '—', qrBase64),
    ],
    styles: STYLES,
    defaultStyle: DEFAULT_STYLE,
  }

  const filename = `reporte_actividades_${periodo?.id ?? ''}.pdf`
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
