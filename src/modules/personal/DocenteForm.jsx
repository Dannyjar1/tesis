import { useState } from 'react'
import { TIPO_CONTRATO, TIPO_CONTRATO_LABELS, ROLES } from '../../utils/constants'

const ROLES_ASIGNABLES = [
  { value: ROLES.DOCENTE,     label: 'Docente' },
  { value: ROLES.COORDINADOR, label: 'Coordinador Académico' },
  { value: ROLES.DIRECTOR,    label: 'Director de Carrera' },
]

export default function DocenteForm({ inicial = null, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    nombre:           inicial?.nombre           ?? '',
    apellido:         inicial?.apellido         ?? '',
    email:            inicial?.email            ?? '',
    titulo_academico: inicial?.titulo_academico ?? '',
    rol:              inicial?.rol              ?? ROLES.DOCENTE,
    tipo_contrato:    inicial?.tipo_contrato    ?? TIPO_CONTRATO.TIEMPO_COMPLETO,
  })

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.endsWith('@uide.edu.ec')) {
      alert('El correo debe ser institucional (@uide.edu.ec)')
      return
    }
    onGuardar(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nombres</label>
          <input
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            required
            placeholder="Lorena Elizabeth"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Apellidos</label>
          <input
            value={form.apellido}
            onChange={e => set('apellido', e.target.value)}
            required
            placeholder="Conde Zhingre"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Correo institucional</label>
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          required
          placeholder="usuario@uide.edu.ec"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
        />
        {form.email && !form.email.endsWith('@uide.edu.ec') && (
          <p className="text-xs text-red-500 mt-1">Debe terminar en @uide.edu.ec</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Título académico (opcional)</label>
        <input
          value={form.titulo_academico}
          onChange={e => set('titulo_academico', e.target.value)}
          placeholder="Ej. Mgs."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
        />
        <p className="text-xs text-gray-400 mt-1">Se antepone al nombre en las firmas del PDF del distributivo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cargo</label>
          <select
            value={form.rol}
            onChange={e => set('rol', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary bg-white"
          >
            {ROLES_ASIGNABLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de contrato</label>
          <select
            value={form.tipo_contrato}
            onChange={e => set('tipo_contrato', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary bg-white"
          >
            {Object.entries(TIPO_CONTRATO).map(([, val]) => (
              <option key={val} value={val}>{TIPO_CONTRATO_LABELS[val]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="px-4 py-2 text-sm font-semibold text-white bg-uide-primary rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {cargando ? 'Guardando…' : inicial ? 'Actualizar' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}
