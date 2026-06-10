/**
 * Lógica de cálculo automático de horas del distributivo para la capa de vista.
 * Delega los cálculos a src/utils/calculos.js (funciones puras testables).
 * Sprint 1: integrar con el formulario del distributivo.
 * @see Reglamento CES 2021, Arts. 6, 7 y 8
 */
export {
  calcularHorasPreparacion,
  calcularHorasTutoria,
  calcularHorasPC,
  calcularHorasPPP,
  calcularHorasTitulacion,
  calcularHorasGraduados,
  calcularHorasCoordinacion,
  validarCierreDistributivo,
} from '../../utils/calculos'

/**
 * Recalcula todo el distributivo a partir de los datos del formulario.
 * @param {Object} datos - Campos editables del formulario
 * @returns {Object} distributivo con todos los campos calculados
 */
export async function recalcularDistributivo(datos) {
  const {
    horas_docencia_directa = 0,
    materias_asignadas = 0,
    estudiantes_pc = 0,
    estudiantes_ppp = 0,
    proyectos_director = 0,
    proyectos_tribunal = 0,
    horas_investigacion = 0,
    horas_gestion = 0,
    horas_reduccion_cargo = 0,
  } = datos

  const { calcularHorasPreparacion, calcularHorasTutoria, calcularHorasPC, calcularHorasPPP, calcularHorasTitulacion } = await import('../../utils/calculos')

  const horas_preparacion = calcularHorasPreparacion(horas_docencia_directa)
  const horas_tutoria = calcularHorasTutoria(materias_asignadas)
  const horas_vinculacion = calcularHorasPC(estudiantes_pc) + calcularHorasPPP(estudiantes_ppp)
  const horas_titulacion = calcularHorasTitulacion(proyectos_director, proyectos_tribunal)

  return {
    horas_docencia_directa,
    horas_preparacion,
    horas_tutoria,
    horas_investigacion,
    horas_vinculacion,
    horas_titulacion,
    horas_gestion,
    horas_reduccion_cargo,
    total_horas: horas_docencia_directa + horas_preparacion + horas_tutoria +
      horas_investigacion + horas_vinculacion + horas_titulacion +
      horas_gestion + horas_reduccion_cargo,
  }
}
