import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  ROLES,
  ROL_LABELS,
  TIPO_CONTRATO_LABELS,
  CARRERA_LABELS,
  CARGO_LABELS,
} from '../../utils/constants'
import { solicitarCambioRol } from '../../services/notificacionesService'
import { actualizarTituloAcademico } from '../../services/perfilService'
import AlertBanner from '../../components/AlertBanner'

/**
 * PerfilPage — Perfil del usuario autenticado.
 * Muestra los datos institucionales y permite solicitar un cambio de rol (F.1).
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

      {/* Título académico (aparece en las firmas del PDF del distributivo) */}
      <TituloAcademico user={user} />

      {/* Solicitar cambio de rol (F.1) */}
      <SolicitarCambioRol user={user} />
    </div>
  )
}

/** Edición del título académico del propio usuario (Mgs., Ing., PhD., …). */
function TituloAcademico({ user }) {
  const { setUser } = useAuth()
  const [titulo, setTitulo] = useState(user.titulo_academico ?? '')
  const [guardando, setGuardando] = useState(false)
  const [alerta, setAlerta] = useState(null)

  async function handleGuardar(e) {
    e.preventDefault()
    setAlerta(null)
    setGuardando(true)
    try {
      const valor = await actualizarTituloAcademico(user.uid, titulo)
      setUser?.(prev => (prev ? { ...prev, titulo_academico: valor } : prev))
      setTitulo(valor)
      setAlerta({ tipo: 'success', msg: 'Título académico actualizado.' })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-800">Título académico</h2>
      <p className="text-xs text-gray-400 mt-0.5 mb-4">
        Opcional. Se antepone a tu nombre en las firmas del PDF del distributivo (ej. "Mgs.", "Ing.", "PhD.").
      </p>

      {alerta && <div className="mb-3"><AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} /></div>}

      <form onSubmit={handleGuardar} className="flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej. Mgs."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="px-4 py-2 text-sm font-semibold text-white bg-uide-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}

const ROLES_SOLICITABLES = [ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.DOCENTE]

function SolicitarCambioRol({ user }) {
  const [rol, setRol] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [alerta, setAlerta] = useState(null)

  const rolesActuales = user.roles ?? (user.rol ? [user.rol] : [])
  const opciones = ROLES_SOLICITABLES.filter(r => !rolesActuales.includes(r))

  async function handleEnviar(e) {
    e.preventDefault()
    setAlerta(null)
    setEnviando(true)
    try {
      await solicitarCambioRol({
        solicitanteUid:    user.uid,
        solicitanteNombre: user.nombre_completo,
        carreraId:         user.carrera_id ?? null,
        rolSolicitado:     rol,
        justificacion,
      })
      setAlerta({ tipo: 'success', msg: 'Solicitud enviada al director de tu carrera.' })
      setRol(''); setJustificacion('')
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-800">Solicitar cambio de rol</h2>
      <p className="text-xs text-gray-400 mt-0.5 mb-4">
        Tu solicitud se enviará al director de tu carrera para su aprobación.
      </p>

      {alerta && <div className="mb-3"><AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} /></div>}

      <form onSubmit={handleEnviar} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rol solicitado</label>
          <select
            value={rol}
            onChange={e => setRol(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
          >
            <option value="">— Selecciona un rol —</option>
            {opciones.map(r => <option key={r} value={r}>{ROL_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Justificación</label>
          <textarea
            rows={3}
            value={justificacion}
            onChange={e => setJustificacion(e.target.value)}
            placeholder="Explica por qué solicitas este rol…"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={enviando || !rol || !justificacion.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-uide-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  )
}
