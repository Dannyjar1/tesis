/**
 * Tests del modelo jerárquico histórico:
 * Período Académico → Carreras → Usuarios (docentes y administrativos).
 * Cubre: asignación por carrera, inmutabilidad del historial (finalizado),
 * copia de estructura entre períodos y trazabilidad por usuario.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  assertEditable,
  getEstructuraPeriodo,
  getAsignacionCarrera,
  getCarrerasDeUsuario,
  guardarAsignacionCarrera,
  quitarCarreraDePeriodo,
  copiarEstructura,
} from '../../src/services/estructuraPeriodoService'

const ACTIVO     = { id: '2026-A-T', nombre: '2026-A test', estado: 'activo',     fecha_inicio: '2026-05-04' }
const PROXIMO    = { id: '2026-B-T', nombre: '2026-B test', estado: 'proximo',    fecha_inicio: '2026-09-01' }
const FINALIZADO = { id: '2025-B-T', nombre: '2025-B test', estado: 'finalizado', fecha_inicio: '2025-09-01' }

beforeEach(() => {
  localStorage.clear()
})

describe('Inmutabilidad del historial (períodos finalizados)', () => {
  it('rechaza cualquier escritura sobre un período finalizado', async () => {
    expect(() => assertEditable(FINALIZADO)).toThrow(/historial/)
    await expect(
      guardarAsignacionCarrera(FINALIZADO, 'derecho', { docentes_uid: ['x'] })
    ).rejects.toThrow(/finalizado/)
    await expect(quitarCarreraDePeriodo(FINALIZADO, 'derecho')).rejects.toThrow()
    await expect(copiarEstructura(ACTIVO.id, FINALIZADO)).rejects.toThrow()
  })

  it('permite escribir en períodos activo y próximo', () => {
    expect(() => assertEditable(ACTIVO)).not.toThrow()
    expect(() => assertEditable(PROXIMO)).not.toThrow()
  })

  it('los períodos finalizados SÍ se consultan (lectura libre)', async () => {
    const estructura = await getEstructuraPeriodo(FINALIZADO.id)
    expect(estructura).toEqual({}) // sin error: lectura permitida
  })
})

describe('Jerarquía Período → Carreras → Usuarios', () => {
  it('asigna coordinador, docentes y administrativos a una carrera del período', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'sistemas-informacion', {
      coordinador_uid:     'uid_davalarezole',
      docentes_uid:        ['uid_mipalaciosmo', 'uid_yetorresbe'],
      administrativos_uid: ['uid_dajaramillogu'],
    })
    const asig = await getAsignacionCarrera(ACTIVO.id, 'sistemas-informacion')
    expect(asig.coordinador_uid).toBe('uid_davalarezole')
    expect(asig.docentes_uid).toHaveLength(2)
    expect(asig.administrativos_uid).toContain('uid_dajaramillogu')
    expect(asig.periodo_id).toBe(ACTIVO.id)   // trazabilidad: la asignación conoce su período
    expect(asig.carrera_id).toBe('sistemas-informacion')
  })

  it('cada período mantiene su estructura independiente', async () => {
    await guardarAsignacionCarrera(ACTIVO,  'derecho', { docentes_uid: ['uid_a'] })
    await guardarAsignacionCarrera(PROXIMO, 'derecho', { docentes_uid: ['uid_b', 'uid_c'] })
    const enActivo  = await getAsignacionCarrera(ACTIVO.id, 'derecho')
    const enProximo = await getAsignacionCarrera(PROXIMO.id, 'derecho')
    expect(enActivo.docentes_uid).toEqual(['uid_a'])
    expect(enProximo.docentes_uid).toEqual(['uid_b', 'uid_c'])
  })

  it('define indicadores propios del período por carrera', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'marketing', {
      indicadores: [{ id: 'i1', nombre: 'Cumplimiento ≥ 80%' }],
    })
    const asig = await getAsignacionCarrera(ACTIVO.id, 'marketing')
    expect(asig.indicadores[0].nombre).toMatch(/80%/)
  })

  it('quitar una carrera del período no afecta a otros períodos', async () => {
    await guardarAsignacionCarrera(ACTIVO,  'arquitectura', { docentes_uid: ['uid_x'] })
    await guardarAsignacionCarrera(PROXIMO, 'arquitectura', { docentes_uid: ['uid_x'] })
    await quitarCarreraDePeriodo(ACTIVO, 'arquitectura')
    expect(await getEstructuraPeriodo(ACTIVO.id)).not.toHaveProperty('arquitectura')
    expect(await getEstructuraPeriodo(PROXIMO.id)).toHaveProperty('arquitectura')
  })
})

describe('Trazabilidad por usuario', () => {
  it('responde en qué carreras participa un usuario en un período', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'sistemas-informacion', { docentes_uid: ['uid_doc1'] })
    await guardarAsignacionCarrera(ACTIVO, 'marketing',            { docentes_uid: ['uid_doc1'] }) // compartido
    await guardarAsignacionCarrera(ACTIVO, 'derecho',              { coordinador_uid: 'uid_doc1' })
    const carreras = await getCarrerasDeUsuario(ACTIVO.id, 'uid_doc1')
    expect(carreras.sort()).toEqual(['derecho', 'marketing', 'sistemas-informacion'])
  })
})

describe('Copia de estructura entre períodos (nuevo semestre)', () => {
  it('mantiene carreras, responsables e indicadores del período anterior', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'derecho', {
      coordinador_uid: 'uid_coord',
      docentes_uid:    ['uid_d1'],
      indicadores:     [{ id: 'i1', nombre: 'SUS ≥ 70' }],
    })
    const n = await copiarEstructura(ACTIVO.id, PROXIMO)
    expect(n).toBe(1)
    const copia = await getAsignacionCarrera(PROXIMO.id, 'derecho')
    expect(copia.coordinador_uid).toBe('uid_coord')
    expect(copia.docentes_uid).toEqual(['uid_d1'])
    expect(copia.indicadores).toHaveLength(1)
  })

  it('puede copiar solo la estructura sin los usuarios (copiarUsuarios=false)', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'derecho', {
      coordinador_uid: 'uid_coord', docentes_uid: ['uid_d1'],
    })
    await copiarEstructura(ACTIVO.id, PROXIMO, { copiarUsuarios: false })
    const copia = await getAsignacionCarrera(PROXIMO.id, 'derecho')
    expect(copia.coordinador_uid).toBe('uid_coord')
    expect(copia.docentes_uid).toEqual([])
  })

  it('la copia NO modifica el período de origen (historial intacto)', async () => {
    await guardarAsignacionCarrera(ACTIVO, 'derecho', { docentes_uid: ['uid_d1'] })
    await copiarEstructura(ACTIVO.id, PROXIMO)
    await guardarAsignacionCarrera(PROXIMO, 'derecho', { docentes_uid: ['uid_OTRO'] })
    const origen = await getAsignacionCarrera(ACTIVO.id, 'derecho')
    expect(origen.docentes_uid).toEqual(['uid_d1'])
  })
})
