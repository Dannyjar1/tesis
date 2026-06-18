/**
 * Servicio de reportes — implementación mock (localStorage + pdfmake/SheetJS).
 * Sprint Firebase: el historial de reportes se guardaría en Firestore /reportes.
 * Referencia: RF-018, RN-007, RN-017.
 */
import { exportarDistributivoPDF, exportarReporteCarreraPDF, exportarReporteActividadesPDF } from '../utils/exportPDF'
import { getDistributivosPorPeriodo, getDocentes } from './distributivoService'
import { getActividadesDirector, estadoEfectivo } from './actividadesService'
import { TIPOS_CONTRATO, CATEGORIA_LABELS, ESTADOS_ACTIVIDAD } from '../utils/constants'

const KEY_HISTORIAL = (uid) => `uide_reportes_${uid}`

function leerHistorial(uid) {
  const r = localStorage.getItem(KEY_HISTORIAL(uid))
  return r ? JSON.parse(r) : []
}
function guardarHistorial(uid, lista) {
  localStorage.setItem(KEY_HISTORIAL(uid), JSON.stringify(lista))
}

function registrarReporte(uid, tipo, periodoId, codigoVerif, docenteUid = null) {
  const historial = leerHistorial(uid)
  historial.unshift({
    id:               `rep_${Date.now()}`,
    generado_por_uid: uid,
    tipo,
    periodo_id:       periodoId,
    docente_uid:      docenteUid,
    codigo_verificacion: codigoVerif,
    fecha_generacion: new Date().toISOString(),
  })
  guardarHistorial(uid, historial.slice(0, 20)) // max 20 reportes en historial
}

/**
 * Genera y descarga reporte PDF individual de un docente.
 * @param {{ periodoId, docenteUid, generadoPorUid, generadoPorNombre, periodo }} filtros
 */
export async function generarReportePDFIndividual(filtros) {
  const { periodoId, docenteUid, generadoPorUid, generadoPorNombre, periodo } = filtros
  const docentes = await getDocentes()
  const docente  = docentes.find(d => d.uid === docenteUid)
  if (!docente) throw new Error('Docente no encontrado.')

  const distributivos = await getDistributivosPorPeriodo(periodoId)
  const distributivo  = distributivos.find(d => d.docente_uid === docenteUid)
  if (!distributivo) throw new Error('El docente no tiene distributivo asignado en este período.')

  const codigoVerif = await exportarDistributivoPDF(distributivo, docente, periodo, generadoPorNombre)
  registrarReporte(generadoPorUid, 'cumplimiento_individual', periodoId, codigoVerif, docenteUid)
  return codigoVerif
}

/**
 * Genera y descarga reporte PDF general de todos los docentes de la carrera.
 * @param {{ periodoId, generadoPorUid, generadoPorNombre, periodo }} filtros
 */
export async function generarReportePDFCarrera(filtros) {
  const { periodoId, generadoPorUid, generadoPorNombre, periodo } = filtros
  const docentes = await getDocentes()
  const distributivos = await getDistributivosPorPeriodo(periodoId)

  const docentesData = docentes.map(d => ({
    docente:      d,
    distributivo: distributivos.find(x => x.docente_uid === d.uid) ?? null,
  }))

  const codigoVerif = await exportarReporteCarreraPDF(docentesData, periodo, generadoPorNombre)
  registrarReporte(generadoPorUid, 'cumplimiento_carrera', periodoId, codigoVerif)
  return codigoVerif
}

/**
 * Genera y descarga reporte Excel de cumplimiento.
 * @param {{ periodoId, generadoPorUid, periodo }} filtros
 */
export async function generarReporteExcel(filtros) {
  const { periodoId, generadoPorUid, periodo: _periodo } = filtros
  const XLSX = await import('xlsx')
  const docentes = await getDocentes()
  const distributivos = await getDistributivosPorPeriodo(periodoId)

  const filas = docentes.map(d => {
    const dist = distributivos.find(x => x.docente_uid === d.uid)
    const horasContrato = TIPOS_CONTRATO[d.tipo_contrato]?.horas ?? 40
    return {
      'Docente':             d.nombre_completo,
      'Tipo contrato':       d.tipo_contrato,
      'Horas contrato':      horasContrato,
      'Horas asignadas':     dist?.total_horas ?? 0,
      'Cumplimiento (%)':    dist ? Math.round((dist.total_horas / horasContrato) * 100) : 0,
      'Estado':              dist?.estado ?? 'Sin asignar',
      'Docencia directa':    dist?.horas_docencia_directa ?? 0,
      'Preparación':         dist?.horas_preparacion ?? 0,
      'Tutoría':             dist?.horas_tutoria ?? 0,
      'Investigación':       dist?.horas_investigacion ?? 0,
      'Vinculación':         dist?.horas_vinculacion ?? 0,
      'Titulación':          dist?.horas_titulacion ?? 0,
      'Gestión':             dist?.horas_gestion ?? 0,
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Distributivo')
  XLSX.writeFile(wb, `distributivo_${periodoId}_${Date.now()}.xlsx`)

  const codigo = `XLSX-${periodoId}-${Date.now()}`
  registrarReporte(generadoPorUid, 'excel_carrera', periodoId, codigo)
  return codigo
}

/**
 * Reporte semestral de cumplimiento de ACTIVIDADES por docente: actividades
 * completadas vs asignadas por categoría CES, con evidencias adjuntas.
 * Pensado para el cierre del semestre (RF-018).
 * @param {{ periodoId, carreraId?, generadoPorUid, generadoPorNombre, periodo }} filtros
 */
export async function generarReporteSemestralActividades(filtros) {
  const { periodoId, carreraId = null, generadoPorUid, generadoPorNombre, periodo } = filtros
  const actividades = await getActividadesDirector(periodoId, carreraId)
  if (actividades.length === 0) {
    throw new Error('No hay actividades registradas en este período para reportar.')
  }

  // Agrupar por docente → categoría
  const porDocente = new Map()
  for (const a of actividades) {
    const uid = a.asignada_a_uid
    if (!porDocente.has(uid)) {
      porDocente.set(uid, {
        docente_nombre: a.asignada_a_nombre || uid,
        categorias: new Map(),   // categoria → { asignadas, completadas }
        evidencias: [],
        totalAsignadas: 0,
        totalCompletadas: 0,
      })
    }
    const d = porDocente.get(uid)
    const cat = CATEGORIA_LABELS[a.categoria_ces] ?? a.categoria_ces ?? 'Sin categoría'
    const acc = d.categorias.get(cat) ?? { asignadas: 0, completadas: 0 }
    acc.asignadas += 1
    d.totalAsignadas += 1
    const completada = estadoEfectivo(a) === ESTADOS_ACTIVIDAD.COMPLETADA
    if (completada) { acc.completadas += 1; d.totalCompletadas += 1 }
    d.categorias.set(cat, acc)
    if (a.evidencia_url) d.evidencias.push({ titulo: a.titulo, categoria: cat, url: a.evidencia_url })
  }

  const docentesData = [...porDocente.values()]
    .map(d => ({
      ...d,
      categorias: [...d.categorias.entries()].map(([categoria, v]) => ({ categoria, ...v })),
    }))
    .sort((a, b) => a.docente_nombre.localeCompare(b.docente_nombre))

  const codigoVerif = await exportarReporteActividadesPDF(docentesData, periodo, generadoPorNombre)
  registrarReporte(generadoPorUid, 'cumplimiento_actividades', periodoId, codigoVerif)
  return codigoVerif
}

/**
 * Devuelve el historial de reportes generados por el usuario.
 * @param {string} generadoPorUid
 * @returns {Promise<Object[]>}
 */
export async function getHistorialReportes(generadoPorUid) {
  return leerHistorial(generadoPorUid)
}
