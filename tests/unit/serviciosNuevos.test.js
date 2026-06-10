/**
 * Tests de los servicios nuevos: perfil WhatsApp (RF-038), Matriz de
 * Productividad (RF-043), carga compartida (RF-042) y planes de mejora (RF-037).
 * Corren en modo mock (sin Firebase): localStorage como almacenamiento.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { validarTelefonoWhatsapp } from '../../src/services/perfilService'
import {
  puedeElaborarDistributivo,
  validarCargaCompartida,
  puedeEditarMatriz,
  getMatrizDocente,
} from '../../src/services/matrizProductividadService'
import { crearPlanMejora, getPlanesMejora } from '../../src/services/planesMejoraService'

const PERIODO = '2026-TEST'

beforeEach(() => {
  localStorage.clear()
})

describe('validarTelefonoWhatsapp (RF-038)', () => {
  it('acepta formato internacional válido', () => {
    expect(validarTelefonoWhatsapp('+593991234567')).toBeNull()
  })
  it('acepta vacío (campo opcional, sin notificaciones)', () => {
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

describe('Matriz de Productividad (RF-043)', () => {
  it('docente con matriz aprobada puede elaborar distributivo', async () => {
    const gate = await puedeElaborarDistributivo('uid_mipalaciosmo', PERIODO)
    expect(gate.permitido).toBe(true)
  })

  it('docente sin matriz NO puede elaborar distributivo', async () => {
    const gate = await puedeElaborarDistributivo('uid_inexistente', PERIODO)
    expect(gate.permitido).toBe(false)
    expect(gate.motivo).toMatch(/Matriz de Productividad/)
  })

  it('la matriz llega pre-asignada desde Rectorado', async () => {
    const m = await getMatrizDocente('uid_mipalaciosmo', PERIODO)
    expect(m.origen).toBe('rectorado')
    expect(m.horas_investigacion).toBeGreaterThan(0)
  })

  it('solo Admin puede editar la matriz (solo lectura para el resto)', () => {
    expect(puedeEditarMatriz({ roles: ['admin'] })).toBe(true)
    expect(puedeEditarMatriz({ roles: ['director'] })).toBe(false)
    expect(puedeEditarMatriz({ roles: ['director', 'coordinador'] })).toBe(false)
    expect(puedeEditarMatriz({ rol: 'admin' })).toBe(true) // compat rol string
  })
})

describe('Docentes compartidos entre carreras (RF-042)', () => {
  it('valida cuando la suma no supera el contrato', async () => {
    const r = await validarCargaCompartida({
      docenteUid: 'uid_x', periodoId: PERIODO, carreraActual: 'sistemas-informacion',
      horasNuevas: 40, horasContrato: 40,
    })
    expect(r.valido).toBe(true)
    expect(r.total).toBe(40)
  })

  it('sin horas en otras carreras (mock) permite la carga completa', async () => {
    const r = await validarCargaCompartida({
      docenteUid: 'uid_x', periodoId: PERIODO, carreraActual: 'derecho',
      horasNuevas: 20, horasContrato: 20,
    })
    expect(r.valido).toBe(true)
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
