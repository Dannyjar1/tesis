/**
 * rolesService.js — Definiciones de ROLES (fijas en código).
 *
 * Modelo simplificado a solicitud de Lorena: 4 roles con permisos FIJOS
 * (superadmin, director, coordinador, docente). Ya NO hay roles dinámicos
 * configurables ni colección /roles_definicion: qué módulos ve cada rol y qué
 * acciones puede ejecutar se define aquí y solo se cambia por código.
 *
 * El superadmin (TIC) absorbe la administración del sistema que antes tenía el
 * Pro-Rector (auditoría y configuración).
 */

// ── Definición fija de los 4 roles ────────────────────────────────────────────
export const ROLES_DEFAULT = [
  {
    id: 'superadmin', nombre: 'TIC — Administrador del Sistema',
    modulos: ['sistema-carreras', 'sistema-periodos', 'sistema-usuarios', 'sistema-seed', 'auditoria', 'configuracion', 'notificaciones'],
    acciones: {
      'sistema-carreras': ['visualizar', 'crear', 'editar', 'administrar'],
      'sistema-periodos': ['visualizar', 'administrar'],
      'sistema-usuarios': ['administrar'],
      'sistema-seed':     ['administrar'],
      auditoria:          ['visualizar', 'exportar'],
      configuracion:      ['administrar'],
    },
  },
  {
    id: 'director', nombre: 'Director de Carrera',
    modulos: ['dashboard', 'distributivos', 'actividades', 'personal', 'reportes', 'gestion-periodos', 'notificaciones'],
    acciones: {
      dashboard:          ['visualizar'],
      distributivos:      ['visualizar', 'crear', 'editar', 'aprobar'],
      actividades:        ['visualizar', 'crear', 'editar'], // asigna y da seguimiento
      personal:           ['visualizar', 'crear', 'editar'],
      reportes:           ['visualizar', 'exportar'],
      'gestion-periodos': ['visualizar', 'crear', 'editar'],
    },
  },
  {
    id: 'coordinador', nombre: 'Coordinador Académico',
    modulos: ['dashboard', 'distributivos', 'actividades', 'personal', 'reportes', 'notificaciones'],
    acciones: {
      dashboard:     ['visualizar'],
      distributivos: ['visualizar'],          // sin aprobar (RN-008)
      actividades:   ['visualizar'],          // panel consolidado (lectura)
      personal:      ['visualizar'],
      reportes:      ['visualizar', 'exportar'],
    },
  },
  {
    id: 'docente', nombre: 'Docente',
    modulos: ['mi-distributivo', 'mis-actividades', 'horario', 'notificaciones'],
    acciones: {
      'mi-distributivo': ['visualizar', 'exportar'],
      'mis-actividades': ['visualizar', 'editar'],   // ve y completa lo asignado
      horario:           ['visualizar'],
    },
  },
]

/** Definiciones efectivas (fijas). Versión síncrona para el primer render. */
export function getDefinicionesSync() {
  return ROLES_DEFAULT
}

/** Definiciones efectivas (fijas). Async por compatibilidad con usePermisos. */
export async function getDefiniciones() {
  return ROLES_DEFAULT
}

// ── Cálculo de permisos acumulativos (RBAC) ───────────────────────────────────

/**
 * Permisos efectivos de un usuario: UNIÓN de los módulos y acciones de todos
 * sus roles (función pura — testeable).
 * @param {string[]} rolesUsuario - roles[] del usuario
 * @param {Array} definiciones   - definiciones de rol (getDefiniciones*)
 * @returns {{ modulos: Set<string>, acciones: Object<string, Set<string>> }}
 */
export function computarPermisos(rolesUsuario, definiciones) {
  const modulos = new Set()
  const acciones = {}
  for (const rolId of rolesUsuario ?? []) {
    const def = definiciones.find(d => d.id === rolId)
    if (!def || def.activo === false) continue
    for (const m of def.modulos ?? []) modulos.add(m)
    for (const [mod, accs] of Object.entries(def.acciones ?? {})) {
      acciones[mod] = acciones[mod] ?? new Set()
      for (const a of accs) acciones[mod].add(a)
    }
  }
  return { modulos, acciones }
}
