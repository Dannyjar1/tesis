/**
 * Formatea un Timestamp de Firestore o Date a string legible en español.
 * @param {Date|Object} fecha
 * @returns {string}
 */
export function formatearFecha(fecha) {
  if (!fecha) return '—'
  const d = fecha.toDate ? fecha.toDate() : new Date(fecha)
  return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Formatea horas decimales a "Xh Ymin".
 * @param {number} horas
 * @returns {string}
 */
export function formatearHoras(horas) {
  if (horas === null || horas === undefined) return '—'
  const h = Math.floor(horas)
  const min = Math.round((horas - h) * 60)
  if (min === 0) return `${h}h`
  return `${h}h ${min}min`
}

/**
 * Formatea un número como porcentaje entero.
 * @param {number} valor - entre 0 y 100
 * @returns {string}
 */
export function formatearPorcentaje(valor) {
  if (valor === null || valor === undefined) return '—'
  return `${Math.round(valor)}%`
}

/**
 * Abrevia un nombre completo a "Nombre A." para uso en tablas.
 * @param {string} nombreCompleto
 * @returns {string}
 */
export function abreviarNombre(nombreCompleto) {
  if (!nombreCompleto) return '—'
  const partes = nombreCompleto.trim().split(' ')
  if (partes.length <= 1) return nombreCompleto
  return `${partes[0]} ${partes[partes.length - 1][0]}.`
}

/**
 * Formatea una fecha ISO a "HH:MM".
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatearHora(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Formatea rango horario a "HH:MM – HH:MM".
 * @param {string|Date} inicio
 * @param {string|Date} fin
 * @returns {string}
 */
export function formatearRangoHora(inicio, fin) {
  return `${formatearHora(inicio)} – ${formatearHora(fin)}`
}

/**
 * Formatea una fecha a "lunes 22 de mayo".
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatearDiaCompleto(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const s = d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Devuelve inicio (lunes 00:00) y fin (domingo 23:59) de la semana con offset.
 * @param {number} offsetSemanas - 0 = actual, -1 = anterior, +1 = siguiente
 * @returns {{ inicio: Date, fin: Date }}
 */
export function getSemana(offsetSemanas = 0) {
  const hoy = new Date()
  const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - diaSemana + offsetSemanas * 7)
  lunes.setHours(0, 0, 0, 0)
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)
  return { inicio: lunes, fin: domingo }
}

/**
 * Formatea un rango semanal a "19 – 25 de mayo de 2026".
 * @param {Date} inicio
 * @param {Date} fin
 * @returns {string}
 */
export function formatearRangoSemana(inicio, fin) {
  const diaI = inicio.getDate()
  const diaF = fin.getDate()
  const mesI = inicio.toLocaleDateString('es-EC', { month: 'long' })
  const mesF = fin.toLocaleDateString('es-EC', { month: 'long' })
  const anio = fin.getFullYear()
  if (mesI === mesF) return `${diaI} – ${diaF} de ${mesI} de ${anio}`
  return `${diaI} de ${mesI} – ${diaF} de ${mesF} de ${anio}`
}

/**
 * Indica hace cuánto tiempo en texto legible.
 * @param {string|Date} fecha
 * @returns {string}
 */
export function haceCuanto(fecha) {
  if (!fecha) return 'Nunca'
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
  if (min < 1) return 'Hace un momento'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)} días`
}
