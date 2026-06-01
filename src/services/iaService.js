/**
 * Servicio de clasificación IA — implementación mock (reglas de keywords).
 * Simula el pipeline BETO de functions/clasificacion/main.py.
 * Sprint Firebase: reemplazar clasificarEvento() con llamada HTTP a la Cloud Function.
 * Colecciones destino: /clasificaciones_ia, /feedback
 */
import { CATEGORIAS } from '../utils/constants'

const KEY_CLAS = (uid, periodo) => `uide_clas_${uid}_${periodo}`
const KEY_FEED = (uid)          => `uide_feedback_${uid}`

// ── Clasificador por reglas (simula BETO) ────────────────────────────────────
// Cada regla tiene tokens y peso. La categoría con mayor puntuación acumulada gana.
// Las reglas más específicas tienen mayor peso para evitar ambigüedades.
const REGLAS = [
  {
    cat: CATEGORIAS.INVESTIGACION,
    tokens: ['investigación', 'artículo', 'paper', 'publicación', 'revista', 'dgi', 'beto', 'cedia', 'científico'],
    peso: 10,
  },
  {
    cat: CATEGORIAS.VINCULACION,
    tokens: ['comunitaria', 'pre-profesional', 'prácticas pre', 'ppp', 'techs', 'innova', 'logis',
             'barrio', 'parroquia', 'comunidad', 'emprendedor', 'adultos mayores', 'ciudadana'],
    peso: 10,
  },
  {
    cat: CATEGORIAS.TUTORIA,
    tokens: ['tutoría', 'tutoria', 'atención a estudiantes', 'atención estudiantes', 'consultas', 'oficina'],
    peso: 10,
  },
  {
    cat: CATEGORIAS.DOCENCIA,
    tokens: ['clase ', 'clases ', 'examen', 'parcial', 'módulo', 'titulación', 'tribunal', 'defensa', 'grupo a', 'grupo b', 'tema:'],
    peso: 8,
  },
  {
    cat: CATEGORIAS.GESTION,
    tokens: ['consejo', 'comité', 'planificación', 'reunión', 'período 2026', 'directivo', 'coordinación'],
    peso: 5,
  },
]

function calcularConfianza(cat, puntuacion, totalPuntos) {
  const base = totalPuntos > 0 ? puntuacion / totalPuntos : 0.2
  const ajuste = { docencia: 0.05, investigacion: 0.04, vinculacion: 0.03, tutoria: 0.06, gestion: 0.07 }
  return Math.min(0.97, Math.max(0.58, base + (ajuste[cat] ?? 0)))
}

/**
 * Clasifica un texto (título + descripción) simulando BETO.
 * Sprint Firebase: reemplazar con POST a Cloud Function /clasificar.
 * @param {string} texto
 * @returns {Promise<{ categoria: string, confianza: number, estado: string }>}
 */
export async function clasificarEvento(texto) {
  await new Promise(r => setTimeout(r, 60 + Math.random() * 80))

  const t = texto.toLowerCase()
  const puntos = {}

  for (const regla of REGLAS) {
    const matches = regla.tokens.filter(token => t.includes(token)).length
    if (matches > 0) {
      puntos[regla.cat] = (puntos[regla.cat] ?? 0) + matches * regla.peso
    }
  }

  const totalPuntos = Object.values(puntos).reduce((s, v) => s + v, 0)
  const ganadora = totalPuntos > 0
    ? Object.entries(puntos).sort((a, b) => b[1] - a[1])[0][0]
    : CATEGORIAS.GESTION

  return {
    categoria: ganadora,
    confianza: calcularConfianza(ganadora, puntos[ganadora] ?? 0, totalPuntos),
    estado: 'provisional',
  }
}

// ── Almacenamiento mock (localStorage) ───────────────────────────────────────

function leerClas(uid, periodo) {
  const r = localStorage.getItem(KEY_CLAS(uid, periodo))
  return r ? JSON.parse(r) : []
}
function guardarClas(uid, periodo, lista) {
  localStorage.setItem(KEY_CLAS(uid, periodo), JSON.stringify(lista))
}
function leerFeed(uid) {
  const r = localStorage.getItem(KEY_FEED(uid))
  return r ? JSON.parse(r) : []
}
function guardarFeed(uid, lista) {
  localStorage.setItem(KEY_FEED(uid), JSON.stringify(lista))
}

/**
 * Clasifica todos los eventos pendientes en lote.
 * Actualiza estado_clasificacion y categoria_ia en los eventos del calendarioService.
 * @param {Object[]} eventos - Lista de eventos con estado_clasificacion === 'pendiente'
 * @param {string} docenteUid
 * @param {string} periodoId
 * @returns {Promise<{ clasificadas: number, errores: number }>}
 */
export async function clasificarLote(eventos, docenteUid, periodoId) {
  const pendientes = eventos.filter(e => e.estado_clasificacion === 'pendiente')
  if (pendientes.length === 0) return { clasificadas: 0, errores: 0 }

  const clases = leerClas(docenteUid, periodoId)
  const KEY_EVENTOS = `uide_eventos_${docenteUid}_${periodoId}`
  const todosEventos = JSON.parse(localStorage.getItem(KEY_EVENTOS) ?? '[]')
  let clasificadas = 0
  let errores = 0

  for (const evento of pendientes) {
    try {
      const texto = `${evento.titulo} ${evento.descripcion ?? ''}`.trim()
      const resultado = await clasificarEvento(texto)
      const clasId = `clas_${evento.id}`

      const nueva = {
        id:                  clasId,
        evento_id:           evento.id,
        docente_uid:         docenteUid,
        periodo_id:          periodoId,
        texto_analizado:     texto.toLowerCase().trim(),
        categoria_predicha:  resultado.categoria,
        confianza:           resultado.confianza,
        categoria_corregida: null,
        fue_corregida:       false,
        fecha_clasificacion: new Date().toISOString(),
        estado:              'provisional',
      }

      const idx = clases.findIndex(c => c.evento_id === evento.id)
      if (idx >= 0) clases[idx] = nueva
      else clases.push(nueva)

      const idxEv = todosEventos.findIndex(e => e.id === evento.id)
      if (idxEv >= 0) {
        todosEventos[idxEv] = {
          ...todosEventos[idxEv],
          categoria_ia:         resultado.categoria,
          confianza_ia:         resultado.confianza,
          estado_clasificacion: 'provisional',
          clasificacion_ia_id:  clasId,
        }
      }
      clasificadas++
    } catch {
      errores++
    }
  }

  guardarClas(docenteUid, periodoId, clases)
  localStorage.setItem(KEY_EVENTOS, JSON.stringify(todosEventos))
  return { clasificadas, errores }
}

/**
 * Devuelve clasificaciones del período ordenadas por fecha.
 * @param {string} docenteUid
 * @param {string} periodoId
 * @returns {Promise<Object[]>}
 */
export async function getClasificaciones(docenteUid, periodoId) {
  return leerClas(docenteUid, periodoId)
    .sort((a, b) => new Date(a.fecha_clasificacion) - new Date(b.fecha_clasificacion))
}

/**
 * Registra corrección manual y la guarda en /feedback para reentrenamiento (RN-010).
 * @param {string} clasificacionId
 * @param {string} categoriaCorrecta
 * @param {string} docenteUid
 * @param {string} periodoId
 */
export async function registrarFeedback(clasificacionId, categoriaCorrecta, docenteUid, periodoId) {
  const clases = leerClas(docenteUid, periodoId)
  const idx = clases.findIndex(c => c.id === clasificacionId)
  if (idx === -1) throw new Error('Clasificación no encontrada.')

  const clas = clases[idx]
  clases[idx] = { ...clas, categoria_corregida: categoriaCorrecta, fue_corregida: true }
  guardarClas(docenteUid, periodoId, clases)

  const feed = leerFeed(docenteUid)
  feed.push({
    id:                  `feed_${Date.now()}`,
    clasificacion_id:    clasificacionId,
    docente_uid:         docenteUid,
    texto_original:      clas.texto_analizado,
    categoria_predicha:  clas.categoria_predicha,
    categoria_correcta:  categoriaCorrecta,
    fecha_correccion:    new Date().toISOString(),
  })
  guardarFeed(docenteUid, feed)

  // Actualizar el evento en el calendario con la categoría corregida
  const KEY_EVENTOS = `uide_eventos_${docenteUid}_${periodoId}`
  const eventos = JSON.parse(localStorage.getItem(KEY_EVENTOS) ?? '[]')
  const idxEv = eventos.findIndex(e => e.clasificacion_ia_id === clasificacionId)
  if (idxEv >= 0) {
    eventos[idxEv] = {
      ...eventos[idxEv],
      categoria_ia:         categoriaCorrecta,
      estado_clasificacion: 'confirmada',
    }
    localStorage.setItem(KEY_EVENTOS, JSON.stringify(eventos))
  }
}

/**
 * Estadísticas del proceso de clasificación para el FeedbackPanel.
 * @param {string} docenteUid
 * @param {string} periodoId
 * @returns {{ total: number, correctas: number, corregidas: number, precision: number }}
 */
export function getEstadisticas(docenteUid, periodoId) {
  const clases = leerClas(docenteUid, periodoId)
  const total = clases.length
  const corregidas = clases.filter(c => c.fue_corregida).length
  const correctas = total - corregidas
  return {
    total,
    correctas,
    corregidas,
    precision: total > 0 ? Math.round((correctas / total) * 100) : 0,
  }
}

export function resetIAMock(docenteUid, periodoId) {
  localStorage.removeItem(KEY_CLAS(docenteUid, periodoId))
  localStorage.removeItem(KEY_FEED(docenteUid))
}
