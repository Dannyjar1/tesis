import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import { getDefiniciones, guardarRol, toggleActivoRol } from '../../services/rolesService'
import { MODULOS, MODULO_POR_ID } from '../../utils/modulos'

/**
 * GestionRoles — Administración RBAC del superadmin:
 * crear/modificar roles, activarlos o desactivarlos, y definir qué MÓDULOS
 * visualiza cada rol y qué ACCIONES puede ejecutar (visualizar, crear,
 * editar, aprobar, eliminar, exportar, administrar) — sin tocar código.
 *
 * Los roles de sistema no se eliminan (sostienen la operación institucional)
 * pero sí admiten ajustar sus módulos/acciones. Los roles personalizados
 * (ej. "Auditor CACES") quedan asignables como cargos en Usuarios y Roles.
 */
export default function GestionRoles() {
  const [roles, setRoles]       = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal]       = useState(null) // null | { rol? }
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')

  const cargar = async () => {
    setCargando(true)
    setRoles(await getDefiniciones())
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  async function handleGuardar(datos) {
    setGuardando(true)
    setError('')
    try {
      await guardarRol(datos)
      setModal(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggle(r) {
    await toggleActivoRol(r.id, !(r.activo !== false))
    await cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {roles.length} rol(es) — los permisos de un usuario son la <span className="font-medium">suma</span> de sus roles activos
        </p>
        <button
          onClick={() => setModal({})}
          className="px-4 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
        >
          + Nuevo rol
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Módulos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.id}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {(r.modulos ?? []).slice(0, 6).map(m => (
                        <span key={m} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {MODULO_POR_ID[m]?.label ?? m}
                        </span>
                      ))}
                      {(r.modulos ?? []).length > 6 && (
                        <span className="text-[10px] text-gray-400">+{r.modulos.length - 6} más</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.es_sistema ? 'bg-[#003087]/10 text-[#003087]' : 'bg-teal-100 text-teal-700'}`}>
                      {r.es_sistema ? 'Sistema' : 'Personalizado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.activo !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setModal({ rol: r })} className="text-xs text-blue-600 hover:underline">Editar</button>
                    {r.id !== 'superadmin' && (
                      <button onClick={() => handleToggle(r)} className={`text-xs ${r.activo !== false ? 'text-gray-400 hover:text-red-600' : 'text-green-600 hover:underline'}`}>
                        {r.activo !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        abierto={!!modal}
        onCerrar={() => { setModal(null); setError('') }}
        titulo={modal?.rol ? `Editar rol — ${modal.rol.nombre}` : 'Nuevo rol'}
        ancho="max-w-2xl"
      >
        {modal && (
          <RolForm
            rol={modal.rol}
            onGuardar={handleGuardar}
            onCancelar={() => { setModal(null); setError('') }}
            cargando={guardando}
            error={error}
          />
        )}
      </Modal>
    </div>
  )
}

function RolForm({ rol, onGuardar, onCancelar, cargando, error }) {
  const [nombre, setNombre]   = useState(rol?.nombre ?? '')
  const [modulos, setModulos] = useState(rol?.modulos ?? [])
  const [acciones, setAcciones] = useState(rol?.acciones ?? {})

  function toggleModulo(id) {
    setModulos(prev => {
      if (prev.includes(id)) {
        setAcciones(a => { const n = { ...a }; delete n[id]; return n })
        return prev.filter(m => m !== id)
      }
      // Al otorgar un módulo, "visualizar" va por defecto
      setAcciones(a => ({ ...a, [id]: ['visualizar'] }))
      return [...prev, id]
    })
  }

  function toggleAccion(moduloId, accion) {
    setAcciones(prev => {
      const actual = prev[moduloId] ?? []
      const nuevas = actual.includes(accion)
        ? actual.filter(x => x !== accion)
        : [...actual, accion]
      return { ...prev, [moduloId]: nuevas }
    })
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); onGuardar({ id: rol?.id, nombre, modulos, acciones, activo: rol?.activo ?? true }) }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del rol *</label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          disabled={rol?.es_sistema}
          placeholder="ej: Auditor CACES"
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] disabled:bg-gray-50"
        />
        {rol?.es_sistema && (
          <p className="text-[11px] text-gray-400 mt-1">Rol de sistema: el nombre es fijo; sus módulos y acciones sí son configurables.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">Módulos que visualiza y acciones que puede ejecutar</p>
        <div className="space-y-1.5 max-h-80 overflow-y-auto border border-gray-100 rounded-lg p-2">
          {MODULOS.map(m => {
            const otorgado = modulos.includes(m.id)
            return (
              <div key={m.id} className={`rounded-lg px-2 py-1.5 ${otorgado ? 'bg-[#003087]/5' : ''}`}>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={otorgado}
                    onChange={() => toggleModulo(m.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#003087] focus:ring-[#003087]"
                  />
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[10px] text-gray-400">{m.path}</span>
                </label>
                {otorgado && m.acciones.length > 1 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 pl-6">
                    {m.acciones.map(a => (
                      <label key={a} className="flex items-center gap-1 text-[11px] text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(acciones[m.id] ?? []).includes(a)}
                          onChange={() => toggleAccion(m.id, a)}
                          className="h-3 w-3 rounded border-gray-300 text-[#003087] focus:ring-[#003087]"
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
        <button
          type="submit"
          disabled={cargando}
          className="px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {cargando ? 'Guardando...' : 'Guardar rol'}
        </button>
      </div>
    </form>
  )
}
