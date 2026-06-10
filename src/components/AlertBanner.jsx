const VARIANTES = {
  error: 'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  success: 'bg-green-50 border-green-300 text-green-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
}

/**
 * Banner de alerta reutilizable para mostrar mensajes de estado.
 * @param {'error'|'warning'|'success'|'info'} tipo
 */
export default function AlertBanner({ tipo = 'info', mensaje, onCerrar }) {
  if (!mensaje) return null
  return (
    <div className={`flex items-start justify-between gap-3 border rounded-lg px-4 py-3 text-sm ${VARIANTES[tipo]}`}>
      <span>{mensaje}</span>
      {onCerrar && (
        <button
          onClick={onCerrar}
          className="flex-shrink-0 font-bold opacity-60 hover:opacity-100"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  )
}
