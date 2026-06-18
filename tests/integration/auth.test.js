import { describe, it, expect, afterEach } from 'vitest'
import {
  loginMock, logout, getCurrentUser, normalizarRolesPerfil,
} from '../../src/services/authService'

describe('authService (mock) — flujo de autenticación', () => {
  afterEach(async () => {
    await logout()
  })

  it('login con credenciales correctas retorna usuario', async () => {
    const user = await loginMock('locondezh@uide.edu.ec', '1234')
    expect(user.email).toBe('locondezh@uide.edu.ec')
    expect(user.rol).toBe('director')
    expect(user.password).toBeUndefined()
  })

  it('login con credenciales incorrectas lanza error', async () => {
    await expect(loginMock('locondezh@uide.edu.ec', 'wrong')).rejects.toThrow()
  })

  it('getCurrentUser retorna null antes de login', () => {
    expect(getCurrentUser()).toBeNull()
  })

  it('getCurrentUser retorna usuario después de login', async () => {
    await loginMock('davalarezole@uide.edu.ec', '1234')
    const user = getCurrentUser()
    expect(user?.rol).toBe('coordinador')
  })

  it('logout limpia la sesión', async () => {
    await loginMock('hcueva@uide.edu.ec', '1234')
    await logout()
    expect(getCurrentUser()).toBeNull()
  })

  it('todos los roles mock son accesibles', async () => {
    const cuentas = [
      ['hcueva@uide.edu.ec',        'superadmin'],
      ['locondezh@uide.edu.ec',     'director'],
      ['davalarezole@uide.edu.ec',  'coordinador'],
      ['mipalaciosmo@uide.edu.ec',  'docente'],
      ['yetorresbe@uide.edu.ec',    'docente'],
    ]
    for (const [email, rolEsperado] of cuentas) {
      const user = await loginMock(email, '1234')
      expect(user.rol).toBe(rolEsperado)
      await logout()
    }
  })
})

describe('normalizarRolesPerfil — modelo multi-rol (roles[])', () => {
  it('convierte rol string legado en roles array', () => {
    const p = normalizarRolesPerfil({ rol: 'director' })
    expect(p.roles).toEqual(['director'])
    expect(p.rol).toBe('director')
  })

  it('respeta roles[] existente y deriva el rol principal por jerarquía', () => {
    const p = normalizarRolesPerfil({ roles: ['coordinador', 'director'] })
    expect(p.roles).toEqual(['coordinador', 'director'])
    expect(p.rol).toBe('director') // director > coordinador
  })

  it('un usuario con doble rol conserva ambos en la sesión', async () => {
    const p = normalizarRolesPerfil({ rol: 'docente', roles: ['docente', 'coordinador'] })
    expect(p.roles).toContain('docente')
    expect(p.roles).toContain('coordinador')
    expect(p.rol).toBe('coordinador') // coordinador > docente
  })

  it('el login mock siempre entrega roles[] normalizado', async () => {
    const user = await loginMock('mipalaciosmo@uide.edu.ec', '1234')
    expect(Array.isArray(user.roles)).toBe(true)
    expect(user.roles).toContain('docente')
    await logout()
  })
})
