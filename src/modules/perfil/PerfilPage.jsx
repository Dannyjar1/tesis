import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  ROL_LABELS,
  TIPO_CONTRATO_LABELS,
  CARRERA_LABELS,
  CARGO_LABELS,
} from '../../utils/constants'
import {
  actualizarTelefonoWhatsapp,
  validarTelefonoWhatsapp,
} from '../../services/perfilService'
import AlertBanner from '../../components/AlertBanner'
import { IconChat } from '../../components/icons'

/**
 * PerfilPage — Perfil del usuario autenticado.
 * Datos institucionales en solo lectura + número de WhatsApp editable
 * para las notificaciones automáticas (RF-038).
 */
export default function PerfilPage() {
  const { user } = useAuth()
  const [telefono, setTelefono]   = useState(user?.telefono_whatsapp ?? '')
  const [guardando, setGuardando] = useState(false)
  const [alerta, setAlerta]       = useState(null)

  if (!user) return null

  const errorFormato = validarTelefonoWhatsapp(telefono)
  const inicial = user.nombre_completo?.charAt(0).toUpperCase() ?? '?'

  async function handleGuardar(e) {
    e.preventDefault()
    setAlerta(null)
    setGuardando(true)
    try {
      const valor = await actualizarTelefonoWhatsapp(user.uid, telefono)
      setAlerta({
        tipo: 'success',
        msg: valor
          ? 'Número de WhatsApp guardado. Recibirás el resumen semanal (lunes 8:00) y recordatorios diarios (10:00).'
          : 'Número eliminado. Ya no recibirás notificaciones por WhatsApp.',
      })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Información institucional y preferencias de notificación</p>
      </div>

      {alerta && (
        <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />
      )}

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

      {/* Notificaciones WhatsApp (RF-038) */}
      <form onSubmit={handleGuardar} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <IconChat className="h-4 w-4 text-uide-primary" /> Notificaciones por WhatsApp
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Registra tu número para recibir el resumen semanal de actividades (lunes 8:00)
            y el recordatorio diario de vencimientos (10:00). Déjalo vacío si no deseas avisos.
          </p>
        </div>

        <div>
          <label htmlFor="telefono_whatsapp" className="block text-xs font-medium text-gray-600 mb-1">
            Número de WhatsApp
          </label>
          <input
            id="telefono_whatsapp"
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="+593XXXXXXXXX"
            className={`w-full sm:w-72 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
              errorFormato
                ? 'border-red-300 focus:ring-red-200'
                : 'border-gray-200 focus:ring-uide-secondary/40 focus:border-uide-secondary'
            }`}
          />
          {errorFormato && (
            <p className="text-xs text-red-600 mt-1">{errorFormato}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={guardando || !!errorFormato}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-uide-primary text-white hover:bg-uide-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
