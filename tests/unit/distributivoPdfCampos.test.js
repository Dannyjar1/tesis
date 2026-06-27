/**
 * Campos del PDF del distributivo: texto literal de Facultad/Escuela y título
 * académico por usuario (firmas). Modo mock (db null): persistencia en
 * localStorage/sesión.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { CARRERAS_SEED, USUARIOS_SEED } from '../../src/services/seedData'
import { actualizarTituloAcademico } from '../../src/services/perfilService'

describe('Facultad/Escuela literal para el PDF', () => {
  it('sistemas-informacion tiene el texto literal de la plantilla oficial', () => {
    const sis = CARRERAS_SEED.find(c => c.id === 'sistemas-informacion')
    expect(sis.facultad_escuela_pdf).toBe('CIENCIAS DE LA COMPUTACIÓN / SISTEMAS DE INFORMACIÓN')
    // El nombre largo institucional se conserva intacto para el resto del sistema.
    expect(sis.facultad).toBe('Facultad de Ingenierías Digitales y Tecnologías Emergentes')
  })

  it('las demás carreras no definen el campo (usan fallback en el PDF)', () => {
    const otras = CARRERAS_SEED.filter(c => c.id !== 'sistemas-informacion')
    expect(otras.every(c => c.facultad_escuela_pdf === undefined)).toBe(true)
  })
})

describe('Título académico en el seed', () => {
  it('Conde y Valarezo son "Mgs."; los demás docentes quedan vacíos', () => {
    const conde = USUARIOS_SEED.find(u => u.uid === 'uid_locondezh')
    const valarezo = USUARIOS_SEED.find(u => u.uid === 'uid_davalarezole')
    const palacios = USUARIOS_SEED.find(u => u.uid === 'uid_mipalaciosmo')
    expect(conde.titulo_academico).toBe('Mgs.')
    expect(valarezo.titulo_academico).toBe('Mgs.')
    expect(palacios.titulo_academico).toBe('')
  })
})

describe('actualizarTituloAcademico (mock)', () => {
  beforeEach(() => localStorage.clear())

  it('normaliza (trim) y lo persiste en la sesión y el overlay de usuarios', async () => {
    localStorage.setItem('uide_session', JSON.stringify({ uid: 'uid_x' }))
    const valor = await actualizarTituloAcademico('uid_x', '  PhD.  ')
    expect(valor).toBe('PhD.')

    const session = JSON.parse(localStorage.getItem('uide_session'))
    expect(session.titulo_academico).toBe('PhD.')

    const overlay = JSON.parse(localStorage.getItem('uide_sistema_usuarios'))
    expect(overlay.uid_x.titulo_academico).toBe('PhD.')
  })

  it('acepta vacío para eliminar el título', async () => {
    const valor = await actualizarTituloAcademico('uid_y', '')
    expect(valor).toBe('')
  })
})
