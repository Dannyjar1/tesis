/**
 * Validaciones específicas del módulo de distributivo para la capa de vista.
 * Delega a src/utils/validaciones.js (funciones puras testables).
 * Sprint 1: usar en DistributivoForm antes de permitir guardar/aprobar.
 * Referencia: RF-011, RN-003, RN-014.
 */
export {
  validarHorasDocencia,
  validarHorasInvestigacion,
  validarHorasGestion,
  validarDistributivo,
} from '../../utils/validaciones'

export { validarCierreDistributivo } from '../../utils/calculos'
