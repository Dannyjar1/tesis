import { describe, it, expect } from 'vitest'
import {
  esEmailInstitucional,
  validarHorasDocencia,
  validarHorasInvestigacion,
  validarDistributivo,
  validarHorasGestion,
} from '../../src/utils/validaciones'

describe('esEmailInstitucional', () => {
  it('email @uide.edu.ec válido', () => {
    expect(esEmailInstitucional('docente@uide.edu.ec')).toBe(true)
  })
  it('email @gmail.com inválido', () => {
    expect(esEmailInstitucional('docente@gmail.com')).toBe(false)
  })
  it('email vacío inválido', () => {
    expect(esEmailInstitucional('')).toBe(false)
  })
})

describe('validarHorasDocencia TC', () => {
  it('18h dentro del rango válido', () => {
    expect(validarHorasDocencia(18, 'TC').valido).toBe(true)
  })
  it('3h mínimo permitido', () => {
    expect(validarHorasDocencia(3, 'TC').valido).toBe(true)
  })
  it('22h máximo permitido', () => {
    expect(validarHorasDocencia(22, 'TC').valido).toBe(true)
  })
  it('2h por debajo del mínimo → inválido', () => {
    expect(validarHorasDocencia(2, 'TC').valido).toBe(false)
  })
  it('23h por encima del máximo → inválido', () => {
    expect(validarHorasDocencia(23, 'TC').valido).toBe(false)
  })
})

describe('validarHorasInvestigacion TC', () => {
  it('16h máximo permitido', () => {
    expect(validarHorasInvestigacion(16, 'TC').valido).toBe(true)
  })
  it('17h supera el máximo → inválido', () => {
    expect(validarHorasInvestigacion(17, 'TC').valido).toBe(false)
  })
})

describe('validarHorasGestion TC', () => {
  it('12h máximo permitido', () => {
    expect(validarHorasGestion(12, 'TC').valido).toBe(true)
  })
  it('13h supera el máximo → inválido', () => {
    expect(validarHorasGestion(13, 'TC').valido).toBe(false)
  })
})

describe('validarDistributivo — validación compuesta (RF-011, RN-014)', () => {
  it('distributivo TC completamente válido', () => {
    const result = validarDistributivo(
      { horas_docencia_directa: 18, horas_investigacion: 4, horas_gestion: 2 },
      'TC'
    )
    expect(result.valido).toBe(true)
    expect(result.errores).toHaveLength(0)
  })

  it('distributivo TC con múltiples errores devuelve todos los mensajes', () => {
    const result = validarDistributivo(
      { horas_docencia_directa: 2, horas_investigacion: 17, horas_gestion: 13 },
      'TC'
    )
    expect(result.valido).toBe(false)
    expect(result.errores.length).toBeGreaterThanOrEqual(3)
  })

  it('contrato MT no aplica límites TC → válido con valores altos', () => {
    const result = validarDistributivo(
      { horas_docencia_directa: 2, horas_investigacion: 20, horas_gestion: 15 },
      'MT'
    )
    expect(result.valido).toBe(true)
  })
})
