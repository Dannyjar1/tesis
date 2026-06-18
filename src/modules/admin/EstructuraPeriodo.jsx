import { useEffect, useState } from 'react'
import { getCarreras, getTodosUsuarios } from '../../services/sistemaService'
import {
  getEstructuraPeriodo, guardarAsignacionCarrera, copiarEstructura,
} from '../../services/estructuraPeriodoService'
import { ROLES } from '../../utils/constants'
import AlertBanner from '../../components/AlertBanner'
import LoadingSpinner from '../../components/LoadingSpinner'

/**
 * EstructuraPeriodo — Configuración jerárquica del período académico:
 * Período → Carreras → Usuarios (coordinador/responsable, docentes,
 * administrativos) + indicadores del período.
 *
 * Períodos "finalizado" se muestran en modo consulta (historial inmutable).
 * Se renderiza dentro de un Modal desde PeriodosAdmin.
 */
export default function EstructuraPeriodo({ periodo, periodos }) {
  const esHistorial = periodo.estado === 'finalizado'

  const [carreras, setCarreras]     = useState([])
  const [usuarios, setUsuarios]     = useState([])
  const [estructura, setEstructura] = useState({})
  const [carreraSel, setCarreraSel] = useState(null)
  const [cargando, setCargando]     = useState(true)
  const [guardando, setGuardando]   = useState(false)
  const [alerta, setAlerta]         = useState(null)
  const [nuevoIndicador, setNuevoIndicador] = useState('')

  useEffect(() => {
    let activo = true
    Promise.all([getCarreras(), getTodosUsuarios(), getEstructuraPeriodo(periodo.id)])
      .then(([c, u, e]) => {
        if (!activo) return
        setCarreras(c.filter(x => x.activo))
        setUsuarios(u)
        setEstructura(e)
        setCarreraSel(prev => prev ?? c.find(x => x.activo)?.id ?? null)
      })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [periodo.id])

  const asig = estructura[carreraSel] ?? {
    director_uid: null, coordinador_uid: null, docentes_uid: [], administrativos_uid: [], indicadores: [],
  }
  const participa = !!estructura[carreraSel]

  const docentes        = usuarios.filter(u => (u.roles ?? [u.rol]).includes(ROLES.DOCENTE))
  const elegiblesCoord  = usuarios.filter(u =>
    (u.roles ?? [u.rol]).some(r => [ROLES.COORDINADOR, ROLES.DIRECTOR, ROLES.DOCENTE].includes(r)))

  // Períodos anteriores de los que se puede copiar la estructura
  const anteriores = (periodos ?? []).filter(p =>
    p.id !== periodo.id && p.fecha_inicio < periodo.fecha_inicio)

  async function guardar(cambios) {
    setGuardando(true)
    setAlerta(null)
    try {
      const nueva = await guardarAsignacionCarrera(periodo, carreraSel, cambios)
      setEstructura(prev => ({ ...prev, [carreraSel]: nueva }))
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.message })
    } finally {
      setGuardando(false)
    }
  }

  function toggleUid(lista, uid) {
    return lista.includes(uid) ? lista.filter(x => x !== uid) : [...lista, uid]
  }

  async function handleCopiar(origenId) {
    setGuardando(true)
    setAlerta(null)
    try {
      const n = await copiarEstructura(origenId, periodo)
      setEstructura(await getEstructuraPeriodo(periodo.id))
      setAlerta({ tipo: 'success', msg: `Estructura copiada: ${n} carrera(s) del período anterior. Ajusta las asignaciones según corresponda.` })
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.message })
    } finally {
      setGuardando(false)
    }
  }

  async function agregarIndicador() {
    const nombre = nuevoIndicador.trim()
    if (!nombre) return
    await guardar({ indicadores: [...(asig.indicadores ?? []), { id: `ind_${Date.now()}`, nombre }] })
    setNuevoIndicador('')
  }

  if (cargando) return <div className="flex justify-center py-10"><LoadingSpinner /></div>

  return (
    <div className="space-y-4">
      {esHistorial && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
          Período finalizado — <span className="font-semibold">historial inmutable</span>:
          esta estructura se conserva como evidencia y solo puede consultarse.
        </div>
      )}
      {alerta && <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />}

      {/* Copiar estructura del período anterior (solo editable y vacío o no) */}
      {!esHistorial && anteriores.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Mantener carreras de:</span>
          {anteriores.slice(0, 3).map(p => (
            <button
              key={p.id}
              onClick={() => handleCopiar(p.id)}
              disabled={guardando}
              className="px-2.5 py-1 rounded-lg border border-uide-primary/30 text-uide-primary hover:bg-uide-primary/5 disabled:opacity-50 transition"
            >
              {p.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Selector de carrera */}
      <div className="flex flex-wrap gap-1.5">
        {carreras.map(c => (
          <button
            key={c.id}
            onClick={() => setCarreraSel(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              carreraSel === c.id
                ? 'bg-uide-primary text-white'
                : estructura[c.id]
                  ? 'bg-uide-primary/10 text-uide-primary'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title={estructura[c.id] ? 'Participa en este período' : 'Sin configurar en este período'}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {carreraSel && (
        <div className="space-y-4 border border-gray-200 rounded-xl p-4">
          {!participa && !esHistorial && (
            <p className="text-xs text-gray-400">
              Esta carrera aún no participa en el período. Al asignar personas o indicadores quedará incluida.
            </p>
          )}

          {/* Cargos del período: director y coordinador/responsable (RBAC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Director/a del período</label>
              <select
                value={asig.director_uid ?? ''}
                onChange={e => guardar({ director_uid: e.target.value || null })}
                disabled={esHistorial || guardando}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary disabled:bg-gray-50"
              >
                <option value="">— Sin director asignado —</option>
                {elegiblesCoord.map(u => (
                  <option key={u.uid} value={u.uid}>{u.nombre_completo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Coordinador / responsable del período</label>
              <select
                value={asig.coordinador_uid ?? ''}
                onChange={e => guardar({ coordinador_uid: e.target.value || null })}
                disabled={esHistorial || guardando}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary disabled:bg-gray-50"
              >
                <option value="">— Sin responsable asignado —</option>
                {elegiblesCoord.map(u => (
                  <option key={u.uid} value={u.uid}>{u.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Docentes del período */}
          <ListaAsignacion
            titulo={`Docentes asignados (${(asig.docentes_uid ?? []).length})`}
            usuarios={docentes}
            seleccionados={asig.docentes_uid ?? []}
            deshabilitado={esHistorial || guardando}
            onToggle={uid => guardar({ docentes_uid: toggleUid(asig.docentes_uid ?? [], uid) })}
          />

          {/* Indicadores del período */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">
              Indicadores del período ({(asig.indicadores ?? []).length})
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(asig.indicadores ?? []).length === 0 ? (
                <span className="text-xs text-gray-400 italic">Sin indicadores definidos.</span>
              ) : (asig.indicadores ?? []).map(ind => (
                <span key={ind.id} className="inline-flex items-center gap-1 text-xs bg-uide-light text-uide-primary px-2 py-1 rounded-full">
                  {ind.nombre}
                  {!esHistorial && (
                    <button
                      onClick={() => guardar({ indicadores: asig.indicadores.filter(i => i.id !== ind.id) })}
                      className="hover:text-red-600 font-bold"
                      aria-label={`Quitar ${ind.nombre}`}
                    >×</button>
                  )}
                </span>
              ))}
            </div>
            {!esHistorial && (
              <div className="flex gap-2">
                <input
                  value={nuevoIndicador}
                  onChange={e => setNuevoIndicador(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarIndicador() } }}
                  placeholder="ej: % cumplimiento semanal ≥ 80%"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-uide-primary"
                />
                <button
                  onClick={agregarIndicador}
                  disabled={guardando || !nuevoIndicador.trim()}
                  className="text-xs bg-uide-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                >
                  Agregar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ListaAsignacion({ titulo, usuarios, seleccionados, deshabilitado, onToggle }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1.5">{titulo}</p>
      {usuarios.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No hay usuarios con este rol en el sistema.</p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {usuarios.map(u => (
            <label key={u.uid} className={`flex items-center gap-1.5 text-xs ${deshabilitado ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={seleccionados.includes(u.uid)}
                onChange={() => onToggle(u.uid)}
                disabled={deshabilitado}
                className="h-3.5 w-3.5 rounded border-gray-300 text-uide-primary focus:ring-uide-primary"
              />
              {u.nombre_completo}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
