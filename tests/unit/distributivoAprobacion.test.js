/**
 * Doble aprobación del distributivo (director + docente) — FASE 7.
 * Corre en modo mock (db null en test): localStorage como almacenamiento.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  crearDistributivo,
  aprobarDistributivo,
  confirmarDistributivoDocente,
  observarDistributivo,
} from '../../src/services/distributivoService'
import { ESTADOS_DISTRIBUTIVO } from '../../src/utils/constants'

const DOCENTE = 'uid_test'
const PERIODO = '2026-APROB'
const DIRECTOR = 'uid_dir'

// Distributivo que suma exactamente 40h (TC).
const HORAS_40 = {
  docente_uid: DOCENTE,
  periodo_id: PERIODO,
  tipo_contrato: 'tiempo_completo',
  horas_docencia_directa: 18,
  horas_preparacion: 10.8,
  horas_tutoria: 2,
  horas_investigacion: 4,
  horas_vinculacion: 3,
  horas_gestion: 2.2,
  horas_reduccion_cargo: 0,
}

beforeEach(() => localStorage.clear())

async function crearEnBorrador(extra = {}) {
  return crearDistributivo({ ...HORAS_40, ...extra })
}

describe('Aprobación del director (primera firma)', () => {
  it('deja el distributivo EN REVISIÓN, no aprobado, y registra al director', async () => {
    const dist = await crearEnBorrador()
    const res = await aprobarDistributivo(dist.id, DIRECTOR, 40)
    expect(res.estado).toBe(ESTADOS_DISTRIBUTIVO.EN_REVISION)
    expect(res.aprobado_por).toBe(DIRECTOR)
  })

  it('permite aprobar aunque el total no cierre exacto (validación 40h informativa)', async () => {
    // Estructura oficial UIDE: la suma de 40h es informativa, NO bloquea la
    // aprobación. El director puede aprobar con cualquier total.
    const dist = await crearEnBorrador({ horas_gestion: 5 })   // suma 42.8 ≠ 40
    const res = await aprobarDistributivo(dist.id, DIRECTOR, 40)
    expect(res.estado).toBe(ESTADOS_DISTRIBUTIVO.EN_REVISION)
  })
})

describe('Confirmación del docente (segunda firma)', () => {
  it('solo aprueba definitivamente tras la firma del docente', async () => {
    const dist = await crearEnBorrador()
    await aprobarDistributivo(dist.id, DIRECTOR, 40)
    const res = await confirmarDistributivoDocente(dist.id, DOCENTE)
    expect(res.estado).toBe(ESTADOS_DISTRIBUTIVO.APROBADO)
    expect(res.confirmado_por_docente).toBe(DOCENTE)
  })

  it('no se puede confirmar un borrador que el director aún no aprobó', async () => {
    const dist = await crearEnBorrador()
    await expect(confirmarDistributivoDocente(dist.id, DOCENTE)).rejects.toThrow(/confirmación/i)
  })
})

describe('Observación del docente', () => {
  it('devuelve el distributivo a borrador con la observación y limpia la aprobación', async () => {
    const dist = await crearEnBorrador()
    await aprobarDistributivo(dist.id, DIRECTOR, 40)
    const res = await observarDistributivo(dist.id, 'Faltan horas de tutoría')
    expect(res.estado).toBe(ESTADOS_DISTRIBUTIVO.BORRADOR)
    expect(res.observacion_docente).toBe('Faltan horas de tutoría')
    expect(res.aprobado_por).toBeNull()
  })

  it('exige una observación no vacía', async () => {
    const dist = await crearEnBorrador()
    await aprobarDistributivo(dist.id, DIRECTOR, 40)
    await expect(observarDistributivo(dist.id, '  ')).rejects.toThrow(/obligatoria/i)
  })
})
