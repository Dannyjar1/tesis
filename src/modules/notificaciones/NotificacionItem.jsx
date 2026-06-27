import { useState } from 'react'
import { formatearFecha } from '../../utils/formatters'

const ESTILOS = {
  bajo_cumplimiento:        { borde: 'border-red-200',   fondo: 'bg-red-50',   punto: 'bg-red-500'   },
  sin_distributivo:         { borde: 'border-amber-200', fondo: 'bg-amber-50', punto: 'bg-amber-500' },
  distributivo_aprobado:    { borde: 'border-green-200', fondo: 'bg-green-50', punto: 'bg-green-500' },
  error_validacion:         { borde: 'border-red-200',   fondo: 'bg-red-50',   punto: 'bg-red-400'   },
  sistema:                  { borde: 'border-blue-200',  fondo: 'bg-blue-50',  punto: 'bg-blue-400'  },
  solicitud_rol:            { borde: 'border-purple-200',fondo: 'bg-purple-50',punto: 'bg-purple-500'},
  solicitud_rol_aceptada:   { borde: 'border-green-200', fondo: 'bg-green-50', punto: 'bg-green-500' },
  solicitud_rol_rechazada:  { borde: 'border-red-200',   fondo: 'bg-red-50',   punto: 'bg-red-400'   },
}

/**
 * Item individual de notificación en la bandeja.
 * Referencia: RF-019, RN-016.
 */
export default function NotificacionItem({ notificacion, onMarcarLeida, onResolver }) {
  const [procesando, setProcesando] = useState(false)
  if (!notificacion) return null
  const { id, titulo, mensaje, tipo, leida, fecha_creacion, solicitud, resuelta } = notificacion
  const est = ESTILOS[tipo] ?? { borde: 'border-gray-200', fondo: 'bg-gray-50', punto: 'bg-gray-400' }
  const esSolicitudAccionable = tipo === 'solicitud_rol' && solicitud && !resuelta

  async function resolver(aceptada) {
    setProcesando(true)
    try { await onResolver?.(notificacion, aceptada) }
    finally { setProcesando(false) }
  }

  return (
    <div className={`flex gap-3 p-4 rounded-xl border transition-all ${
      leida && !esSolicitudAccionable ? 'border-gray-200 bg-white' : `${est.borde} ${est.fondo}`
    }`}>
      <div className="flex-shrink-0 pt-1.5">
        <span className={`w-2 h-2 rounded-full block ${leida ? 'bg-gray-200' : est.punto}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${leida && !esSolicitudAccionable ? 'text-gray-500' : 'text-gray-900'}`}>
          {titulo}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{mensaje}</p>
        <p className="text-xs text-gray-300 mt-1">{formatearFecha(fecha_creacion)}</p>

        {/* Acciones del director sobre la solicitud de rol (F.2) */}
        {esSolicitudAccionable && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => resolver(true)}
              disabled={procesando}
              className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
            >
              {procesando ? '…' : 'Aceptar'}
            </button>
            <button
              onClick={() => resolver(false)}
              disabled={procesando}
              className="text-xs font-semibold text-red-700 border border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>
        )}
        {tipo === 'solicitud_rol' && resuelta && (
          <p className={`text-xs font-semibold mt-1.5 ${resuelta === 'aceptada' ? 'text-green-700' : 'text-red-700'}`}>
            {resuelta === 'aceptada' ? 'Aceptada ✓' : 'Rechazada'}
          </p>
        )}
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
