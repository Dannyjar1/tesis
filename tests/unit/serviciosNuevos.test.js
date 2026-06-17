/**
 * Tests de los servicios nuevos: validación de teléfono (perfilService) y
 * planes de mejora (RF-037).
 * Corren en modo mock (sin Firebase): localStorage como almacenamiento.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { validarTelefonoWhatsapp } from '../../src/services/perfilService'
import { crearPlanMejora, getPlanesMejora } from '../../src/services/planesMejoraService'

const PERIODO = '2026-TEST'

beforeEach(() => {
  localStorage.clear()
})

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

describe('Planes de mejora (RF-037)', () => {
  const base = {
    docente_uid: 'uid_doc', docente_nombre: 'Docente Prueba', periodo_id: PERIODO,
    descripcion: 'Recuperar 4h de tutoría en 2 semanas',
    fecha_compromiso: '2026-07-01', responsable_nombre: 'Directora de Carrera',
  }

  it('crea un plan con fecha y responsable (no solo notificación)', async () => {
    const plan = await crearPlanMejora(base)
    expect(plan.estado).toBe('abierto')
    expect(plan.fecha_registro).toBeTruthy()
    expect(plan.responsable_nombre).toBe('Directora de Carrera')
  })

  it('rechaza plan sin descripción, fecha o responsable', async () => {
    await expect(crearPlanMejora({ ...base, descripcion: ' ' })).rejects.toThrow(/descripción/)
    await expect(crearPlanMejora({ ...base, fecha_compromiso: '' })).rejects.toThrow(/fecha/)
    await expect(crearPlanMejora({ ...base, responsable_nombre: '' })).rejects.toThrow(/responsable/)
  })

  it('los planes quedan consultables por período y docente', async () => {
    await crearPlanMejora(base)
    await crearPlanMejora({ ...base, docente_uid: 'uid_otro', docente_nombre: 'Otro' })
    expect((await getPlanesMejora(PERIODO)).length).toBe(2)
    expect((await getPlanesMejora(PERIODO, 'uid_doc')).length).toBe(1)
  })
})
