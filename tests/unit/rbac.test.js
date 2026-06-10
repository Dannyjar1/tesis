/**
 * Tests del modelo RBAC: tipos base + cargos institucionales con roles
 * múltiples. Un docente puede ser también Coordinador, un Director sigue
 * siendo docente, un Prorrector registra sus actividades académicas, etc.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { normalizarRolesPerfil } from '../../src/services/authService'
import { guardarUsuario, getTodosUsuarios } from '../../src/services/sistemaService'
import { TIPOS_BASE_USUARIO, CARGOS_INSTITUCIONALES, ROLES } from '../../src/utils/constants'
import { guardarAsignacionCarrera, getAsignacionCarrera, getCarrerasDeUsuario } from '../../src/services/estructuraPeriodoService'

const ACTIVO = { id: '2026-A-RBAC', nombre: 'test', estado: 'activo', fecha_inicio: '2026-05-04' }

beforeEach(() => localStorage.clear())

describe('Taxonomía RBAC: tipos base y cargos', () => {
  it('docente y administrativo son tipos base; los cargos son asignables', () => {
    expect(TIPOS_BASE_USUARIO).toEqual(['docente', 'administrativo'])
    expect(CARGOS_INSTITUCIONALES).toContain('coordinador')
    expect(CARGOS_INSTITUCIONALES).toContain('director')
    expect(CARGOS_INSTITUCIONALES).toContain('admin')       // Prorrector
    expect(CARGOS_INSTITUCIONALES).toContain('superadmin')  // Administrador del Sistema
  })
})

describe('Asignación de roles múltiples (guardarUsuario)', () => {
  it('persiste roles[] tal como los seleccionó el superadmin', async () => {
    await guardarUsuario('uid_multi', {
      nombre_completo: 'Docente Coordinador', email: 'multi@uide.edu.ec',
      rol: 'coordinador', roles: ['docente', 'coordinador'],
      carrera_id: 'derecho', tipo_contrato: 'tiempo_completo', activo: true,
    })
    const u = (await getTodosUsuarios()).find(x => x.uid === 'uid_multi')
    expect(u.roles).toEqual(['docente', 'coordinador'])
  })

  it('un director puede acumular tres roles (docente + coordinador + director)', async () => {
    await guardarUsuario('uid_triple', {
      nombre_completo: 'Triple Rol', email: 'triple@uide.edu.ec',
      rol: 'director', roles: ['docente', 'coordinador', 'director'],
      carrera_id: 'marketing', activo: true,
    })
    const u = (await getTodosUsuarios()).find(x => x.uid === 'uid_triple')
    expect(u.roles).toHaveLength(3)
  })

  it('llamadas legadas con rol string se normalizan a roles[]', async () => {
    await guardarUsuario('uid_legacy', {
      nombre_completo: 'Legado', email: 'legacy@uide.edu.ec',
      rol: 'administrativo', activo: true,
    })
    const u = (await getTodosUsuarios()).find(x => x.uid === 'uid_legacy')
    expect(u.roles).toEqual(['administrativo'])
  })
})

describe('Rol principal y visibilidad de módulos (normalización)', () => {
  it('el prorrector que también es docente conserva ambos accesos', () => {
    const p = normalizarRolesPerfil({ roles: ['docente', 'admin'] })
    expect(p.rol).toBe('admin')            // home y banner: Pro-Rector
    expect(p.roles).toContain('docente')   // módulos docentes visibles (menú fusionado)
  })

  it('el administrador del sistema que es docente prioriza superadmin', () => {
    const p = normalizarRolesPerfil({ roles: ['docente', 'superadmin'] })
    expect(p.rol).toBe('superadmin')
    expect(p.roles).toContain('docente')
  })
})

describe('Roles por período (estructura jerárquica)', () => {
  it('cada período almacena sus propios cargos: director y coordinador', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'derecho', {
      director_uid: 'uid_dir', coordinador_uid: 'uid_coord', docentes_uid: ['uid_dir'],
    })
    const asig = await getAsignacionCarrera(ACTIVO.id, 'derecho')
    expect(asig.director_uid).toBe('uid_dir')
    expect(asig.coordinador_uid).toBe('uid_coord')
  })

  it('la trazabilidad incluye al director del período', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'arquitectura', { director_uid: 'uid_dir2' })
    expect(await getCarrerasDeUsuario(ACTIVO.id, 'uid_dir2')).toContain('arquitectura')
  })
})
