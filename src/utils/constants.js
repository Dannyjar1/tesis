// ── Roles del sistema (5 niveles) ────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:     'superadmin',   // TIC — administra el sistema: carreras, usuarios, roles
  ADMIN:          'admin',        // Pro-Rector — autoridad académica global
  DIRECTOR:       'director',     // Director de Carrera
  COORDINADOR:    'coordinador',  // Coordinador Académico
  DOCENTE:        'docente',      // Docente (TC / MT / TP / Honorario)
  ADMINISTRATIVO: 'administrativo',
}

export const ROL_LABELS = {
  superadmin:     'TIC — Administrador del Sistema',
  admin:          'Pro-Rector',
  director:       'Director de Carrera',
  coordinador:    'Coordinador Académico',
  docente:        'Docente',
  administrativo: 'Administrativo',
}

export const CARGO_LABELS = {
  representante_estudiantil: 'Representante Estudiantil',
  secretaria:                'Secretaría',
  bienestar_universitario:   'Bienestar Universitario',
}

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
  { id: 'administracion-empresas',  nombre: 'Administración de Empresas',             escuela: null },
  { id: 'arquitectura',             nombre: 'Arquitectura',                             escuela: null },
  { id: 'derecho',                  nombre: 'Derecho',                                 escuela: null },
  { id: 'sistemas-informacion',     nombre: 'Ingeniería en Sistemas de la Información', escuela: 'Escuela de Tecnologías de la Información' },
  { id: 'psicologia-clinica',       nombre: 'Psicología Clínica',                      escuela: null },
  { id: 'marketing',                nombre: 'Marketing',                               escuela: null },
  { id: 'negocios-internacionales', nombre: 'Negocios Internacionales',               escuela: null },
]

export const CARRERA_LABELS = Object.fromEntries(CARRERAS.map(c => [c.id, c.nombre]))

// ── Categorías CES ────────────────────────────────────────────────────────────
export const CATEGORIAS = {
  DOCENCIA:      'docencia',
  INVESTIGACION: 'investigacion',
  VINCULACION:   'vinculacion',
  TUTORIA:       'tutoria',
  GESTION:       'gestion',
}

export const CATEGORIA_LABELS = {
  docencia:      'Docencia directa',
  investigacion: 'Investigación',
  vinculacion:   'Vinculación con la Sociedad',
  tutoria:       'Tutoría y preparación',
  gestion:       'Gestión institucional',
}

export const CATEGORIA_COLORES = {
  docencia:      'bg-blue-100 text-blue-800',
  investigacion: 'bg-purple-100 text-purple-800',
  vinculacion:   'bg-green-100 text-green-800',
  tutoria:       'bg-yellow-100 text-yellow-800',
  gestion:       'bg-orange-100 text-orange-800',
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
