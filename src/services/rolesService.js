/**
 * rolesService.js — Definiciones de ROLES como datos (RBAC dinámico).
 * El superadmin crea, modifica y activa/desactiva roles, y define qué módulos
 * ve cada rol y qué acciones puede ejecutar — sin modificar el código fuente.
 *
 * Los 6 roles de sistema (es_sistema: true) vienen sembrados replicando el
 * comportamiento institucional; no se eliminan pero SÍ se les pueden ajustar
 * módulos/acciones. Los roles personalizados (ej. "Auditor CACES") se crean
 * desde la pestaña Roles y Permisos y son asignables a usuarios como cargos.
 *
 * Firestore /roles_definicion + overlay localStorage (mismo patrón del resto).
 */
import { collection, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

const KEY_LOCAL = 'uide_roles_definicion'

// ── Roles de sistema (seed) — replican el comportamiento actual ──────────────
export const ROLES_DEFAULT = [
  {
    id: 'superadmin', nombre: 'TIC — Administrador del Sistema', es_sistema: true, activo: true,
    modulos: ['sistema-carreras', 'sistema-periodos', 'sistema-usuarios', 'sistema-roles', 'sistema-seed', 'notificaciones'],
    acciones: {
      'sistema-carreras': ['visualizar', 'crear', 'editar', 'administrar'],
      'sistema-periodos': ['visualizar', 'administrar'],
      'sistema-usuarios': ['administrar'],
      'sistema-roles':    ['administrar'],
      'sistema-seed':     ['administrar'],
    },
  },
  {
    id: 'admin', nombre: 'Pro-Rector', es_sistema: true, activo: true,
    modulos: ['dashboard', 'admin-usuarios', 'gestion-periodos', 'notificaciones', 'auditoria', 'configuracion'],
    acciones: {
      dashboard:         ['visualizar'],
      'admin-usuarios':  ['visualizar', 'crear', 'editar', 'administrar'],
      'gestion-periodos':['visualizar', 'crear', 'editar', 'administrar'],
      auditoria:         ['visualizar', 'exportar'],
      configuracion:     ['administrar'],
    },
  },
  {
    id: 'director', nombre: 'Director de Carrera', es_sistema: true, activo: true,
    modulos: ['dashboard', 'distributivos', 'actividades', 'personal', 'reportes', 'gestion-periodos', 'notificaciones'],
    acciones: {
      dashboard:         ['visualizar', 'crear'],          // crear: planes de mejora
      distributivos:     ['visualizar', 'crear', 'editar', 'aprobar'],
      actividades:       ['visualizar', 'crear', 'editar'], // asigna y da seguimiento
      personal:          ['visualizar', 'crear', 'editar'],
      reportes:          ['visualizar', 'exportar'],
      'gestion-periodos':['visualizar', 'crear', 'editar'],
    },
  },
  {
    id: 'coordinador', nombre: 'Coordinador Académico', es_sistema: true, activo: true,
    modulos: ['dashboard', 'distributivos', 'actividades', 'personal', 'reportes', 'notificaciones'],
    acciones: {
      dashboard:         ['visualizar'],
      distributivos:     ['visualizar'],                    // sin aprobar (RN-008)
      actividades:       ['visualizar'],                    // panel consolidado (lectura)
      personal:          ['visualizar'],
      reportes:          ['visualizar', 'exportar'],
    },
  },
  {
    id: 'docente', nombre: 'Docente', es_sistema: true, activo: true,
    modulos: ['mi-distributivo', 'mis-actividades', 'horario', 'notificaciones'],
    acciones: {
      'mi-distributivo': ['visualizar', 'exportar'],
      'mis-actividades': ['visualizar', 'editar'],          // ve y completa lo asignado
      horario:           ['visualizar'],
    },
  },
  {
    id: 'administrativo', nombre: 'Administrativo', es_sistema: true, activo: true,
    modulos: ['mi-panel', 'mi-distributivo', 'mis-actividades', 'reportes', 'horario', 'notificaciones'],
    acciones: {
      'mi-panel':        ['visualizar'],
      'mi-distributivo': ['visualizar', 'exportar'],
      'mis-actividades': ['visualizar', 'editar'],
      reportes:          ['visualizar', 'exportar'],
      horario:           ['visualizar'],
    },
  },
]

// ── Lectura síncrona (defaults + overlay local) ───────────────────────────────
// El menú necesita los permisos en el primer render; localStorage es síncrono.
// Firestore refresca después (getDefiniciones async).

function overlayLocal() {
  try { return JSON.parse(localStorage.getItem(KEY_LOCAL)) ?? {} } catch { return {} }
}

/** Definiciones efectivas, versión síncrona: seed + overlay localStorage. */
export function getDefinicionesSync() {
  const o = overlayLocal()
  const base = ROLES_DEFAULT.map(r => ({ ...r, ...(o[r.id] ?? {}), id: r.id, es_sistema: true }))
  const personalizados = Object.entries(o)
    .filter(([id]) => !ROLES_DEFAULT.some(r => r.id === id))
    .map(([id, datos]) => ({ id, es_sistema: false, activo: true, modulos: [], acciones: {}, ...datos }))
  return [...base, ...personalizados]
}

/** Definiciones efectivas con refresco desde Firestore (si hay datos remotos). */
export async function getDefiniciones() {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'roles_definicion'))
      if (!snap.empty) {
        const remotas = {}
        snap.docs.forEach(d => { remotas[d.id] = d.data() })
        const base = ROLES_DEFAULT.map(r => ({ ...r, ...(remotas[r.id] ?? {}), id: r.id, es_sistema: true }))
        const extra = Object.entries(remotas)
          .filter(([id]) => !ROLES_DEFAULT.some(r => r.id === id))
          .map(([id, datos]) => ({ id, es_sistema: false, activo: true, modulos: [], acciones: {}, ...datos }))
        return [...base, ...extra]
      }
    } catch (err) {
      console.warn('[rolesService] Firestore no disponible:', err.code)
    }
  }
  return getDefinicionesSync()
}

// ── Escritura (crear / modificar / activar / desactivar) ─────────────────────

/**
 * Crea o actualiza una definición de rol.
 * @param {{ id?, nombre, modulos: string[], acciones: Object, activo? }} datos
 */
export async function guardarRol(datos) {
  const id = datos.id || datos.nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  if (!datos.nombre?.trim()) throw new Error('El nombre del rol es obligatorio.')

  const payload = {
    nombre:   datos.nombre.trim(),
    modulos:  datos.modulos ?? [],
    acciones: datos.acciones ?? {},
    activo:   datos.activo ?? true,
  }

  if (db) {
    try {
      await setDoc(doc(db, 'roles_definicion', id),
        { ...payload, id, actualizado_en: Timestamp.now() }, { merge: true })
      return id
    } catch (err) {
      console.warn('[rolesService] Firestore error:', err.code)
    }
  }
  const o = overlayLocal()
  o[id] = { ...(o[id] ?? {}), ...payload }
  localStorage.setItem(KEY_LOCAL, JSON.stringify(o))
  return id
}

/** Activa o desactiva un rol (los desactivados dejan de aportar permisos). */
export async function toggleActivoRol(id, activo) {
  return guardarRol({ ...((await getDefiniciones()).find(r => r.id === id) ?? { id }), id, activo })
}

// ── Cálculo de permisos acumulativos (RBAC) ───────────────────────────────────

/**
 * Permisos efectivos de un usuario: UNIÓN de los módulos y acciones de todos
 * sus roles ACTIVOS (función pura — testeable).
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
