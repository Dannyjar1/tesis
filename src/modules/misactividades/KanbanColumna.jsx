import ActividadCard from './ActividadCard'

const ESTILOS_COLUMNA = {
  por_hacer:   { header: 'bg-gray-100 text-gray-700',     punto: 'bg-gray-400',   borde: 'border-gray-200' },
  en_progreso: { header: 'bg-blue-50 text-blue-700',      punto: 'bg-blue-500',   borde: 'border-blue-200' },
  completada:  { header: 'bg-green-50 text-green-700',    punto: 'bg-green-500',  borde: 'border-green-200' },
}

export default function KanbanColumna({
  estado, label, tarjetas,
  onDragStart, onDragOver, onDrop, arrastrando,
  onActualizar, onEliminar,
}) {
  const est = ESTILOS_COLUMNA[estado]
  const esDestino = arrastrando && arrastrando !== estado

  return (
    <div
      className={`flex flex-col rounded-2xl border-2 transition-colors min-h-[400px] ${
        esDestino ? 'border-uide-primary/50 bg-uide-primary/5' : `${est.borde} bg-gray-50`
      }`}
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, estado)}
    >
      {/* Cabecera de columna */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl ${est.header}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${est.punto}`} />
        <span className="text-sm font-bold tracking-wide">{label}</span>
        <span className="ml-auto text-xs font-semibold opacity-60">{tarjetas.length}</span>
      </div>

      {/* Área de tarjetas */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {tarjetas.length === 0 && (
          <div className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${
            esDestino ? 'border-uide-primary/40' : 'border-gray-200'
          }`}>
            <p className="text-xs text-gray-400">
              {esDestino ? 'Soltar aquí' : 'Sin actividades'}
            </p>
          </div>
        )}
        {tarjetas.map(a => (
          <ActividadCard
            key={a.id}
            actividad={a}
            onDragStart={onDragStart}
            onActualizar={onActualizar}
            onEliminar={onEliminar}
          />
        ))}
      </div>
    </div>
  )
}
