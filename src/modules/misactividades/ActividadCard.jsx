import { useState } from 'react'
import { CATEGORIA_LABELS, CATEGORIA_COLORES } from '../../utils/constants'
import ActividadForm from './ActividadForm'
import Modal from '../../components/Modal'

export default function ActividadCard({ actividad, onActualizar, onEliminar, onDragStart }) {
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const { id, titulo, categoria_ces, fecha_limite, estado } = actividad

  const hoy = new Date().toISOString().split('T')[0]
  const vencida = fecha_limite && fecha_limite < hoy && estado !== 'completada'

  async function handleGuardar(datos) {
    setGuardando(true)
    await onActualizar(id, datos)
    setGuardando(false)
    setEditando(false)
  }

  return (
    <>
      <Modal
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Editar actividad"
      >
        <ActividadForm
          inicial={{ titulo, categoria_ces, fecha_limite: fecha_limite ?? '' }}
          onGuardar={handleGuardar}
          onCancelar={() => setEditando(false)}
          cargando={guardando}
        />
      </Modal>

      <div
        draggable
        onDragStart={e => onDragStart(e, id)}
        className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all select-none"
      >
        <p className="text-sm font-medium text-gray-800 leading-snug mb-2">{titulo}</p>

        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORIA_COLORES[categoria_ces]}`}>
          {CATEGORIA_LABELS[categoria_ces]}
        </span>

        {fecha_limite && (
          <p className={`text-[11px] mt-1.5 ${vencida ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {vencida ? '⚠ ' : ''}
            {new Date(fecha_limite + 'T12:00:00').toLocaleDateString('es-EC', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        )}

        <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setEditando(true)}
            className="p-1 text-gray-300 hover:text-gray-600 transition"
            aria-label="Editar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onEliminar(id)}
            className="p-1 text-gray-300 hover:text-red-500 transition"
            aria-label="Eliminar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
