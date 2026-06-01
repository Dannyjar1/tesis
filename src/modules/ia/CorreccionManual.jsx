import { CATEGORIA_LABELS } from '../../utils/constants'

/**
 * Interfaz de corrección manual de la clasificación IA.
 * Al guardar registra el feedback en /feedback para reentrenamiento (RN-010).
 * Referencia: RF-016, RN-006, RN-010.
 */
export default function CorreccionManual({ clasificacion, onGuardar, onCancelar, guardando = false }) {
  if (!clasificacion) return null

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg px-3 py-2.5">
        <p className="text-xs text-gray-400 mb-0.5">Evento a corregir:</p>
        <p className="text-sm text-gray-800 font-medium line-clamp-3">
          {clasificacion.texto_analizado}
        </p>
      </div>

      <p className="text-sm text-gray-600">Selecciona la categoría correcta:</p>

      <div className="grid grid-cols-1 gap-2">
        {Object.entries(CATEGORIA_LABELS).map(([key, label]) => {
          const esActual = key === (clasificacion.categoria_predicha)
          return (
            <button
              key={key}
              onClick={() => onGuardar?.(clasificacion, key)}
              disabled={guardando}
              className={`text-left px-4 py-2.5 text-sm border rounded-lg transition disabled:opacity-60 ${
                esActual
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-gray-200 hover:border-uide-secondary hover:bg-uide-light text-gray-700'
              }`}
            >
              <span className="font-medium">{label}</span>
              {esActual && (
                <span className="ml-2 text-xs text-amber-600">(asignado por IA)</span>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={onCancelar}
        className="text-xs text-gray-400 hover:text-gray-600 w-full text-center pt-1 transition"
      >
        Cancelar
      </button>
    </div>
  )
}
