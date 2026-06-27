import { useState, useEffect, useContext, useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import { PeriodoContext } from '../../context/PeriodoContext'
import {
  suscribirseActividades, actualizarEstadoActividad, registrarEvidencia, editarEvidencia, estadoEfectivo,
} from '../../services/actividadesService'
import { ESTADOS_ACTIVIDAD, ESTADO_ACTIVIDAD_LABELS, PRIORIDAD_ORDEN } from '../../utils/constants'
import { generarReportePersonalActividades } from '../../services/reportesService'
import AlertBanner from '../../components/AlertBanner'
import ProgresoCategoria from './ProgresoCategoria'
import ActividadCard from './ActividadCard'
import EvidenciaModal from './EvidenciaModal'
import ToggleActividades from './ToggleActividades'
import LoadingSpinner from '../../components/LoadingSpinner'

const FILTROS = ['todas', ...Object.values(ESTADOS_ACTIVIDAD)]

// Orden del listado (PROJECT_BRIEF §15.4): vencidas → urgentes → normales →
// pendientes → completadas (al final).
function ordenar(a, b) {
  const ea = estadoEfectivo(a), eb = estadoEfectivo(b)
  const compA = ea === ESTADOS_ACTIVIDAD.COMPLETADA, compB = eb === ESTADOS_ACTIVIDAD.COMPLETADA
  if (compA !== compB) return compA ? 1 : -1
  const venA = ea === ESTADOS_ACTIVIDAD.VENCIDA, venB = eb === ESTADOS_ACTIVIDAD.VENCIDA
  if (venA !== venB) return venA ? -1 : 1
  const pa = PRIORIDAD_ORDEN[a.prioridad] ?? 9, pb = PRIORIDAD_ORDEN[b.prioridad] ?? 9
  if (pa !== pb) return pa - pb
  return new Date(a.fecha_limite ?? 0) - new Date(b.fecha_limite ?? 0)
}

/**
 * ActividadesDocentePage — Vista del docente (PROJECT_BRIEF §15).
 * Lista de actividades ASIGNADAS por el director + progreso por categoría.
 * El docente no crea actividades; solo actualiza estado y sube evidencia.
 */
export default function ActividadesDocentePage() {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [modalEvidencia, setModalEvidencia] = useState(null)   // { actividad, modo: 'subir'|'editar' }
  const [generandoRep, setGenerandoRep] = useState(false)
  const [alertaRep, setAlertaRep] = useState(null)

  async function handleReportePersonal() {
    setAlertaRep(null)
    setGenerandoRep(true)
    try {
      const codigo = await generarReportePersonalActividades({
        periodoId:     periodoActivo?.id,
        periodo:       periodoActivo,
        docenteUid:    user?.uid,
        docenteNombre: user?.nombre_completo,
        actividades,
      })
      setAlertaRep({ tipo: 'success', msg: `Reporte personal generado. Código: ${codigo}` })
    } catch (err) {
      setAlertaRep({ tipo: 'error', msg: err.message })
    } finally {
      setGenerandoRep(false)
    }
  }

  useEffect(() => {
    if (!user?.uid || !periodoActivo?.id) { setCargando(false); return }
    setCargando(true)
    const unsub = suscribirseActividades(
      { periodoId: periodoActivo.id, docenteUid: user.uid },
      lista => { setActividades(lista); setCargando(false) },
    )
    return unsub
  }, [user?.uid, periodoActivo?.id])

  const visibles = useMemo(() => {
    const filtradas = filtro === 'todas'
      ? actividades
      : actividades.filter(a => estadoEfectivo(a) === filtro)
    return [...filtradas].sort(ordenar)
  }, [actividades, filtro])

  async function handleCambiarEstado(act, nuevoEstado) {
    const actualizada = await actualizarEstadoActividad(act, nuevoEstado)
    setActividades(prev => prev.map(a => a.id === act.id ? actualizada : a))
  }

  async function handleGuardarEvidencia(url, nombre) {
    const { actividad, modo } = modalEvidencia
    // 'subir' marca completada; 'editar' solo actualiza la evidencia sin tocar el estado.
    const actualizada = modo === 'editar'
      ? await editarEvidencia(actividad, url, nombre)
      : await registrarEvidencia(actividad, url, nombre)
    setActividades(prev => prev.map(a => a.id === actualizada.id ? actualizada : a))
  }

  if (cargando) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Actividades</h1>
          <p className="text-sm text-gray-500 mt-0.5">{periodoActivo?.nombre ?? 'Sin período activo'}</p>
        </div>
        {actividades.length > 0 && (
          <button
            onClick={handleReportePersonal}
            disabled={generandoRep}
            className="self-start sm:self-auto text-sm font-medium text-uide-primary border border-uide-primary/30 px-4 py-2 rounded-lg hover:bg-uide-light transition disabled:opacity-60"
          >
            {generandoRep ? 'Generando…' : 'Generar mi reporte'}
          </button>
        )}
      </div>

      {alertaRep && <AlertBanner tipo={alertaRep.tipo} mensaje={alertaRep.msg} onCerrar={() => setAlertaRep(null)} />}

      <ToggleActividades />

      <ProgresoCategoria actividades={actividades} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
              filtro === f ? 'bg-uide-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'todas' ? 'Todas' : ESTADO_ACTIVIDAD_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-8 text-center">
          No tienes actividades {filtro === 'todas' ? 'asignadas' : `en estado "${ESTADO_ACTIVIDAD_LABELS[filtro]}"`} en este período.
        </p>
      ) : (
        <div className="space-y-3">
          {visibles.map(act => (
            <ActividadCard
              key={act.id}
              actividad={act}
              modo="docente"
              onCambiarEstado={handleCambiarEstado}
              onSubirEvidencia={(a) => setModalEvidencia({ actividad: a, modo: 'subir' })}
              onEditarEvidencia={(a) => setModalEvidencia({ actividad: a, modo: 'editar' })}
            />
          ))}
        </div>
      )}

      {modalEvidencia && (
        <EvidenciaModal
          actividad={modalEvidencia.actividad}
          onGuardar={handleGuardarEvidencia}
          onCerrar={() => setModalEvidencia(null)}
        />
      )}
    </div>
  )
}
