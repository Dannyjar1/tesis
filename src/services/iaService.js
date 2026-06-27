/**
 * iaService.js — Clasificación IA (mock BETO) + Firestore /clasificaciones_ia y /feedback.
 * clasificarEvento() simula el pipeline BETO hasta que la Cloud Function esté desplegada.
 * RF-015, RF-016, RN-010.
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { CATEGORIAS } from '../utils/constants'

const COL_CLAS   = 'clasificaciones_ia'
const COL_FEED   = 'feedback'
const COL_EVENTOS = 'eventos_calendario'

const KEY_CLAS = (uid, periodo) => `uide_clas_${uid}_${periodo}`
const KEY_FEED = (uid)          => `uide_feedback_${uid}`

// ── Clasificador por reglas (simula BETO) ────────────────────────────────────
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
    // DOCENCIA incluye la tutoría (subcategoría 1.2): sus tokens se fusionan aquí.
    cat: CATEGORIAS.DOCENCIA,
    tokens: ['clase ', 'clases ', 'examen', 'parcial', 'módulo', 'grupo a', 'grupo b', 'tema:',
             'tutoría', 'tutoria', 'atención a estudiantes', 'atención estudiantes', 'consultas', 'oficina'],
    peso: 8,
  },
  {
    // GESTIÓN ACADÉMICA incluye la titulación (subcat. 4.9 Tutores, Lectores y
    // Grados): tribunal / defensa de grado no es Docencia (Excel oficial).
    cat: CATEGORIAS.GESTION,
    tokens: ['consejo', 'comité', 'planificación', 'reunión', 'período 2026', 'directivo', 'coordinación',
             'titulación', 'tribunal', 'defensa'],
    peso: 5,
  },
]

function calcularConfianza(cat, puntuacion, totalPuntos) {
  const base = totalPuntos > 0 ? puntuacion / totalPuntos : 0.2
  const ajuste = { docencia: 0.05, investigacion: 0.04, vinculacion: 0.03, gestion: 0.07 }
  return Math.min(0.97, Math.max(0.58, base + (ajuste[cat] ?? 0)))
}

/**
 * Clasifica un texto simulando BETO (NLP en español).
 * @returns {Promise<{ categoria: string, confianza: number, estado: string }>}
 */
export async function clasificarEvento(texto) {
  await new Promise(r => setTimeout(r, 60 + Math.random() * 80))
  const t = texto.toLowerCase()
  const puntos = {}
  for (const regla of REGLAS) {
    const matches = regla.tokens.filter(token => t.includes(token)).length
    if (matches > 0) puntos[regla.cat] = (puntos[regla.cat] ?? 0) + matches * regla.peso
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

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localLeerClas(uid, periodo) {
  const r = localStorage.getItem(KEY_CLAS(uid, periodo))
  return r ? JSON.parse(r) : []
}
function localGuardarClas(uid, periodo, lista) {
  localStorage.setItem(KEY_CLAS(uid, periodo), JSON.stringify(lista))
}
function localLeerFeed(uid) {
  const r = localStorage.getItem(KEY_FEED(uid))
  return r ? JSON.parse(r) : []
}
function localGuardarFeed(uid, lista) {
  localStorage.setItem(KEY_FEED(uid), JSON.stringify(lista))
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Clasifica todos los eventos pendientes en lote y guarda en Firestore.
 */
export async function clasificarLote(eventos, docenteUid, periodoId) {
  const pendientes = eventos.filter(e => e.estado_clasificacion === 'pendiente')
  if (pendientes.length === 0) return { clasificadas: 0, errores: 0 }

  const localClas = localLeerClas(docenteUid, periodoId)
  const KEY_EV_LOCAL = `uide_eventos_${docenteUid}_${periodoId}`
  const todosEventosLocal = JSON.parse(localStorage.getItem(KEY_EV_LOCAL) ?? '[]')

  let clasificadas = 0
  let errores = 0

  for (const evento of pendientes) {
    try {
      const texto = `${evento.titulo} ${evento.descripcion ?? ''}`.trim()
      const resultado = await clasificarEvento(texto)
      const clasId = `clas_${docenteUid}_${evento.id}`

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

      if (db) {
        try {
          await setDoc(doc(db, COL_CLAS, clasId), {
            ...nueva,
            fecha_clasificacion: Timestamp.now(),
          })
          const evRef = doc(db, COL_EVENTOS, `${docenteUid}_${evento.id}`)
          const evSnap = await getDoc(evRef)
          if (evSnap.exists()) {
            await updateDoc(evRef, {
              categoria_ia:         resultado.categoria,
              confianza_ia:         resultado.confianza,
              estado_clasificacion: 'provisional',
              clasificacion_ia_id:  clasId,
            })
          }
        } catch (err) {
          console.warn('[iaService] Firestore error en clasificarLote:', err.code)
        }
      }

      const idx = localClas.findIndex(c => c.evento_id === evento.id)
      if (idx >= 0) localClas[idx] = nueva
      else localClas.push(nueva)

      const idxEv = todosEventosLocal.findIndex(e => e.id === evento.id)
      if (idxEv >= 0) {
        todosEventosLocal[idxEv] = {
          ...todosEventosLocal[idxEv],
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

  localGuardarClas(docenteUid, periodoId, localClas)
  localStorage.setItem(KEY_EV_LOCAL, JSON.stringify(todosEventosLocal))
  return { clasificadas, errores }
}

/**
 * Devuelve clasificaciones del período ordenadas por fecha.
 */
export async function getClasificaciones(docenteUid, periodoId) {
  if (db) {
    try {
      const snap = await getDocs(
        query(
          collection(db, COL_CLAS),
          where('docente_uid', '==', docenteUid),
          where('periodo_id',  '==', periodoId),
          orderBy('fecha_clasificacion', 'asc'),
        )
      )
      if (!snap.empty) {
        const lista = snap.docs.map(d => {
          const data = d.data()
          return {
            ...data,
            fecha_clasificacion:
              data.fecha_clasificacion?.toDate?.()?.toISOString() ?? data.fecha_clasificacion,
          }
        })
        localGuardarClas(docenteUid, periodoId, lista)
        return lista
      }
    } catch (err) {
      console.warn('[iaService] Firestore no disponible para getClasificaciones:', err.code)
    }
  }
  return localLeerClas(docenteUid, periodoId)
    .sort((a, b) => new Date(a.fecha_clasificacion) - new Date(b.fecha_clasificacion))
}

/**
 * Registra corrección manual y la guarda en /feedback para reentrenamiento (RN-010).
 */
export async function registrarFeedback(clasificacionId, categoriaCorrecta, docenteUid, periodoId) {
  const feedId = `feed_${docenteUid}_${Date.now()}`

  if (db) {
    try {
      const clasRef = doc(db, COL_CLAS, clasificacionId)
      const clasSnap = await getDoc(clasRef)
      if (!clasSnap.exists()) throw new Error('Clasificación no encontrada.')
      const clas = clasSnap.data()

      await updateDoc(clasRef, {
        categoria_corregida: categoriaCorrecta,
        fue_corregida: true,
      })
      await setDoc(doc(db, COL_FEED, feedId), {
        id:                 feedId,
        clasificacion_id:   clasificacionId,
        docente_uid:        docenteUid,
        texto_original:     clas.texto_analizado,
        categoria_predicha: clas.categoria_predicha,
        categoria_correcta: categoriaCorrecta,
        fecha_correccion:   Timestamp.now(),
      })

      const evRef = doc(db, COL_EVENTOS, `${docenteUid}_${clas.evento_id}`)
      const evSnap = await getDoc(evRef)
      if (evSnap.exists()) {
        await updateDoc(evRef, {
          categoria_ia:         categoriaCorrecta,
          estado_clasificacion: 'confirmada',
        })
      }
      return
    } catch (err) {
      if (!err.code) throw err
      console.warn('[iaService] Firestore error en registrarFeedback:', err.code)
    }
  }

  // Fallback localStorage
  const localClas = localLeerClas(docenteUid, periodoId)
  const idx = localClas.findIndex(c => c.id === clasificacionId)
  if (idx === -1) throw new Error('Clasificación no encontrada.')
  const clas = localClas[idx]
  localClas[idx] = { ...clas, categoria_corregida: categoriaCorrecta, fue_corregida: true }
  localGuardarClas(docenteUid, periodoId, localClas)

  const feed = localLeerFeed(docenteUid)
  feed.push({
    id: feedId, clasificacion_id: clasificacionId, docente_uid: docenteUid,
    texto_original: clas.texto_analizado, categoria_predicha: clas.categoria_predicha,
    categoria_correcta: categoriaCorrecta, fecha_correccion: new Date().toISOString(),
  })
  localGuardarFeed(docenteUid, feed)

  const KEY_EV_LOCAL = `uide_eventos_${docenteUid}_${periodoId}`
  const eventos = JSON.parse(localStorage.getItem(KEY_EV_LOCAL) ?? '[]')
  const idxEv = eventos.findIndex(e => e.clasificacion_ia_id === clasificacionId)
  if (idxEv >= 0) {
    eventos[idxEv] = { ...eventos[idxEv], categoria_ia: categoriaCorrecta, estado_clasificacion: 'confirmada' }
    localStorage.setItem(KEY_EV_LOCAL, JSON.stringify(eventos))
  }
}

/**
 * Estadísticas del proceso de clasificación para el FeedbackPanel.
 */
export function getEstadisticas(docenteUid, periodoId) {
  const clases = localLeerClas(docenteUid, periodoId)
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
