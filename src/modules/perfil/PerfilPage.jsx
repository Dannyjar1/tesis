import { useAuth } from '../auth/useAuth'
import {
  ROL_LABELS,
  TIPO_CONTRATO_LABELS,
  CARRERA_LABELS,
  CARGO_LABELS,
} from '../../utils/constants'

/**
 * PerfilPage — Perfil del usuario autenticado.
 * Muestra los datos institucionales en solo lectura.
 */
export default function PerfilPage() {
  const { user } = useAuth()

  if (!user) return null

  const inicial = user.nombre_completo?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Información institucional</p>
      </div>

      {/* Datos institucionales (solo lectura) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-uide-primary flex items-center justify-center text-white text-xl font-bold">
            {inicial}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.nombre_completo}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Rol</dt>
            <dd className="text-gray-800 font-medium mt-0.5">{ROL_LABELS[user.rol] ?? user.rol}</dd>
          </div>
          {user.tipo_contrato && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">Tipo de contrato</dt>
              <dd className="text-gray-800 font-medium mt-0.5">{TIPO_CONTRATO_LABELS[user.tipo_contrato]}</dd>
            </div>
          )}
          {user.carrera_id && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">Carrera</dt>
              <dd className="text-gray-800 font-medium mt-0.5">{CARRERA_LABELS[user.carrera_id] ?? user.carrera_id}</dd>
            </div>
          )}
          {user.cargo && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">Cargo</dt>
              <dd className="text-gray-800 font-medium mt-0.5">{CARGO_LABELS[user.cargo] ?? user.cargo}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
