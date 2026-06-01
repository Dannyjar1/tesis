import { DOMINIO_INSTITUCIONAL, HORAS_MAXIMAS_TC } from './constants'

/**
 * Valida que el email pertenece al dominio institucional UIDE.
 * @param {string} email
 * @returns {boolean}
 */
export function esEmailInstitucional(email) {
  return typeof email === 'string' && email.endsWith(DOMINIO_INSTITUCIONAL)
}

/**
 * Valida horas de docencia directa según tipo de contrato.
 * @param {number} horas
 * @param {string} tipoContrato - 'TC' | 'MT' | 'TP'
 * @returns {{ valido: boolean, mensaje: string }}
 */
export function validarHorasDocencia(horas, tipoContrato) {
  if (tipoContrato === 'TC') {
    const { min, max } = HORAS_MAXIMAS_TC.docencia_directa
    if (horas < min || horas > max) {
      return { valido: false, mensaje: `Docencia directa TC: mínimo ${min}h, máximo ${max}h semanales.` }
    }
  }
  return { valido: true, mensaje: '' }
}

/**
 * Valida que las horas de investigación no superen el máximo.
 * @param {number} horas
 * @param {string} tipoContrato
 * @returns {{ valido: boolean, mensaje: string }}
 */
export function validarHorasInvestigacion(horas, tipoContrato) {
  if (tipoContrato === 'TC' && horas > HORAS_MAXIMAS_TC.investigacion.max) {
    return { valido: false, mensaje: `Investigación TC: máximo ${HORAS_MAXIMAS_TC.investigacion.max}h semanales.` }
  }
  return { valido: true, mensaje: '' }
}

/**
 * Valida que las horas de gestión no superen el máximo.
 * @param {number} horas
 * @param {string} tipoContrato
 * @returns {{ valido: boolean, mensaje: string }}
 */
export function validarHorasGestion(horas, tipoContrato) {
  if (tipoContrato === 'TC' && horas > HORAS_MAXIMAS_TC.gestion.max) {
    return { valido: false, mensaje: `Gestión institucional TC: máximo ${HORAS_MAXIMAS_TC.gestion.max}h semanales.` }
  }
  return { valido: true, mensaje: '' }
}

/**
 * Ejecuta todas las validaciones del distributivo y devuelve los errores encontrados.
 * @param {Object} distributivo
 * @param {string} tipoContrato
 * @returns {{ valido: boolean, errores: string[] }}
 */
export function validarDistributivo(distributivo, tipoContrato) {
  const validaciones = [
    validarHorasDocencia(distributivo.horas_docencia_directa, tipoContrato),
    validarHorasInvestigacion(distributivo.horas_investigacion, tipoContrato),
    validarHorasGestion(distributivo.horas_gestion, tipoContrato),
  ]
  const errores = validaciones.filter(v => !v.valido).map(v => v.mensaje)
  return { valido: errores.length === 0, errores }
}
