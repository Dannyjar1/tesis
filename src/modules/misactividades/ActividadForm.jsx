import { useState } from 'react'
import { CATEGORIA_LABELS } from '../../utils/constants'

const VACIO = { titulo: '', categoria_ces: 'docencia', fecha_limite: '' }

export default function ActividadForm({ inicial = null, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState(inicial ?? VACIO)
  const [error, setError] = useState('')

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return }
    onGuardar({ ...form, titulo: form.titulo.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.titulo}
          onChange={e => set('titulo', e.target.value)}
          placeholder="Ej: Preparar material de clase"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* Categoría CES */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría CES</label>
        <select
          value={form.categoria_ces}
          onChange={e => set('categoria_ces', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
        >
          {Object.entries(CATEGORIA_LABELS).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
      </div>

      {/* Fecha límite */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha límite (opcional)</label>
        <input
          type="date"
          value={form.fecha_limite}
          onChange={e => set('fecha_limite', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {cargando ? 'Guardando…' : inicial ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  )
}
