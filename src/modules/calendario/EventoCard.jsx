import { CATEGORIA_COLORES, CATEGORIA_LABELS } from '../../utils/constants'
import { formatearHoras, formatearRangoHora } from '../../utils/formatters'

/**
 * Tarjeta de evento del calendario con horario y etiqueta de clasificación IA.
 * Sprint 2: muestra datos de Outlook. Sprint 3 (IA) rellena categoria_ia.
 * Referencia: RF-014, RF-015, RN-006.
 */
export default function EventoCard({ evento, onCorregir }) {
  if (!evento) return null

  const {
    titulo,
    descripcion,
    fecha_inicio,
    fecha_fin,
    duracion_horas,
    categoria_ia,
    confianza_ia,
    estado_clasificacion,
  } = evento

  const esProvisional = estado_clasificacion === 'provisional'
  const _esPendiente   = estado_clasificacion === 'pendiente'

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:shadow-sm transition-shadow group">
      <div className="flex items-start gap-3">
        {/* Franja de hora */}
        <div className="flex-shrink-0 text-right w-20 pt-0.5">
          <p className="text-xs font-semibold text-gray-600">
            {formatearRangoHora(fecha_inicio, fecha_fin).split('–')[0].trim()}
          </p>
          <p className="text-xs text-gray-400">
            {formatearHoras(duracion_horas)}
          </p>
        </div>

        {/* Borde de categoría */}
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          categoria_ia ? getBarColor(categoria_ia) : 'bg-gray-200'
        }`} />

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{titulo}</p>
          {descripcion && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{descripcion}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Chip de categoría IA (Sprint 3 lo rellena) */}
            {categoria_ia ? (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORIA_COLORES[categoria_ia]}`}>
                {CATEGORIA_LABELS[categoria_ia]}
                {confianza_ia && (
                  <span className="ml-1 opacity-60">{Math.round(confianza_ia * 100)}%</span>
                )}
              </span>
            ) : (
              <span className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-2 py-0.5 rounded-full">
                Sin clasificar
              </span>
            )}

            {/* Acción de corrección (Sprint 3) */}
            {esProvisional && onCorregir && (
              <button
                onClick={() => onCorregir(evento)}
                className="text-xs text-uide-secondary hover:text-uide-primary hover:underline transition-colors"
              >
                Corregir →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getBarColor(categoria) {
  const map = {
    docencia:     'bg-blue-400',
    investigacion:'bg-purple-400',
    vinculacion:  'bg-green-400',
    tutoria:      'bg-yellow-400',
    gestion:      'bg-orange-400',
  }
  return map[categoria] ?? 'bg-gray-300'
}
