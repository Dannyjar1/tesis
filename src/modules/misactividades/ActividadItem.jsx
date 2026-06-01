import { useState } from 'react'
import { CATEGORIA_LABELS, CATEGORIA_COLORES } from '../../utils/constants'
import ActividadForm from './ActividadForm'

export default function ActividadItem({ actividad, onToggle, onActualizar, onEliminar }) {
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const { id, titulo, categoria_ces, fecha_limite, estado } = actividad
  const completada = estado === 'completada'

  const hoy = new Date().toISOString().split('T')[0]
  const vencida = fecha_limite && fecha_limite < hoy && !completada

  async function handleToggle() {
    setCargando(true)
    await onToggle(id)
    setCargando(false)
  }

  async function handleGuardar(datos) {
    setCargando(true)
    await onActualizar(id, datos)
    setCargando(false)
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="bg-white rounded-xl border border-uide-primary/30 p-4 shadow-sm">
        <ActividadForm
          inicial={{ titulo, categoria_ces, fecha_limite: fecha_limite ?? '' }}
          onGuardar={handleGuardar}
          onCancelar={() => setEditando(false)}
          cargando={cargando}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 bg-white rounded-xl border p-4 shadow-sm transition-opacity ${
      completada ? 'opacity-60 border-gray-200' : vencida ? 'border-red-200' : 'border-gray-200'
    }`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={cargando}
        aria-label={completada ? 'Marcar como pendiente' : 'Marcar como completada'}
        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          completada
            ? 'bg-uide-primary border-uide-primary'
            : 'border-gray-300 hover:border-uide-primary'
        }`}
      >
        {completada && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${completada ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {titulo}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORIA_COLORES[categoria_ces]}`}>
            {CATEGORIA_LABELS[categoria_ces]}
          </span>
          {fecha_limite && (
            <span className={`text-[11px] ${vencida ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              {vencida ? '⚠ Vencida: ' : 'Hasta: '}
              {new Date(fecha_limite + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setEditando(true)}
          className="p-1.5 text-gray-300 hover:text-gray-600 transition"
          aria-label="Editar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => onEliminar(id)}
          className="p-1.5 text-gray-300 hover:text-red-500 transition"
          aria-label="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
