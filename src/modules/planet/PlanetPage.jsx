import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { getActividades } from '../../services/misActividadesService'
import { CATEGORIA_LABELS } from '../../utils/constants'
import PlanetCategoria from './PlanetCategoria'
import PlanetSemanaChart from './PlanetSemanaChart'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PlanetPage() {
  const { user } = useAuth()
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando]       = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    getActividades(user.uid).then(data => {
      setActividades(data)
      setCargando(false)
    })
  }, [user?.uid])

  const total      = actividades.length
  const completadas = actividades.filter(a => a.estado === 'completada').length
  const enProgreso  = actividades.filter(a => a.estado === 'en_progreso').length
  const pct = total > 0 ? Math.round(completadas / total * 100) : 0

  const porCategoria = Object.entries(CATEGORIA_LABELS).map(([cat, label]) => {
    const items       = actividades.filter(a => a.categoria_ces === cat)
    const completadasC = items.filter(a => a.estado === 'completada').length
    return { cat, label, total: items.length, completadas: completadasC }
  }).filter(c => c.total > 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Progreso</h1>
        <p className="text-gray-400 text-sm mt-0.5">Resumen visual de tus actividades por categoría CES</p>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : total === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-5xl mb-4">🌍</p>
          <p className="text-gray-500 font-medium">Sin actividades aún</p>
          <p className="text-gray-400 text-sm mt-1">Crea actividades en Mis Actividades para verlas aquí.</p>
        </div>
      ) : (
        <>
          {/* KPIs globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total" valor={total} color="text-gray-800" />
            <StatCard label="En progreso" valor={enProgreso} color="text-blue-600" />
            <StatCard label="Completadas" valor={completadas} color="text-green-600" />
            <StatCard label="Completado" valor={`${pct}%`} color={pct >= 60 ? 'text-green-600' : 'text-amber-600'} />
          </div>

          {/* Barra progreso global */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Progreso global</span>
              <span className="font-bold text-uide-primary">{pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-uide-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{completadas} de {total} actividades completadas</p>
          </div>

          {/* Por categoría CES */}
          {porCategoria.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Por categoría CES</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {porCategoria.map(c => (
                  <PlanetCategoria key={c.cat} {...c} />
                ))}
              </div>
            </div>
          )}

          {/* Chart por semana */}
          <PlanetSemanaChart actividades={actividades} />
        </>
      )}
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
