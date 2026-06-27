// ── Roles del sistema (4 niveles, fijos) ─────────────────────────────────────
// Modelo simplificado a solicitud de Lorena: superadmin (TIC) + los 3 roles
// académicos. Sin roles dinámicos/configurables: los permisos son fijos por rol.
export const ROLES = {
  SUPERADMIN:  'superadmin',   // TIC — administra el sistema: carreras, usuarios, períodos
  DIRECTOR:    'director',      // Director de Carrera
  COORDINADOR: 'coordinador',   // Coordinador Académico
  DOCENTE:     'docente',       // Docente (TC / MT / TP / Honorario)
}

export const ROL_LABELS = {
  superadmin:  'TIC — Administrador del Sistema',
  director:    'Director de Carrera',
  coordinador: 'Coordinador Académico',
  docente:     'Docente',
}

export const CARGO_LABELS = {
  representante_estudiantil: 'Representante Estudiantil',
  secretaria:                'Secretaría',
  bienestar_universitario:   'Bienestar Universitario',
}

// ── Modelo RBAC: tipo base (docente) + cargos institucionales ─────────────────
// Regla institucional: todo cargo lo ejerce un docente. El tipo base es docente
// y sobre él se acumulan cargos (Coordinador, Director, Administrador TIC).
export const TIPOS_BASE_USUARIO = [ROLES.DOCENTE]
export const CARGOS_INSTITUCIONALES = [ROLES.COORDINADOR, ROLES.DIRECTOR, ROLES.SUPERADMIN]

// ── Tipos de contrato (atributo del docente, no del rol) ─────────────────────
export const TIPO_CONTRATO = {
  TIEMPO_COMPLETO: 'tiempo_completo',
  MEDIO_TIEMPO:    'medio_tiempo',
  TIEMPO_PARCIAL:  'tiempo_parcial',
  HONORARIO:       'honorario',
}

export const TIPO_CONTRATO_LABELS = {
  tiempo_completo: 'TC — Tiempo Completo',
  medio_tiempo:    'MT — Medio Tiempo',
  tiempo_parcial:  'TP — Tiempo Parcial',
  honorario:       'Honorario',
}

export const TIPO_CONTRATO_HORAS = {
  tiempo_completo: 40,
  medio_tiempo:    20,
  tiempo_parcial:  null,
  honorario:       null,
}

// ── Carreras UIDE Campus Loja ─────────────────────────────────────────────────
export const CARRERAS = [
  { id: 'administracion-empresas',  nombre: 'Administración de Empresas',             facultad: 'Business School' },
  { id: 'arquitectura',             nombre: 'Arquitectura',                             facultad: 'Facultad de Arquitectura, Diseño y Arte' },
  { id: 'derecho',                  nombre: 'Derecho',                                 facultad: 'Facultad de Jurisprudencia, Ciencias Sociales y Humanidades' },
  { id: 'sistemas-informacion',     nombre: 'Ingeniería en Sistemas de la Información', facultad: 'Facultad de Ingenierías Digitales y Tecnologías Emergentes' },
  { id: 'psicologia-clinica',       nombre: 'Psicología Clínica',                      facultad: 'Facultad de Ciencias Médicas, de la Salud y la Vida' },
  { id: 'marketing',                nombre: 'Marketing',                               facultad: 'Business School' },
  { id: 'negocios-internacionales', nombre: 'Negocios Internacionales',               facultad: 'Business School' },
]

export const CARRERA_LABELS = Object.fromEntries(CARRERAS.map(c => [c.id, c.nombre]))

// ── Categorías oficiales del distributivo (Excel UIDE 2026) ───────────────────
// Estructura oficial de 4 categorías. NO existe una 5.ª categoría "tutoria" ni
// "titulacion": la tutoría es la subcategoría 1.2 dentro de DOCENCIA. Los
// nombres de CATEGORIA_LABELS se preservan EXACTAMENTE (mayúsculas) como en el
// Excel oficial. Fuente de verdad: src/modules/distributivo/modeloDistributivo.js
export const CATEGORIAS = {
  DOCENCIA:      'docencia',
  INVESTIGACION: 'investigacion',
  VINCULACION:   'vinculacion',
  GESTION:       'gestion',
}

export const CATEGORIA_LABELS = {
  docencia:      'DOCENCIA',
  investigacion: 'INVESTIGACIÓN',
  vinculacion:   'VINCULACIÓN CON LA SOCIEDAD',
  gestion:       'GESTIÓN ACADÉMICA',
}

export const CATEGORIA_COLORES = {
  docencia:      'bg-blue-100 text-blue-800',
  investigacion: 'bg-purple-100 text-purple-800',
  vinculacion:   'bg-green-100 text-green-800',
  gestion:       'bg-orange-100 text-orange-800',
}

// Subcategorías oficiales por categoría (Excel UIDE). Se usan SOLO para el
// registro manual de actividades (campo `subcategoria`); el clasificador de IA
// NO predice subcategoría todavía (ver D2 / iaService).
export const SUBCATEGORIAS_POR_CATEGORIA = {
  docencia: [
    { codigo: '1.1', nombre: 'ASIGNATURA' },
    { codigo: '1.2', nombre: 'TUTORÍAS' },
    { codigo: '1.3', nombre: 'OTRAS ACTIVIDADES DE DOCENCIA' },
  ],
  investigacion: [
    { codigo: '2.1', nombre: 'Proyecto de Investigación' },
    { codigo: '2.2', nombre: 'Artículo Científico' },
  ],
  vinculacion: [
    { codigo: '3.1', nombre: 'Proyectos de Vinculación' },
    { codigo: '3.2', nombre: 'Prácticas Pre-Profesionales' },
    { codigo: '3.3', nombre: 'Seguimiento a Graduados' },
  ],
  gestion: [
    { codigo: '4.1',  nombre: 'Dirección de Escuela' },
    { codigo: '4.2',  nombre: 'Coordinación Académica' },
    { codigo: '4.3',  nombre: 'Coordinación de Investigación' },
    { codigo: '4.4',  nombre: 'Coordinación de Vinculación' },
    { codigo: '4.5',  nombre: 'Internacionalización' },
    { codigo: '4.6',  nombre: 'POA' },
    { codigo: '4.7',  nombre: 'Representantes de SAIC' },
    { codigo: '4.8',  nombre: 'Acreditaciones Institucionales' },
    { codigo: '4.9',  nombre: 'Tutores, Lectores y Grados' },
    { codigo: '4.10', nombre: 'Clubes, Proyectos, Eventos, Otras Actividades' },
  ],
}

// ── Estados del distributivo ──────────────────────────────────────────────────
export const ESTADOS_DISTRIBUTIVO = {
  BORRADOR:    'borrador',
  EN_REVISION: 'en_revision',
  APROBADO:    'aprobado',
  VIGENTE:     'vigente',
  ARCHIVADO:   'archivado',
}

export const ESTADO_LABELS = {
  borrador:    'Borrador',
  en_revision: 'En revisión',
  aprobado:    'Aprobado',
  vigente:     'Vigente',
  archivado:   'Archivado',
}

export const ESTADO_COLORES = {
  borrador:    'bg-gray-100 text-gray-700',
  en_revision: 'bg-yellow-100 text-yellow-800',
  aprobado:    'bg-green-100 text-green-800',
  vigente:     'bg-blue-100 text-blue-800',
  archivado:   'bg-slate-100 text-slate-600',
}

// ── Tipos de contrato — claves cortas (legacy) y largas (Firestore/seed) ───────
export const TIPOS_CONTRATO = {
  TC:             { sigla: 'TC', horas: 40,   nombre: 'Tiempo Completo' },
  MT:             { sigla: 'MT', horas: 20,   nombre: 'Medio Tiempo' },
  TP:             { sigla: 'TP', horas: null, nombre: 'Tiempo Parcial' },
  tiempo_completo: { sigla: 'TC', horas: 40,   nombre: 'Tiempo Completo' },
  medio_tiempo:    { sigla: 'MT', horas: 20,   nombre: 'Medio Tiempo' },
  tiempo_parcial:  { sigla: 'TP', horas: null, nombre: 'Tiempo Parcial' },
  honorario:       { sigla: 'H',  horas: null, nombre: 'Honorario' },
}

export const CATEGORIAS_ESCALAFON = ['Auxiliar', 'Agregado', 'Principal']

export const UMBRAL_ALERTA_DEFAULT = 80

export const DOMINIO_INSTITUCIONAL = '@uide.edu.ec'

export const HORAS_MAXIMAS_TC = {
  docencia_directa: { min: 3, max: 22 },
  investigacion:    { max: 16 },
  gestion:          { max: 12 },
}

// ── Actividades asignadas por el director (MOD-02 / PROJECT_BRIEF §5, §15) ─────
// El director asigna actividades a los docentes; el docente las completa y
// sube evidencia. NO es un tablero personal (ese módulo se eliminó).
export const PRIORIDADES_ACTIVIDAD = {
  URGENTE:   'urgente',
  NORMAL:    'normal',
  PENDIENTE: 'pendiente',
}

export const PRIORIDAD_ACTIVIDAD_LABELS = {
  urgente:   'Urgente',
  normal:    'Normal',
  pendiente: 'Pendiente',
}

export const PRIORIDAD_ACTIVIDAD_COLORES = {
  urgente:   'bg-red-100 text-red-800',
  normal:    'bg-amber-100 text-amber-800',
  pendiente: 'bg-gray-100 text-gray-700',
}

// Orden de prioridad para el listado (menor = primero).
export const PRIORIDAD_ORDEN = { urgente: 0, normal: 1, pendiente: 2 }

export const ESTADOS_ACTIVIDAD = {
  PENDIENTE:   'pendiente',
  EN_PROGRESO: 'en_progreso',
  COMPLETADA:  'completada',
  VENCIDA:     'vencida',
}

export const ESTADO_ACTIVIDAD_LABELS = {
  pendiente:   'Pendiente',
  en_progreso: 'En progreso',
  completada:  'Completada',
  vencida:     'Vencida',
}

export const ESTADO_ACTIVIDAD_COLORES = {
  pendiente:   'bg-gray-100 text-gray-700',
  en_progreso: 'bg-blue-100 text-blue-800',
  completada:  'bg-green-100 text-green-800',
  vencida:     'bg-red-200 text-red-900',
}

// Mapa categoría CES → campos de horas del distributivo. Se usa para la alerta
// de coherencia (PROJECT_BRIEF §5.4 / RESTRUCTURE §3.3): si la categoría de la
// actividad no tiene horas en el distributivo del docente, se avisa al asignar.
export const CATEGORIA_A_HORAS_DISTRIBUTIVO = {
  // DOCENCIA agrupa 1.1 (asignatura), 1.2 (tutorías) y 1.3 (otras) — la tutoría
  // ya no es una categoría propia, es subcategoría de Docencia.
  docencia:      ['horas_docencia_directa', 'horas_tutoria', 'horas_preparacion'],
  investigacion: ['horas_investigacion'],
  vinculacion:   ['horas_vinculacion'],
  gestion:       ['horas_gestion'],
}
