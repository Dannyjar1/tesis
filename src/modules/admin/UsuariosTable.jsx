import { ROL_LABELS } from '../../utils/constants'

/**
 * Tabla de gestión de usuarios y roles del sistema.
 * Sprint 1: CRUD completo via Firebase Auth Admin SDK + Firestore /usuarios.
 * Referencia: RF-020, RN-008.
 */
export default function UsuariosTable({ usuarios = [], onEditar, onToggleActivo }) {
  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-400">No hay usuarios registrados. Sprint 1.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {usuarios.map(u => (
            <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{u.nombre_completo}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{ROL_LABELS[u.rol] ?? u.rol}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button onClick={() => onEditar?.(u)} className="text-xs text-uide-secondary hover:underline">Editar</button>
                <button onClick={() => onToggleActivo?.(u)} className="text-xs text-gray-400 hover:text-red-600">
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
