/**
 * Tests del RBAC fijo: 4 roles con permisos fijos por código y permisos
 * acumulativos por suma de roles (multi-rol). Ya no hay roles dinámicos.
 */
import { describe, it, expect } from 'vitest'
import {
  ROLES_DEFAULT, getDefinicionesSync, computarPermisos,
} from '../../src/services/rolesService'
import { MODULOS, MODULO_POR_ID } from '../../src/utils/modulos'

describe('Modelo de 4 roles fijos', () => {
  it('solo existen superadmin, director, coordinador y docente', () => {
    const ids = getDefinicionesSync().map(r => r.id).sort()
    expect(ids).toEqual(['coordinador', 'director', 'docente', 'superadmin'])
  })

  it('no quedan los roles admin ni administrativo', () => {
    const ids = ROLES_DEFAULT.map(r => r.id)
    expect(ids).not.toContain('admin')
    expect(ids).not.toContain('administrativo')
  })
})

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

  it('el superadmin administra el sistema (carreras, usuarios, auditoría, configuración)', () => {
    const { modulos } = computarPermisos(['superadmin'], ROLES_DEFAULT)
    expect(modulos.has('sistema-carreras')).toBe(true)
    expect(modulos.has('sistema-usuarios')).toBe(true)
    expect(modulos.has('auditoria')).toBe(true)
    expect(modulos.has('configuracion')).toBe(true)
  })
})

describe('Registro de módulos', () => {
  it('todos los módulos referenciados por los roles existen', () => {
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
