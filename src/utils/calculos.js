/**
 * Fórmulas de cálculo del distributivo académico.
 * @see Reglamento CES 2021 (RPC-SE-19-No.055-2021), Arts. 6, 7 y 8
 */

/**
 * Calcula horas de "otras actividades de docencia" (subcategoría 1.3 dentro de
 * DOCENCIA), estimadas como 60% de la docencia directa.
 * @param {number} horasDocenciaDirecta
 * @returns {number}
 * @see Art. 7 Reglamento CES 2021
 */
export function calcularHorasPreparacion(horasDocenciaDirecta) {
  return Math.round(horasDocenciaDirecta * 0.6 * 100) / 100
}

/**
 * Calcula horas de tutorías (subcategoría 1.2 dentro de DOCENCIA — ya no es una
 * categoría propia) según el número de materias asignadas.
 * @param {number} materiasAsignadas
 * @returns {number}
 * @see Art. 7 Reglamento CES 2021
 */
export function calcularHorasTutoria(materiasAsignadas) {
  if (materiasAsignadas <= 0) return 0
  if (materiasAsignadas <= 2) return 1
  if (materiasAsignadas <= 4) return 2
  if (materiasAsignadas <= 6) return 3
  return 3
}

/**
 * Calcula horas de vinculación por Prácticas Comunitarias (1h cada 10 estudiantes).
 * @param {number} estudiantesPC
 * @returns {number}
 * @see Art. 8 Reglamento CES 2021
 */
export function calcularHorasPC(estudiantesPC) {
  return Math.floor(estudiantesPC / 10)
}

/**
 * Calcula horas de vinculación por Prácticas Pre-Profesionales (1h cada 15 estudiantes).
 * @param {number} estudiantesPPP
 * @returns {number}
 * @see Art. 8 Reglamento CES 2021
 */
export function calcularHorasPPP(estudiantesPPP) {
  return Math.floor(estudiantesPPP / 15)
}

/**
 * Calcula horas de seguimiento a graduados (1h cada 80 graduados).
 * @param {number} totalGraduados
 * @returns {number}
 */
export function calcularHorasGraduados(totalGraduados) {
  return Math.floor(totalGraduados / 80)
}

/**
 * Calcula horas fijas de coordinación PPP o PC (3h fijas por rol).
 * @param {boolean} esCoordinadorPPP
 * @param {boolean} esCoordinadorPC
 * @returns {number}
 */
export function calcularHorasCoordinacion(esCoordinadorPPP, esCoordinadorPC) {
  return (esCoordinadorPPP ? 3 : 0) + (esCoordinadorPC ? 3 : 0)
}

/**
 * Valida que el distributivo sume exactamente las horas del contrato.
 * @param {Object} distributivo - Objeto con todas las actividades asignadas
 * @param {number} horasContrato - 40 (TC), 20 (MT) o según TP
 * @returns {{ valido: boolean, totalCalculado: number, diferencia: number, mensaje: string }}
 * @see Reglamento CES 2021, Art. 6
 */
export function validarCierreDistributivo(distributivo, horasContrato) {
  const totalCalculado = Math.round((
    (distributivo.horas_docencia_directa || 0) +
    (distributivo.horas_preparacion || 0) +
    (distributivo.horas_tutoria || 0) +
    (distributivo.horas_investigacion || 0) +
    (distributivo.horas_vinculacion || 0) +
    (distributivo.horas_gestion || 0) +
    (distributivo.horas_reduccion_cargo || 0)
  ) * 100) / 100

  const diferencia = Math.round((horasContrato - totalCalculado) * 100) / 100
  const valido = Math.abs(diferencia) < 0.01

  return {
    valido,
    totalCalculado,
    diferencia,
    mensaje: valido
      ? 'El distributivo es válido: suma exacta de horas del contrato.'
      : `Error: el distributivo suma ${totalCalculado}h pero el contrato exige ${horasContrato}h (diferencia: ${diferencia}h).`,
  }
}
