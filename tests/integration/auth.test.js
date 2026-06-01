import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { login, logout, getCurrentUser } from '../../src/services/authService'

describe('authService (mock) — flujo de autenticación', () => {
  afterEach(async () => {
    await logout()
  })

  it('login con credenciales correctas retorna usuario', async () => {
    const user = await login('director@uide.edu.ec', '1234')
    expect(user.email).toBe('director@uide.edu.ec')
    expect(user.rol).toBe('director')
    expect(user.password).toBeUndefined()
  })

  it('login con credenciales incorrectas lanza error', async () => {
    await expect(login('director@uide.edu.ec', 'wrong')).rejects.toThrow()
  })

  it('getCurrentUser retorna null antes de login', () => {
    expect(getCurrentUser()).toBeNull()
  })

  it('getCurrentUser retorna usuario después de login', async () => {
    await login('coordinador@uide.edu.ec', '1234')
    const user = getCurrentUser()
    expect(user?.rol).toBe('coordinador')
  })

  it('logout limpia la sesión', async () => {
    await login('admin@uide.edu.ec', '1234')
    await logout()
    expect(getCurrentUser()).toBeNull()
  })

  it('todos los roles mock son accesibles', async () => {
    const cuentas = [
      ['director@uide.edu.ec', 'director'],
      ['coordinador@uide.edu.ec', 'coordinador'],
      ['docente.tc@uide.edu.ec', 'docente_tc'],
      ['docente.mt@uide.edu.ec', 'docente_mt'],
      ['admin@uide.edu.ec', 'admin'],
    ]
    for (const [email, rolEsperado] of cuentas) {
      const user = await login(email, '1234')
      expect(user.rol).toBe(rolEsperado)
      await logout()
    }
  })
})
