import { useState } from 'react'
import { CATEGORIA_LABELS } from '../../utils/constants'

const VACIO = { titulo: '', categoria_ces: 'docencia', fecha_limite: '', imprevista: false }

// RF-041: las actividades imprevistas requieren registrarse con un mínimo de
// 2 semanas de anticipación a su fecha de ejecución (fecha_limite).
const DIAS_MINIMOS_IMPREVISTA = 14

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

    // RF-041: validación de anticipación mínima para imprevistas
    if (form.imprevista) {
      if (!form.fecha_limite) {
        setError('Una actividad imprevista requiere fecha de ejecución.')
        return
      }
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      const ejecucion = new Date(`${form.fecha_limite}T00:00:00`)
      const diasAnticipacion = Math.floor((ejecucion - hoy) / 86400000)
      if (diasAnticipacion < DIAS_MINIMOS_IMPREVISTA) {
        setError(`Las actividades imprevistas deben registrarse con mínimo 2 semanas de anticipación (faltan ${Math.max(diasAnticipacion, 0)} día${diasAnticipacion === 1 ? '' : 's'} para la fecha indicada).`)
        return
      }
    }

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

      {/* Actividad imprevista (RF-041) */}
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.imprevista ?? false}
          onChange={e => set('imprevista', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-uide-primary focus:ring-uide-primary"
        />
        <span className="text-xs text-gray-600">
          <span className="font-medium text-gray-800">Actividad imprevista</span>
          {' '}— no planificada en el distributivo. Debe registrarse con mínimo{' '}
          <span className="font-medium">2 semanas de anticipación</span> a su fecha de ejecución.
        </span>
      </label>

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
