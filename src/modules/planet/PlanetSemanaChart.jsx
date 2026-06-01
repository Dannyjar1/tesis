import { useMemo } from 'react'

function getMondayKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Dom
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

function formatSemana(isoMonday) {
  return new Date(isoMonday + 'T12:00:00').toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short',
  })
}

export default function PlanetSemanaChart({ actividades }) {
  const semanas = useMemo(() => {
    const mapa = {}
    actividades.forEach(a => {
      const ref = a.fecha_creacion
      if (!ref) return
      const key = getMondayKey(ref.split('T')[0])
      if (!mapa[key]) mapa[key] = { key, label: formatSemana(key), total: 0, completadas: 0 }
      mapa[key].total++
      if (a.estado === 'completada') mapa[key].completadas++
    })
    return Object.values(mapa)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-8)
  }, [actividades])

  if (semanas.length === 0) return null

  const maxTotal = Math.max(...semanas.map(s => s.total), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-5">Actividad por semana</h2>

      <div className="flex items-end gap-2 h-36">
        {semanas.map(s => {
          const altoTotal = Math.round((s.total / maxTotal) * 100)
          const altoComp  = Math.round((s.completadas / maxTotal) * 100)
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1 h-full">
              <div className="flex-1 w-full relative flex flex-col justify-end overflow-hidden rounded-t-sm">
                {/* Barra total (fondo) */}
                <div
                  className="w-full bg-uide-light rounded-t-sm absolute bottom-0"
                  style={{ height: `${altoTotal}%` }}
                />
                {/* Barra completadas (encima) */}
                <div
                  className="w-full bg-uide-primary rounded-t-sm absolute bottom-0"
                  style={{ height: `${altoComp}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 text-center leading-tight mt-1">{s.label}</span>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-uide-primary inline-block" />
          Completadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-uide-light border border-gray-200 inline-block" />
          Total
        </span>
      </div>
    </div>
  )
}
