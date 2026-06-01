import { useContext } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useAuth } from '../auth/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { ROL_LABELS, ESTADO_COLORES, ESTADO_LABELS } from '../../utils/constants'
import { formatearFecha, haceCuanto } from '../../utils/formatters'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DocenteCard from './DocenteCard'
import CumplimientoChart from './CumplimientoChart'
import AlertasPanel from './AlertasPanel'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function DashboardPage() {
  const { user }          = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const {
    cargando, docentes, alertas, datosGrafico,
    categoriasTotales, stats, ultimaActualizacion,
  } = useDashboard(periodoActivo?.id)

  if (cargando) return (
    <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.nombre_completo} — {ROL_LABELS[user?.rol]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ultimaActualizacion && (
            <span className="text-xs text-gray-400">
              Actualizado {haceCuanto(ultimaActualizacion)}
            </span>
          )}
          {periodoActivo && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORES[periodoActivo.estado]}`}>
              {periodoActivo.nombre}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total docentes"        valor={stats.totalDocentes}  color="text-uide-primary" />
        <StatCard label="Aprobados"             valor={stats.aprobados}      color="text-green-600" />
        <StatCard label="En borrador"           valor={stats.borradores}     color="text-amber-600" />
        <StatCard
          label="Cumplimiento promedio"
          valor={`${stats.cumplimientoPromedio}%`}
          color={stats.cumplimientoPromedio >= 80 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Layout 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          <CumplimientoChart datos={datosGrafico} />

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Estado por docente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docentes.map(d => <DocenteCard key={d.uid} docente={d} />)}
            </div>
          </div>

          {/* PieChart de distribución por categoría */}
          {categoriasTotales.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Distribución de horas por categoría CES
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoriasTotales}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {categoriasTotales.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => [`${value}h`, 'Horas/semana']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          <AlertasPanel alertas={alertas} />

          {/* Período activo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Período académico</h3>
            {periodoActivo ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{periodoActivo.nombre}</p>
                <p className="text-xs text-gray-400">
                  {formatearFecha(periodoActivo.fecha_inicio)} – {formatearFecha(periodoActivo.fecha_fin)}
                </p>
                <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORES[periodoActivo.estado]}`}>
                  {ESTADO_LABELS[periodoActivo.estado] ?? periodoActivo.estado}
                </span>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin período activo.</p>
            )}
          </div>

          {/* Resumen de estados */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de estados</h3>
            <div className="space-y-2">
              {[
                { label: 'Aprobados',   valor: stats.aprobados,  color: 'bg-green-500' },
                { label: 'En borrador', valor: stats.borradores, color: 'bg-amber-400' },
                { label: 'Sin asignar', valor: stats.sinAsignar, color: 'bg-gray-300'  },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{item.valor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicador de actualización en tiempo real */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <p className="text-xs text-gray-500">Actualización automática cada 15 s</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{valor}</p>
    </div>
  )
}
