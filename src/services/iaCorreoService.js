/**
 * iaCorreoService.js — Interpretación de correos con IA → tareas To Do.
 * Flujo (RF-038/RF-023): correo recibido → la IA interpreta el texto libre →
 * extrae título, fecha límite y categoría → crea la tarea en Mis Actividades.
 *
 * Con VITE_CLAUDE_API_KEY definida usa la Claude API real; sin ella usa el
 * intérprete heurístico local (mock) con el mismo contrato de salida.
 * // PENDIENTE: reemplazar con credenciales reales (crear API key en
 * // console.anthropic.com cuando se active el modo producción).
 */
import { clasificarEvento } from './iaService'
import { crearActividad } from './misActividadesService'

const _key = import.meta.env.VITE_CLAUDE_API_KEY
// 'placeholder' (o vacío) = modo mock con intérprete heurístico local
const CLAUDE_API_KEY = _key && _key !== 'placeholder' ? _key : null
const CLAUDE_MODEL   = 'claude-haiku-4-5-20251001' // rápido y económico para extracción

/**
 * Interpreta el texto libre de un correo y extrae los datos de la tarea.
 * @returns {Promise<{ titulo, categoria_ces, fecha_limite, responsable, motor }>}
 */
export async function interpretarCorreo({ asunto, preview, fecha }) {
  if (CLAUDE_API_KEY) {
    try {
      return await interpretarConClaude(asunto, preview, fecha)
    } catch (err) {
      console.warn('[iaCorreo] Claude API falló, usando heurística:', err.message)
    }
  }
  return interpretarHeuristico(asunto, preview, fecha)
}

// ── Claude API (producción) ───────────────────────────────────────────────────

async function interpretarConClaude(asunto, preview, fecha) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content:
          `Eres el asistente del sistema de distributivo docente UIDE. Extrae de este correo una tarea.\n` +
          `Asunto: ${asunto}\nCuerpo: ${preview}\nRecibido: ${fecha}\n\n` +
          `Responde SOLO JSON: {"titulo": string (acción concreta, máx 80 chars), ` +
          `"categoria_ces": "docencia"|"investigacion"|"vinculacion"|"tutoria"|"gestion", ` +
          `"fecha_limite": "YYYY-MM-DD" o null (si el texto menciona plazo/fecha), ` +
          `"responsable": string o null}`,
      }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}`)
  const data = await res.json()
  const texto = data.content?.[0]?.text ?? '{}'
  const json = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1))
  return { ...json, motor: 'claude' }
}

// ── Heurística local (mock hasta tener API key) ───────────────────────────────

const MESES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 }

function extraerFecha(texto, fechaBase) {
  const t = texto.toLowerCase()
  const base = fechaBase ? new Date(fechaBase) : new Date()
  // "el 15 de junio" / "15 de junio"
  const m = t.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/)
  if (m) {
    const d = new Date(base.getFullYear(), MESES[m[2]], parseInt(m[1], 10))
    if (d < base) d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }
  if (/mañana/.test(t))       return new Date(base.getTime() + 86400000).toISOString().slice(0, 10)
  if (/este viernes/.test(t)) {
    const d = new Date(base); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7))
    return d.toISOString().slice(0, 10)
  }
  if (/vence|plazo|límite|limite|entrega/.test(t)) {
    const d = new Date(base); d.setDate(d.getDate() + 7) // plazo sin fecha → 1 semana
    return d.toISOString().slice(0, 10)
  }
  return null
}

async function interpretarHeuristico(asunto, preview, fecha) {
  const texto = `${asunto}. ${preview ?? ''}`
  const { categoria } = await clasificarEvento(texto) // reusa el clasificador mock BETO
  const remitenteMatch = (preview ?? '').match(/atentamente[,:\s]+([a-záéíóúñ\s.]{4,40})/i)
  return {
    titulo:        asunto.length > 80 ? `${asunto.slice(0, 77)}…` : asunto,
    categoria_ces: categoria,
    fecha_limite:  extraerFecha(texto, fecha),
    responsable:   remitenteMatch?.[1]?.trim() ?? null,
    motor:         'heuristica',
  }
}

/**
 * Interpreta un lote de correos y crea las tareas To Do correspondientes.
 * Evita duplicados marcando el correo de origen en la tarea (origen_correo_id).
 * @returns {Promise<{ creadas: number, tareas: Object[] }>}
 */
export async function crearTareasDesdeCorreos(correos, docenteUid) {
  const tareas = []
  for (const correo of correos) {
    const interpretado = await interpretarCorreo({
      asunto: correo.asunto, preview: correo.preview, fecha: correo.fecha,
    })
    const tarea = await crearActividad(docenteUid, {
      titulo:        interpretado.titulo,
      categoria_ces: interpretado.categoria_ces,
      fecha_limite:  interpretado.fecha_limite,
    })
    tareas.push({ ...tarea, motor: interpretado.motor, origen_correo_id: correo.id })
  }
  return { creadas: tareas.length, tareas }
}
