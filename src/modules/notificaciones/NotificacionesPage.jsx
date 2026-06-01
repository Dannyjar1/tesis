import { useContext } from 'react'
import { NotificacionContext } from '../../context/NotificacionContext'
import NotificacionItem from './NotificacionItem'

export default function NotificacionesPage() {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useContext(NotificacionContext)

  const sinLeer = notificaciones.filter(n => !n.leida)
  const leidas  = notificaciones.filter(n => n.leida)

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {noLeidas > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {noLeidas} sin leer
            </p>
          )}
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="text-sm text-uide-secondary hover:text-uide-primary hover:underline transition"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Sin notificaciones */}
      {notificaciones.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-gray-500 text-sm">Sin notificaciones por el momento.</p>
          <p className="text-gray-400 text-xs mt-1">
            Las alertas de incumplimiento y aprobaciones aparecerán aquí.
          </p>
        </div>
      )}

      {/* Sin leer */}
      {sinLeer.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nuevas</p>
          {sinLeer.map(n => (
            <NotificacionItem key={n.id} notificacion={n} onMarcarLeida={marcarLeida} />
          ))}
        </div>
      )}

      {/* Leídas */}
      {leidas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Anteriores</p>
          {leidas.map(n => (
            <NotificacionItem key={n.id} notificacion={n} onMarcarLeida={marcarLeida} />
          ))}
        </div>
      )}
    </div>
  )
}
