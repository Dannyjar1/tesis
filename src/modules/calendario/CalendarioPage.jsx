import { useState, useContext } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useCalendario } from '../../hooks/useCalendario'
import {
  getSemana,
  formatearRangoSemana,
  formatearDiaCompleto,
  haceCuanto,
} from '../../utils/formatters'
import SyncOutlookButton from './SyncOutlookButton'
import CalendarioConfig from './CalendarioConfig'
import EventoCard from './EventoCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertBanner from '../../components/AlertBanner'

export default function CalendarioPage() {
  const { periodoActivo } = useContext(PeriodoContext)
  const {
    eventos, cargando, sincronizando, autorizando,
    autorizado, ultimaSync, error,
    sincronizar, autorizar, revocar,
  } = useCalendario(periodoActivo?.id)

  const [offsetSemana, setOffsetSemana] = useState(0)
  const [alerta, setAlerta] = useState(null)

  const { inicio, fin } = getSemana(offsetSemana)

  // Filtrar eventos de la semana seleccionada
  const eventosSemana = eventos.filter(e => {
    const d = new Date(e.fecha_inicio)
    return d >= inicio && d <= fin
  })

  // Agrupar por día (clave ISO de fecha sin hora)
  const porDia = eventosSemana.reduce((acc, ev) => {
    const clave = new Date(ev.fecha_inicio).toDateString()
    if (!acc[clave]) acc[clave] = []
    acc[clave].push(ev)
    return acc
  }, {})

  // Generar los 7 días de la semana (lun a dom)
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d
  })

  async function handleSincronizar() {
    setAlerta(null)
    try {
      const n = await sincronizar()
      setAlerta({ tipo: 'success', msg: `Sincronización completada. ${n} eventos importados desde Outlook.` })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    }
  }

  async function handleAutorizar() {
    setAlerta(null)
    await autorizar()
    setAlerta({ tipo: 'info', msg: 'Calendario Outlook conectado. Ahora puedes sincronizar tus eventos.' })
  }

  async function handleRevocar() {
    await revocar()
    setAlerta({ tipo: 'info', msg: 'Acceso al calendario revocado.' })
  }

  if (cargando) return (
    <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  )

  const totalEventos = eventos.length
  const pendientes   = eventos.filter(e => e.estado_clasificacion === 'pendiente').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario / Agenda</h1>
          <p className="text-gray-500 text-sm mt-0.5">{periodoActivo?.nombre ?? 'Sin período activo'}</p>
        </div>
        {autorizado && (
          <SyncOutlookButton onSync={handleSincronizar} sincronizando={sincronizando} />
        )}
      </div>

      {alerta && (
        <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />
      )}
      {error && <AlertBanner tipo="error" mensaje={error} />}

      {/* Bloque de autorización — solo si no ha conectado su calendario */}
      {!autorizado && (
        <CalendarioConfig
          autorizado={false}
          onAutorizar={handleAutorizar}
          autorizando={autorizando}
        />
      )}

      {/* Stats — visible solo cuando autorizado */}
      {autorizado && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Eventos totales"    valor={totalEventos} color="text-uide-primary" />
          <StatCard label="Esta semana"        valor={eventosSemana.length} color="text-blue-600" />
          <StatCard label="Sin clasificar"     valor={pendientes} color="text-amber-600" />
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-400">Última sincronización</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{haceCuanto(ultimaSync)}</p>
          </div>
        </div>
      )}

      {/* Vista de agenda semanal */}
      {autorizado && totalEventos === 0 && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-base font-semibold text-gray-700">Sin eventos sincronizados</h2>
          <p className="text-gray-400 text-sm mt-1">
            Haz clic en "Sincronizar Outlook" para importar tus eventos del calendario.
          </p>
        </div>
      )}

      {autorizado && totalEventos > 0 && (
        <div className="space-y-3">
          {/* Navegación semanal */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
            <button
              onClick={() => setOffsetSemana(v => v - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
              aria-label="Semana anterior"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">
                {formatearRangoSemana(inicio, fin)}
              </p>
              {offsetSemana === 0 && (
                <p className="text-xs text-uide-secondary mt-0.5">Semana actual</p>
              )}
            </div>

            <button
              onClick={() => setOffsetSemana(v => v + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
              aria-label="Semana siguiente"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          {diasSemana.map(dia => {
            const clave    = dia.toDateString()
            const evsDelDia = porDia[clave] ?? []
            const esHoy    = dia.toDateString() === new Date().toDateString()

            return (
              <div key={clave} className={`rounded-xl border overflow-hidden ${
                esHoy ? 'border-uide-secondary' : 'border-gray-200'
              }`}>
                {/* Cabecera del día */}
                <div className={`px-4 py-2 flex items-center justify-between ${
                  esHoy ? 'bg-uide-light' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm font-semibold ${
                    esHoy ? 'text-uide-primary' : 'text-gray-600'
                  }`}>
                    {formatearDiaCompleto(dia)}
                    {esHoy && <span className="ml-2 text-xs bg-uide-primary text-white px-1.5 py-0.5 rounded-full">Hoy</span>}
                  </p>
                  <span className="text-xs text-gray-400">{evsDelDia.length > 0 ? `${evsDelDia.length} evento${evsDelDia.length > 1 ? 's' : ''}` : 'Sin eventos'}</span>
                </div>

                {/* Eventos del día */}
                {evsDelDia.length > 0 ? (
                  <div className="divide-y divide-gray-50 bg-white">
                    {evsDelDia
                      .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
                      .map(ev => (
                        <div key={ev.id} className="px-2 py-1.5">
                          <EventoCard evento={ev} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="bg-white px-4 py-3">
                    <p className="text-xs text-gray-300 italic">Sin actividades programadas</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Volver a la semana actual si no está en ella */}
          {offsetSemana !== 0 && (
            <div className="text-center">
              <button
                onClick={() => setOffsetSemana(0)}
                className="text-sm text-uide-secondary hover:text-uide-primary hover:underline transition"
              >
                Volver a la semana actual
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bloque de revocar acceso — al fondo, solo cuando autorizado */}
      {autorizado && (
        <CalendarioConfig
          autorizado
          onAutorizar={handleAutorizar}
          onRevocar={handleRevocar}
          autorizando={false}
        />
      )}
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
