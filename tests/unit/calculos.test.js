import { describe, it, expect } from 'vitest'
import {
  calcularHorasPreparacion,
  calcularHorasTutoria,
  calcularHorasPC,
  calcularHorasPPP,
  calcularHorasTitulacion,
  calcularHorasGraduados,
  calcularHorasCoordinacion,
  validarCierreDistributivo,
} from '../../src/utils/calculos'

describe('calcularHorasPreparacion — 60% de docencia directa', () => {
  it('18h docencia → 10.8h preparación', () => {
    expect(calcularHorasPreparacion(18)).toBe(10.8)
  })
  it('10h docencia → 6h preparación', () => {
    expect(calcularHorasPreparacion(10)).toBe(6)
  })
  it('0h docencia → 0h preparación', () => {
    expect(calcularHorasPreparacion(0)).toBe(0)
  })
})

describe('calcularHorasTutoria — según número de materias', () => {
  it('1 materia → 1h', () => expect(calcularHorasTutoria(1)).toBe(1))
  it('2 materias → 1h', () => expect(calcularHorasTutoria(2)).toBe(1))
  it('3 materias → 2h', () => expect(calcularHorasTutoria(3)).toBe(2))
  it('4 materias → 2h', () => expect(calcularHorasTutoria(4)).toBe(2))
  it('5 materias → 3h', () => expect(calcularHorasTutoria(5)).toBe(3))
  it('6 materias → 3h', () => expect(calcularHorasTutoria(6)).toBe(3))
  it('0 materias → 0h', () => expect(calcularHorasTutoria(0)).toBe(0))
  it('7+ materias → máximo 3h (tope del reglamento)', () => expect(calcularHorasTutoria(7)).toBe(3))
})

describe('calcularHorasPC — 1h cada 10 estudiantes en PC', () => {
  it('25 estudiantes → 2h', () => expect(calcularHorasPC(25)).toBe(2))
  it('10 estudiantes → 1h', () => expect(calcularHorasPC(10)).toBe(1))
  it('9 estudiantes → 0h', () => expect(calcularHorasPC(9)).toBe(0))
  it('30 estudiantes → 3h', () => expect(calcularHorasPC(30)).toBe(3))
})

describe('calcularHorasPPP — 1h cada 15 estudiantes en PPP', () => {
  it('30 estudiantes → 2h', () => expect(calcularHorasPPP(30)).toBe(2))
  it('15 estudiantes → 1h', () => expect(calcularHorasPPP(15)).toBe(1))
  it('14 estudiantes → 0h', () => expect(calcularHorasPPP(14)).toBe(0))
})

describe('calcularHorasTitulacion — director + tribunal', () => {
  it('3 director + 2 tribunal → 7h', () => {
    expect(calcularHorasTitulacion(3, 2)).toBe(7)
  })
  it('0 director + 0 tribunal → 0h', () => {
    expect(calcularHorasTitulacion(0, 0)).toBe(0)
  })
  it('1 director + 1 tribunal → 3h', () => {
    expect(calcularHorasTitulacion(1, 1)).toBe(3)
  })
})

describe('calcularHorasGraduados — 1h cada 80 graduados', () => {
  it('160 graduados → 2h', () => expect(calcularHorasGraduados(160)).toBe(2))
  it('80 graduados → 1h', () => expect(calcularHorasGraduados(80)).toBe(1))
  it('79 graduados → 0h', () => expect(calcularHorasGraduados(79)).toBe(0))
})

describe('calcularHorasCoordinacion — 3h fijas por rol (Fórmula 6)', () => {
  it('coordinador PPP: 3h', () => expect(calcularHorasCoordinacion(true, false)).toBe(3))
  it('coordinador PC: 3h', () => expect(calcularHorasCoordinacion(false, true)).toBe(3))
  it('ambos roles: 6h', () => expect(calcularHorasCoordinacion(true, true)).toBe(6))
  it('ningún rol: 0h', () => expect(calcularHorasCoordinacion(false, false)).toBe(0))
})

describe('validarCierreDistributivo — suma exacta de horas del contrato', () => {
  it('distributivo TC válido suma 40h', () => {
    const dist = {
      horas_docencia_directa: 18,
      horas_preparacion: 10.8,
      horas_tutoria: 2,
      horas_investigacion: 4,
      horas_vinculacion: 2,
      horas_titulacion: 3,
      horas_gestion: 0.2,
      horas_reduccion_cargo: 0,
    }
    const resultado = validarCierreDistributivo(dist, 40)
    expect(resultado.valido).toBe(true)
  })

  it('distributivo inválido devuelve diferencia y mensaje de error', () => {
    const dist = {
      horas_docencia_directa: 16,
      horas_preparacion: 9.6,
      horas_tutoria: 2,
      horas_investigacion: 4,
      horas_vinculacion: 2,
      horas_titulacion: 3,
      horas_gestion: 0,
      horas_reduccion_cargo: 0,
    }
    const resultado = validarCierreDistributivo(dist, 40)
    expect(resultado.valido).toBe(false)
    expect(resultado.diferencia).not.toBe(0)
    expect(resultado.mensaje).toContain('Error')
  })
})
