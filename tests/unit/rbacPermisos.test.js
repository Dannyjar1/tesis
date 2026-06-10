/**
 * Tests del RBAC dinámico: definiciones de rol como datos, permisos
 * acumulativos por suma de roles, roles personalizados y activación.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ROLES_DEFAULT, getDefinicionesSync, getDefiniciones,
  guardarRol, toggleActivoRol, computarPermisos,
} from '../../src/services/rolesService'
import { MODULOS, MODULO_POR_ID } from '../../src/utils/modulos'

beforeEach(() => localStorage.clear())

describe('Permisos acumulativos (suma de roles)', () => {
  it('docente solo ve sus módulos personales', () => {
    const { modulos } = computarPermisos(['docente'], ROLES_DEFAULT)
    expect(modulos.has('mi-distributivo')).toBe(true)
    expect(modulos.has('dashboard')).toBe(false)
    expect(modulos.has('distributivos')).toBe(false)
  })

  it('docente + coordinador acumula supervisión y reportes de carrera', () => {
    const { modulos } = computarPermisos(['docente', 'coordinador'], ROLES_DEFAULT)
    expect(modulos.has('mi-distributivo')).toBe(true)   // módulos docentes
    expect(modulos.has('dashboard')).toBe(true)         // + supervisión
    expect(modulos.has('distributivos')).toBe(true)     // + revisión
    expect(modulos.has('reportes')).toBe(true)          // + reportes de carrera
  })

  it('docente + coordinador + director acumula también la gestión', () => {
    const { modulos, acciones } = computarPermisos(['docente', 'coordinador', 'director'], ROLES_DEFAULT)
    expect(modulos.has('gestion-periodos')).toBe(true)
    expect(acciones['distributivos'].has('aprobar')).toBe(true)   // potestad del director
  })

  it('coordinador SIN director no puede aprobar distributivos', () => {
    const { acciones } = computarPermisos(['docente', 'coordinador'], ROLES_DEFAULT)
    expect(acciones['distributivos']?.has('aprobar') ?? false).toBe(false)
  })

  it('las acciones también se acumulan entre roles', () => {
    const { acciones } = computarPermisos(['coordinador', 'director'], ROLES_DEFAULT)
    expect(acciones['reportes'].has('exportar')).toBe(true)
    expect(acciones['distributivos'].has('aprobar')).toBe(true)
  })
})

describe('Roles personalizados (sin modificar código)', () => {
  it('el superadmin crea un rol nuevo con módulos y acciones propios', async () => {
    const id = await guardarRol({
      nombre: 'Auditor CACES',
      modulos: ['reportes', 'auditoria'],
      acciones: { reportes: ['visualizar', 'exportar'], auditoria: ['visualizar'] },
    })
    expect(id).toBe('auditor_caces')
    const defs = await getDefiniciones()
    const rol = defs.find(r => r.id === 'auditor_caces')
    expect(rol.es_sistema).toBe(false)
    expect(rol.modulos).toContain('auditoria')
  })

  it('un docente con el rol personalizado suma sus módulos', async () => {
    await guardarRol({ nombre: 'Auditor CACES', modulos: ['auditoria'], acciones: { auditoria: ['visualizar'] } })
    const defs = getDefinicionesSync()
    const { modulos } = computarPermisos(['docente', 'auditor_caces'], defs)
    expect(modulos.has('mi-distributivo')).toBe(true)
    expect(modulos.has('auditoria')).toBe(true)
  })

  it('un rol desactivado deja de aportar permisos', async () => {
    await guardarRol({ nombre: 'Auditor CACES', modulos: ['auditoria'], acciones: {} })
    await toggleActivoRol('auditor_caces', false)
    const defs = getDefinicionesSync()
    const { modulos } = computarPermisos(['docente', 'auditor_caces'], defs)
    expect(modulos.has('auditoria')).toBe(false)
  })

  it('los roles de sistema admiten ajustar sus módulos', async () => {
    await guardarRol({ id: 'coordinador', nombre: 'Coordinador Académico', modulos: ['dashboard'], acciones: { dashboard: ['visualizar'] } })
    const defs = getDefinicionesSync()
    const coord = defs.find(r => r.id === 'coordinador')
    expect(coord.es_sistema).toBe(true)
    expect(coord.modulos).toEqual(['dashboard'])
  })
})

describe('Registro de módulos', () => {
  it('todos los módulos referenciados por los roles de sistema existen', () => {
    for (const rol of ROLES_DEFAULT) {
      for (const m of rol.modulos) {
        expect(MODULO_POR_ID[m], `módulo ${m} del rol ${rol.id}`).toBeDefined()
      }
    }
  })

  it('cada módulo declara path, label, icono y acciones', () => {
    for (const m of MODULOS) {
      expect(m.path).toBeTruthy()
      expect(m.label).toBeTruthy()
      expect(typeof m.icon).toBe('function')
      expect(m.acciones.length).toBeGreaterThan(0)
    }
  })
})
