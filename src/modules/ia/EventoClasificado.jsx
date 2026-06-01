import { CATEGORIA_COLORES, CATEGORIA_LABELS } from '../../utils/constants'

/**
 * Evento con su etiqueta de clasificación IA y botón de corrección.
 * Referencia: RF-015, RF-016, RN-006.
 */
export default function EventoClasificado({ clasificacion, onCorregir }) {
  if (!clasificacion) return null

  const { texto_analizado, categoria_predicha, confianza, fue_corregida, categoria_corregida } = clasificacion
  const categoriaFinal = fue_corregida ? categoria_corregida : categoria_predicha

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <p className="text-sm text-gray-700 mb-2.5 line-clamp-2 leading-relaxed">
        {texto_analizado}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORIA_COLORES[categoriaFinal]}`}>
          {CATEGORIA_LABELS[categoriaFinal]}
        </span>

        {!fue_corregida && (
          <span className="text-xs text-gray-400">
            {Math.round((confianza ?? 0) * 100)}% confianza
          </span>
        )}

        {fue_corregida && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
            Corregido
          </span>
        )}

        {!fue_corregida && onCorregir && (
          <button
            onClick={() => onCorregir(clasificacion)}
            className="text-xs text-uide-secondary hover:text-uide-primary hover:underline ml-auto transition"
          >
            Corregir →
          </button>
        )}
      </div>
    </div>
  )
}
