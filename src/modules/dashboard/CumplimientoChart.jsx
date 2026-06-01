import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { UMBRAL_ALERTA_DEFAULT } from '../../utils/constants'

/**
 * Gráfico de barras horizontal — cumplimiento por docente.
 * Referencia: HU-15, RF-017, RNF-002.
 */
export default function CumplimientoChart({ datos = [] }) {
  if (datos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Cumplimiento por docente</h3>
        <div className="h-40 flex items-center justify-center">
          <p className="text-xs text-gray-400">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Cumplimiento por docente</h3>
        <span className="text-xs text-gray-400">Umbral mínimo: {UMBRAL_ALERTA_DEFAULT}%</span>
      </div>
      <ResponsiveContainer width="100%" height={datos.length * 64 + 20}>
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={100}
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, _name, props) => [
              `${value}% (${props.payload.contrato})`,
              'Cumplimiento semanal',
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <ReferenceLine
            x={UMBRAL_ALERTA_DEFAULT}
            stroke="#EF4444"
            strokeDasharray="4 2"
            label={{ value: `${UMBRAL_ALERTA_DEFAULT}%`, position: 'insideTopRight', fontSize: 10, fill: '#EF4444' }}
          />
          <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {datos.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.porcentaje >= UMBRAL_ALERTA_DEFAULT ? '#10B981' : '#EF4444'}
                opacity={entry.porcentaje === 0 ? 0.25 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
