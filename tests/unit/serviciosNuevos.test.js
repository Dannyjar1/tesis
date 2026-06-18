/**
 * Tests de validación de teléfono (perfilService).
 * Corren en modo mock (sin Firebase).
 */
import { describe, it, expect } from 'vitest'
import { validarTelefonoWhatsapp } from '../../src/services/perfilService'

describe('validarTelefonoWhatsapp', () => {
  it('acepta formato internacional válido', () => {
    expect(validarTelefonoWhatsapp('+593991234567')).toBeNull()
  })
  it('acepta vacío (campo opcional)', () => {
    expect(validarTelefonoWhatsapp('')).toBeNull()
    expect(validarTelefonoWhatsapp(null)).toBeNull()
  })
  it('rechaza número sin +', () => {
    expect(validarTelefonoWhatsapp('0991234567')).toMatch(/empezar con \+/)
  })
  it('rechaza menos de 10 o más de 15 dígitos', () => {
    expect(validarTelefonoWhatsapp('+59399')).not.toBeNull()
    expect(validarTelefonoWhatsapp('+5939912345678901')).not.toBeNull()
  })
  it('rechaza espacios y guiones', () => {
    expect(validarTelefonoWhatsapp('+593 99 123 4567')).not.toBeNull()
  })
})
