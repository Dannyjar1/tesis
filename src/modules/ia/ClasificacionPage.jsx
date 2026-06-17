import { useState, useContext } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useClasificacion } from '../../hooks/useClasificacion'
import EventoClasificado from './EventoClasificado'
import CorreccionManual from './CorreccionManual'
import FeedbackPanel from './FeedbackPanel'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertBanner from '../../components/AlertBanner'
import { IconRobot, IconChispa } from '../../components/icons'

const FILTROS = [
  { id: 'todos',       label: 'Todos' },
  { id: 'provisional', label: 'Provisionales' },
  { id: 'corregida',   label: 'Corregidos' },
]

export default function ClasificacionPage() {
  const { periodoActivo } = useContext(PeriodoContext)
  const {
    clasificaciones, eventos, clasificando, cargando, error,
    estadisticas, progreso,
    pendientesCount, provisionalesCount, corregidasCount,
    clasificarTodos, corregir,
  } = useClasificacion(periodoActivo?.id)

  const [filtro, setFiltro] = useState('todos')
  const [modalCorreccion, setModalCorreccion] = useState(null)
  const [alerta, setAlerta] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const clasesFiltradas = clasificaciones.filter(c => {
    if (filtro === 'provisional') return !c.fue_corregida
    if (filtro === 'corregida')   return c.fue_corregida
    return true
  })

  async function handleClasificarTodos() {
    setAlerta(null)
    try {
      const { clasificadas } = await clasificarTodos()
      setAlerta({ tipo: 'success', msg: `${clasificadas} eventos clasificados con IA. Revisa los resultados y corrige si es necesario.` })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    }
  }

  async function handleCorregir(clas, categoriaCorrecta) {
    setGuardando(true)
    try {
      await corregir(clas.id, categoriaCorrecta)
      setModalCorreccion(null)
      setAlerta({ tipo: 'success', msg: 'Corrección guardada. El feedback mejorará el modelo BETO.' })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return (
    <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  )

  const sinEventos = eventos.length === 0
  const todosPendientes = pendientesCount === eventos.length && eventos.length > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clasificación IA</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {periodoActivo?.nombre} · Modelo BETO (español)
          </p>
        </div>
        {!sinEventos && (
          <button
            onClick={handleClasificarTodos}
            disabled={clasificando || pendientesCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-uide-primary hover:bg-uide-dark rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {clasificando ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Clasificando… {progreso}%
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                Clasificar con IA{pendientesCount > 0 ? ` (${pendientesCount})` : ''}
              </>
            )}
          </button>
        )}
      </div>

      {alerta && (
        <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />
      )}
      {error && <AlertBanner tipo="error" mensaje={error} />}

      {/* Barra de progreso durante clasificación en lote */}
      {clasificando && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Clasificando eventos con BETO…</span>
            <span className="text-uide-primary font-semibold">{progreso}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-uide-primary rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* Sin eventos sincronizados */}
      {sinEventos && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <IconRobot className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <h2 className="text-base font-semibold text-gray-700">Sin eventos para clasificar</h2>
          <p className="text-gray-400 text-sm mt-1">
            Aún no hay eventos para clasificar en este período.
          </p>
        </div>
      )}

      {/* Eventos pendientes de clasificar */}
      {!sinEventos && todosPendientes && !clasificando && (
        <div className="bg-uide-light border border-uide-secondary/30 rounded-xl p-6 text-center">
          <IconChispa className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-uide-primary font-semibold text-sm">
            {pendientesCount} eventos listos para clasificar
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Pulsa "Clasificar con IA" para que BETO analice el título y descripción de cada evento.
          </p>
        </div>
      )}

      {/* Panel de resultados */}
      {clasificaciones.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lista */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filtros */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
              {FILTROS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    filtro === f.id
                      ? 'bg-white text-uide-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                  {f.id === 'provisional' && provisionalesCount > 0 && (
                    <span className="ml-1.5 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      {provisionalesCount}
                    </span>
                  )}
                  {f.id === 'corregida' && corregidasCount > 0 && (
                    <span className="ml-1.5 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      {corregidasCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {clasesFiltradas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin eventos en este filtro.</p>
              ) : (
                clasesFiltradas.map(clas => (
                  <EventoClasificado
                    key={clas.id}
                    clasificacion={clas}
                    onCorregir={c => setModalCorreccion(c)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <FeedbackPanel estadisticas={estadisticas} />
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Sobre el modelo</h3>
              <div className="space-y-2 text-xs text-gray-500">
                <p>BETO analiza el <strong>título y descripción</strong> de cada evento para asignarlo a una de las 5 categorías del Reglamento CES 2021.</p>
                <p>Las clasificaciones <span className="text-amber-600 font-medium">Provisionales</span> requieren revisión del docente.</p>
                <p>Cada corrección retroalimenta el modelo para mejorar su precisión.</p>
              </div>
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                Objetivo: F1-score ≥ 80% (RNF-009)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal corrección manual */}
      {modalCorreccion && (
        <Modal
          abierto
          onCerrar={() => setModalCorreccion(null)}
          titulo="Corregir clasificación IA"
          ancho="max-w-md"
        >
          <CorreccionManual
            clasificacion={modalCorreccion}
            onGuardar={handleCorregir}
            onCancelar={() => setModalCorreccion(null)}
            guardando={guardando}
          />
        </Modal>
      )}
    </div>
  )
}
