/**
 * Modelo del distributivo individual según la plantilla oficial vigente de UIDE
 * "2026-Distributivo-Docente-base.xlsx" (entregada por la dirección de carrera).
 *
 * Reemplaza la estructura anterior de categorías (titulación, reducciones por
 * cargo, tramos de tutoría por nº de materias). La estructura oficial son 4
 * bloques:
 *   1. DOCENCIA      → 1.1 Asignatura (horario), 1.2 Tutorías, 1.3 Otras
 *   2. INVESTIGACIÓN → 2.1 Proyecto, 2.2 Artículo
 *   3. VINCULACIÓN   → 3.1 Proyectos, 3.2 Prácticas PP, 3.3 Seguimiento graduados
 *   4. GESTIÓN ACAD. → 4.1 … 4.10
 *
 * Todas las horas son de ingreso manual salvo el total de horas de clase, que se
 * calcula del horario, y las sugerencias del 20% (informativas).
 */

// ── Días laborables del horario semanal ───────────────────────────────────────
export const DIAS_SEMANA = [
  { id: 'lunes',     label: 'LUNES' },
  { id: 'martes',    label: 'MARTES' },
  { id: 'miercoles', label: 'MIÉRCOLES' },
  { id: 'jueves',    label: 'JUEVES' },
  { id: 'viernes',   label: 'VIERNES' },
]

// ── Bloque 2 — Investigación ──────────────────────────────────────────────────
export const INVESTIGACION_SUBCATS = [
  { key: 'horas_proyecto_investigacion', num: '2.1', label: 'Proyecto de Investigación' },
  { key: 'horas_articulo_cientifico',    num: '2.2', label: 'Artículo Científico' },
]

// ── Bloque 3 — Vinculación con la Sociedad (rangos informativos, NO bloquean) ──
export const VINCULACION_SUBCATS = [
  { key: 'horas_proyectos_vinculacion',   num: '3.1', label: 'Proyectos de Vinculación',   min: 0, max: 5 },
  { key: 'horas_practicas_preprofesionales', num: '3.2', label: 'Prácticas Pre-Profesionales', min: 0, max: 3 },
  { key: 'horas_seguimiento_graduados',   num: '3.3', label: 'Seguimiento a Graduados',     min: 0, max: 2 },
]

// ── Bloque 4 — Gestión Académica (10 subcategorías manuales) ──────────────────
export const GESTION_SUBCATS = [
  { key: 'gestion_direccion_escuela',          num: '4.1',  label: 'Dirección de Escuela' },
  { key: 'gestion_coordinacion_academica',     num: '4.2',  label: 'Coordinación Académica' },
  { key: 'gestion_coordinacion_investigacion', num: '4.3',  label: 'Coordinación de Investigación' },
  { key: 'gestion_coordinacion_vinculacion',   num: '4.4',  label: 'Coordinación de Vinculación' },
  { key: 'gestion_internacionalizacion',       num: '4.5',  label: 'Internacionalización' },
  { key: 'gestion_poa',                        num: '4.6',  label: 'POA' },
  { key: 'gestion_representantes_saic',        num: '4.7',  label: 'Representantes de SAIC' },
  { key: 'gestion_acreditaciones',             num: '4.8',  label: 'Acreditaciones Institucionales' },
  { key: 'gestion_tutores_lectores_grados',    num: '4.9',  label: 'Tutores, Lectores y Grados' },
  { key: 'gestion_clubes_proyectos_eventos',   num: '4.10', label: 'Clubes, Proyectos, Eventos, Otras Actividades' },
]

// Claves numéricas de horas que componen cada bloque (sin contar el horario).
const KEYS_INVESTIGACION = INVESTIGACION_SUBCATS.map(s => s.key)
const KEYS_VINCULACION   = VINCULACION_SUBCATS.map(s => s.key)
const KEYS_GESTION       = GESTION_SUBCATS.map(s => s.key)

// Plantilla de campos numéricos en blanco (para inicializar el formulario).
export const CAMPOS_VACIOS = Object.fromEntries(
  ['horas_tutorias', 'horas_otras_docencia', ...KEYS_INVESTIGACION, ...KEYS_VINCULACION, ...KEYS_GESTION]
    .map(k => [k, '']),
)

// ── Helpers de tiempo y números ───────────────────────────────────────────────
export function num(v) { return parseFloat(v) || 0 }

/** Convierte 'HH:MM' a minutos desde medianoche. */
function aMinutos(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Duración en horas (decimal) de un bloque de clase 'HH:MM'–'HH:MM'. */
export function duracionBloque(inicio, fin) {
  return Math.max(0, (aMinutos(fin) - aMinutos(inicio)) / 60)
}

/** Suma total de horas de clase de la semana a partir del horario (presencial + en línea). */
export function calcularHorasClaseTotal(asignaturas = []) {
  return Math.round(
    asignaturas.reduce((s, a) => s + duracionBloque(a.inicio, a.fin), 0) * 100,
  ) / 100
}

/** Sugerencia del 20% de las horas de clase, redondeada hacia arriba (informativa). */
export function sugerencia20(horasClaseTotal) {
  return Math.ceil(num(horasClaseTotal) * 0.20)
}

/** Bloques de clase de un día concreto, ordenados por hora de inicio. */
export function asignaturasDeDia(asignaturas = [], diaId) {
  return asignaturas
    .filter(a => a.dia === diaId)
    .sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio))
}

/** Horas de clase de un día concreto (para la fila TOTAL del PDF). */
export function horasClaseDia(asignaturas = [], diaId) {
  return Math.round(
    asignaturasDeDia(asignaturas, diaId).reduce((s, a) => s + duracionBloque(a.inicio, a.fin), 0) * 100,
  ) / 100
}

/**
 * Totales por bloque y total general. Se usa para el resumen en vivo del
 * formulario y para la fila TOTAL del PDF.
 */
export function calcularTotales(campos) {
  // En registros migrados del esquema anterior no hay horario detallado; se usa
  // el total de horas de clase almacenado como respaldo.
  let horasClase = calcularHorasClaseTotal(campos.asignaturas)
  if (horasClase === 0 && num(campos.horas_clase_total) > 0) horasClase = num(campos.horas_clase_total)
  const docencia     = horasClase + num(campos.horas_tutorias) + num(campos.horas_otras_docencia)
  const investigacion = KEYS_INVESTIGACION.reduce((s, k) => s + num(campos[k]), 0)
  const vinculacion   = KEYS_VINCULACION.reduce((s, k) => s + num(campos[k]), 0)
  const gestion       = KEYS_GESTION.reduce((s, k) => s + num(campos[k]), 0)
  const total         = Math.round((docencia + investigacion + vinculacion + gestion) * 100) / 100
  return { horasClase, docencia, investigacion, vinculacion, gestion, total }
}

/**
 * Construye el documento a persistir. Guarda la estructura oficial nueva y,
 * además, un conjunto de campos derivados "legacy" (horas_docencia_directa,
 * horas_preparacion, horas_tutoria, horas_investigacion, horas_vinculacion,
 * horas_gestion) para que el dashboard, los reportes y la alerta de coherencia
 * de actividades sigan funcionando sin cambios.
 */
export function construirDistributivoDoc(campos, base = {}) {
  const t = calcularTotales(campos)
  const numericos = {}
  for (const k of ['horas_tutorias', 'horas_otras_docencia', ...KEYS_INVESTIGACION, ...KEYS_VINCULACION, ...KEYS_GESTION]) {
    numericos[k] = num(campos[k])
  }
  return {
    ...base,
    // Estructura oficial nueva
    asignaturas: (campos.asignaturas ?? []).map(a => ({
      dia: a.dia, materia: (a.materia ?? '').trim(), inicio: a.inicio, fin: a.fin,
    })),
    ...numericos,
    horas_clase_total: t.horasClase,
    total_horas: t.total,
    // Campos derivados legacy (compatibilidad con dashboard/reportes/coherencia)
    horas_docencia_directa: t.horasClase,
    horas_preparacion:      numericos.horas_otras_docencia,
    horas_tutoria:          numericos.horas_tutorias,
    horas_investigacion:    t.investigacion,
    horas_vinculacion:      t.vinculacion,
    horas_gestion:          t.gestion,
    horas_titulacion:       0,
    horas_reduccion_cargo:  0,
  }
}

/**
 * Normaliza un distributivo leído de almacenamiento al esquema nuevo. Si el
 * registro proviene del esquema anterior (no tiene `asignaturas`), mapea sus
 * horas a la estructura de 4 bloques conservando el total: las horas de clase
 * van a horas_clase_total (sin detalle de horario), preparación a 1.3,
 * titulación a 4.9 (Tutores, Lectores y Grados, dentro de GESTIÓN ACADÉMICA),
 * investigación a 2.1, vinculación a 3.1 y gestión a 4.10.
 */
export function normalizarDistributivo(d) {
  if (!d) return d
  if (Array.isArray(d.asignaturas)) return d   // ya es esquema nuevo

  const horasClase = num(d.horas_docencia_directa)
  return {
    ...d,
    asignaturas: [],
    horas_clase_total:            horasClase,
    horas_tutorias:               num(d.horas_tutoria),
    horas_otras_docencia:         num(d.horas_preparacion),
    horas_proyecto_investigacion: num(d.horas_investigacion),
    horas_articulo_cientifico:    0,
    horas_proyectos_vinculacion:  num(d.horas_vinculacion),
    horas_practicas_preprofesionales: 0,
    horas_seguimiento_graduados:  0,
    gestion_clubes_proyectos_eventos: num(d.horas_gestion) + num(d.horas_reduccion_cargo),
    gestion_direccion_escuela: 0, gestion_coordinacion_academica: 0,
    gestion_coordinacion_investigacion: 0, gestion_coordinacion_vinculacion: 0,
    gestion_internacionalizacion: 0, gestion_poa: 0, gestion_representantes_saic: 0,
    gestion_acreditaciones: 0,
    // Titulación legacy (director/tribunal/grados) → subcat. 4.9 GESTIÓN ACADÉMICA.
    gestion_tutores_lectores_grados: num(d.horas_titulacion),
  }
}

/** Campos del formulario a partir de un distributivo existente (ya normalizado). */
export function camposDesdeDistributivo(d) {
  if (!d) return { ...CAMPOS_VACIOS, asignaturas: [] }
  const n = normalizarDistributivo(d)
  const campos = { asignaturas: n.asignaturas ?? [] }
  for (const k of Object.keys(CAMPOS_VACIOS)) {
    campos[k] = n[k] != null && n[k] !== 0 ? String(n[k]) : ''
  }
  return campos
}
