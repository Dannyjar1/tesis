import { formatearFecha } from '../../utils/formatters'

const ESTILOS = {
  bajo_cumplimiento:     { borde: 'border-red-200',   fondo: 'bg-red-50',   punto: 'bg-red-500'   },
  sin_distributivo:      { borde: 'border-amber-200', fondo: 'bg-amber-50', punto: 'bg-amber-500' },
  distributivo_aprobado: { borde: 'border-green-200', fondo: 'bg-green-50', punto: 'bg-green-500' },
  error_validacion:      { borde: 'border-red-200',   fondo: 'bg-red-50',   punto: 'bg-red-400'   },
  sistema:               { borde: 'border-blue-200',  fondo: 'bg-blue-50',  punto: 'bg-blue-400'  },
}

/**
 * Item individual de notificación en la bandeja.
 * Referencia: RF-019, RN-016.
 */
export default function NotificacionItem({ notificacion, onMarcarLeida }) {
  if (!notificacion) return null
  const { id, titulo, mensaje, tipo, leida, fecha_creacion } = notificacion
  const est = ESTILOS[tipo] ?? { borde: 'border-gray-200', fondo: 'bg-gray-50', punto: 'bg-gray-400' }

  return (
    <div className={`flex gap-3 p-4 rounded-xl border transition-all ${
      leida ? 'border-gray-200 bg-white' : `${est.borde} ${est.fondo}`
    }`}>
      <div className="flex-shrink-0 pt-1.5">
        <span className={`w-2 h-2 rounded-full block ${leida ? 'bg-gray-200' : est.punto}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${leida ? 'text-gray-500' : 'text-gray-900'}`}>
          {titulo}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{mensaje}</p>
        <p className="text-xs text-gray-300 mt-1">{formatearFecha(fecha_creacion)}</p>
      </div>

      {!leida && (
        <button
          onClick={() => onMarcarLeida?.(id)}
          className="flex-shrink-0 self-start mt-1 text-xs text-gray-400 hover:text-gray-700 transition"
          aria-label="Marcar como leída"
          title="Marcar como leída"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      )}
    </div>
  )
}
