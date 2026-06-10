import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { getPeriodos } from '../../services/periodoService'
import { CARGO_LABELS } from '../../utils/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import RolBanner from '../dashboard/RolBanner'
import { IconCalendario } from '../../components/icons'

function calcularProgreso(inicio, fin) {
  const hoy   = new Date()
  const dInicio = new Date(inicio + 'T00:00:00')
  const dFin    = new Date(fin   + 'T00:00:00')
  const total   = Math.ceil((dFin - dInicio) / 86400000)
  const elapsed = Math.max(0, Math.ceil((hoy - dInicio) / 86400000))
  const restante = Math.max(0, total - elapsed)
  const pct = Math.min(100, Math.round((elapsed / total) * 100))
  return { total, elapsed, restante, pct }
}

function fmtFecha(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-EC', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function AdministrativoDashboard() {
  const { user } = useAuth()
  const [periodos, setPeriodos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getPeriodos().then(data => {
      setPeriodos(data)
      setCargando(false)
    })
  }, [])

  const periodoActivo = periodos.find(p => p.estado === 'activo') ?? null
  const progreso = periodoActivo
    ? calcularProgreso(periodoActivo.fecha_inicio, periodoActivo.fecha_fin)
    : null

  const cargoLabel = CARGO_LABELS[user?.cargo] ?? user?.cargo ?? '—'

  return (
    <div className="flex flex-col gap-6">

      {/* Diferenciación visual por rol (RF-040) */}
      <RolBanner user={user} />

      {/* Header personal */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-uide-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow">
          {user?.nombre_completo?.charAt(0).toUpperCase() ?? 'D'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{user?.nombre_completo}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {cargoLabel}
            </span>
            <span className="text-xs text-gray-400">{user?.email}</span>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Período activo */}
          {periodoActivo && progreso ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Período académico activo</p>
                  <h2 className="text-xl font-bold text-gray-900">{periodoActivo.nombre}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {fmtFecha(periodoActivo.fecha_inicio)} — {fmtFecha(periodoActivo.fecha_fin)}
                  </p>
                </div>
                <span className="self-start inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  En curso
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Día {progreso.elapsed} de {progreso.total}</span>
                  <span>{progreso.pct}% completado</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-uide-primary to-uide-secondary rounded-full transition-all duration-700"
                    style={{ width: `${progreso.pct}%` }}
                  />
                </div>
              </div>

              {/* KPIs del período */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <PeriodStat label="Días transcurridos" valor={progreso.elapsed} color="text-uide-primary" />
                <PeriodStat label="Días restantes"     valor={progreso.restante} color="text-amber-600" />
                <PeriodStat label="Duración total"     valor={`${progreso.total} d`} color="text-gray-700" />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
              <IconCalendario className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500 font-medium">No hay período activo</p>
            </div>
          )}

          {/* Hitos del período */}
          {periodoActivo && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Hitos del período</h3>
              <div className="space-y-3">
                <Hito
                  fecha={periodoActivo.fecha_inicio}
                  label="Inicio del período"
                  descripcion="Apertura oficial del período académico 2026-A"
                  cumplido={true}
                  color="bg-green-500"
                />
                <Hito
                  fecha="2026-06-15"
                  label="Cierre de carga de distributivos"
                  descripcion="Fecha límite para registrar distributivos académicos"
                  cumplido={new Date() >= new Date('2026-06-15')}
                  color="bg-blue-500"
                />
                <Hito
                  fecha="2026-07-01"
                  label="Evaluación intermedia"
                  descripcion="Revisión de avance de actividades académicas"
                  cumplido={new Date() >= new Date('2026-07-01')}
                  color="bg-purple-500"
                />
                <Hito
                  fecha={periodoActivo.fecha_fin}
                  label="Cierre del período"
                  descripcion="Fin del período académico 2026-A"
                  cumplido={new Date() >= new Date(periodoActivo.fecha_fin)}
                  color="bg-gray-400"
                />
              </div>
            </div>
          )}

          {/* Info de cuenta */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Datos de mi cuenta institucional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DatoFila label="Nombre completo" valor={user?.nombre_completo} />
              <DatoFila label="Correo institucional" valor={user?.email} />
              <DatoFila label="Cargo" valor={cargoLabel} />
              <DatoFila label="Rol en el sistema" valor="Administrativo" />
              <DatoFila label="Estado" valor="Activo" highlight="text-green-600" />
              <DatoFila label="Período vigente" valor={periodoActivo?.nombre ?? '—'} />
            </div>
          </div>

          {/* Períodos históricos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Historial de períodos</h3>
            <div className="space-y-2">
              {periodos.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {fmtFecha(p.fecha_inicio)} → {fmtFecha(p.fecha_fin)}
                    </p>
                  </div>
                  <EstadoBadge estado={p.estado} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PeriodStat({ label, valor, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{valor}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function Hito({ fecha, label, descripcion, cumplido, color }) {
  const fmtCorta = new Date(fecha + 'T00:00:00').toLocaleDateString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${cumplido ? color : 'bg-gray-200'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className={`text-sm font-medium ${cumplido ? 'text-gray-800' : 'text-gray-400'}`}>{label}</p>
          <span className="text-[11px] text-gray-400">{fmtCorta}</span>
        </div>
        <p className="text-xs text-gray-400">{descripcion}</p>
      </div>
    </div>
  )
}

function DatoFila({ label, valor, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium ${highlight ?? 'text-gray-800'}`}>{valor ?? '—'}</p>
    </div>
  )
}

function EstadoBadge({ estado }) {
  const map = {
    activo:       'bg-green-100 text-green-700',
    cerrado:      'bg-gray-100 text-gray-600',
    archivado:    'bg-slate-100 text-slate-500',
    proximo:      'bg-blue-100 text-blue-700',
    planificacion:'bg-yellow-100 text-yellow-700',
  }
  const labels = {
    activo: 'Activo', cerrado: 'Cerrado', archivado: 'Archivado',
    proximo: 'Próximo', planificacion: 'Planificación',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[estado] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[estado] ?? estado}
    </span>
  )
}
