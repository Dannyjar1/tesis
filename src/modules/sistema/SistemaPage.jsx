/**
 * SistemaPage.jsx — Panel exclusivo del superadmin (TIC).
 * Gestiona carreras, usuarios, roles y configuración del sistema desde la UI.
 * Ruta: /sistema  — solo accesible con rol 'superadmin'
 */
import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import {
  getCarreras, crearCarrera, actualizarCarrera, toggleActivoCarrera,
  getTodosUsuarios, guardarUsuario, cambiarRolUsuario, toggleActivoUsuario,
} from '../../services/sistemaService'
import {
  inicializarFirestore, inicializarPeriodoActivo, firestoreYaInicializado,
} from '../../services/firestoreInitService'
import { ROLES, ROL_LABELS, TIPO_CONTRATO, TIPO_CONTRATO_LABELS } from '../../utils/constants'

const TABS = [
  { id: 'carreras',  label: 'Carreras' },
  { id: 'usuarios',  label: 'Usuarios y Roles' },
  { id: 'seed',      label: 'Inicialización del Sistema' },
]

export default function SistemaPage() {
  const [tab, setTab] = useState('carreras')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administración del Sistema</h1>
        <p className="text-xs text-gray-400 mt-0.5">TIC — acceso exclusivo · todos los cambios son permanentes</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              tab === t.id ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'carreras' && <GestionCarreras />}
      {tab === 'usuarios' && <GestionUsuarios />}
      {tab === 'seed'     && <PanelSeed />}
    </div>
  )
}

// ── Gestión de Carreras ────────────────────────────────────────────────────────

function GestionCarreras() {
  const [carreras, setCarreras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // null | { modo: 'crear'|'editar', carrera?: {} }
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    setCarreras(await getCarreras())
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function handleGuardar(datos) {
    setGuardando(true)
    setError('')
    try {
      if (modal.modo === 'crear') {
        await crearCarrera(datos)
      } else {
        await actualizarCarrera(modal.carrera.id, datos)
      }
      setModal(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggle(c) {
    await toggleActivoCarrera(c.id, !c.activo)
    await cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{carreras.length} carrera(s) registradas</p>
        <button
          onClick={() => setModal({ modo: 'crear' })}
          className="px-4 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
        >
          + Nueva carrera
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Carrera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Escuela</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carreras.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.nombre}</p>
                    <p className="text-xs text-gray-400">{c.id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{c.escuela ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setModal({ modo: 'editar', carrera: c })} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleToggle(c)} className={`text-xs ${c.activo ? 'text-gray-400 hover:text-red-600' : 'text-green-600 hover:underline'}`}>
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
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
        titulo={modal?.modo === 'crear' ? 'Nueva carrera' : 'Editar carrera'}
      >
        <CarreraForm
          carrera={modal?.carrera}
          onGuardar={handleGuardar}
          onCancelar={() => { setModal(null); setError('') }}
          cargando={guardando}
          error={error}
        />
      </Modal>
    </div>
  )
}

function CarreraForm({ carrera, onGuardar, onCancelar, cargando, error }) {
  const [form, setForm] = useState({
    nombre:  carrera?.nombre  ?? '',
    escuela: carrera?.escuela ?? '',
    id:      carrera?.id      ?? '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <form onSubmit={e => { e.preventDefault(); onGuardar(form) }} className="space-y-4">
      {!carrera && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">ID (slug único) *</label>
          <input
            value={form.id}
            onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="ej: medicina-veterinaria"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
          />
          <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones. No se puede cambiar después.</p>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre oficial *</label>
        <input
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          placeholder="ej: Medicina Veterinaria"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Escuela (opcional)</label>
        <input
          value={form.escuela}
          onChange={e => set('escuela', e.target.value)}
          placeholder="ej: Escuela de Ciencias de la Vida"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
        />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
        <button
          type="submit"
          disabled={cargando}
          className="px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ── Gestión de Usuarios ────────────────────────────────────────────────────────

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carreras, setCarreras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')

  const cargar = async () => {
    setCargando(true)
    const [u, c] = await Promise.all([getTodosUsuarios(), getCarreras()])
    setUsuarios(u)
    setCarreras(c)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function handleGuardar(datos) {
    setGuardando(true)
    setError('')
    try {
      const uid = modal.usuario?.uid ?? `uid_${Date.now()}`
      await guardarUsuario(uid, datos)
      setModal(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggle(u) {
    await toggleActivoUsuario(u.uid, !u.activo)
    await cargar()
  }

  const filtrados = filtroRol === 'todos' ? usuarios : usuarios.filter(u => u.rol === filtroRol)
  const rolesDisponibles = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.DOCENTE, ROLES.ADMINISTRATIVO]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1.5 flex-wrap flex-1">
          <button onClick={() => setFiltroRol('todos')} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${filtroRol === 'todos' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>Todos ({usuarios.length})</button>
          {rolesDisponibles.map(r => {
            const n = usuarios.filter(u => u.rol === r).length
            if (n === 0) return null
            return (
              <button key={r} onClick={() => setFiltroRol(r)} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${filtroRol === r ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {ROL_LABELS[r]} ({n})
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setModal({ modo: 'crear' })}
          className="px-4 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition self-start sm:self-auto"
        >
          + Nuevo usuario
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-sm text-gray-400">Cargando usuarios...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Carrera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{u.nombre_completo}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.rol === 'superadmin' ? 'bg-red-100 text-red-700' :
                      u.rol === 'admin'      ? 'bg-[#003087]/10 text-[#003087]' :
                      u.rol === 'director'   ? 'bg-blue-100 text-blue-700' :
                      u.rol === 'coordinador'? 'bg-purple-100 text-purple-700' :
                                               'bg-gray-100 text-gray-600'
                    }`}>
                      {ROL_LABELS[u.rol] ?? u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                    {carreras.find(c => c.id === u.carrera_id)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setModal({ modo: 'editar', usuario: u })} className="text-xs text-blue-600 hover:underline">Editar</button>
                    {u.rol !== 'superadmin' && (
                      <button onClick={() => handleToggle(u)} className="text-xs text-gray-400 hover:text-red-600">
                        {u.activo ? 'Desactivar' : 'Activar'}
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
        titulo={modal?.modo === 'crear' ? 'Nuevo usuario' : `Editar — ${modal?.usuario?.nombre_completo}`}
      >
        <UsuarioForm
          usuario={modal?.usuario}
          onGuardar={handleGuardar}
          onCancelar={() => { setModal(null); setError('') }}
          cargando={guardando}
          error={error}
        />
      </Modal>
    </div>
  )
}

function UsuarioForm({ usuario, onGuardar, onCancelar, cargando, error }) {
  const [form, setForm] = useState({
    nombre:          usuario?.nombre          ?? '',
    apellido:        usuario?.apellido        ?? '',
    nombre_completo: usuario?.nombre_completo ?? '',
    email:           usuario?.email           ?? '',
    rol:             usuario?.rol             ?? ROLES.DOCENTE,
    tipo_contrato:   usuario?.tipo_contrato   ?? null,
    carrera_id:      usuario?.carrera_id      ?? null,
    activo:          usuario?.activo          ?? true,
  })

  // Carreras gestionadas internamente para poder refrescar tras crear una inline
  const [carreras, setCarreras]           = useState([])
  const [cargandoCarreras, setCargandoCarreras] = useState(false)
  const [mostrarNuevaCarrera, setMostrarNuevaCarrera] = useState(false)
  const [nuevaCarrera, setNuevaCarrera]   = useState({ nombre: '', escuela: '' })
  const [creandoCarrera, setCreandoCarrera] = useState(false)
  const [errorCarrera, setErrorCarrera]   = useState('')

  const necesitaCarrera  = [ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.DOCENTE].includes(form.rol)
  const necesitaContrato = form.rol === ROLES.DOCENTE

  // Cargar carreras cuando el formulario las necesita
  useEffect(() => {
    if (!necesitaCarrera) return
    setCargandoCarreras(true)
    getCarreras().then(c => {
      setCarreras(c.filter(x => x.activo))
      setCargandoCarreras(false)
    })
  }, [necesitaCarrera])

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'nombre' || k === 'apellido') {
        next.nombre_completo = `${k === 'nombre' ? v : f.nombre} ${k === 'apellido' ? v : f.apellido}`.trim()
      }
      // Al cambiar rol: limpiar carrera si ya no aplica, limpiar contrato si ya no es docente
      if (k === 'rol') {
        if (![ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.DOCENTE].includes(v)) next.carrera_id = null
        if (v !== ROLES.DOCENTE) next.tipo_contrato = null
      }
      return next
    })
  }

  async function handleCrearCarreraInline(e) {
    e.preventDefault()
    if (!nuevaCarrera.nombre.trim()) return
    setCreandoCarrera(true)
    setErrorCarrera('')
    try {
      const id = await crearCarrera({
        nombre:  nuevaCarrera.nombre.trim(),
        escuela: nuevaCarrera.escuela.trim() || null,
      })
      // Refrescar lista y seleccionar la nueva carrera automáticamente
      const lista = await getCarreras()
      setCarreras(lista.filter(x => x.activo))
      set('carrera_id', id)
      setMostrarNuevaCarrera(false)
      setNuevaCarrera({ nombre: '', escuela: '' })
    } catch (err) {
      setErrorCarrera(err.message)
    } finally {
      setCreandoCarrera(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]'

  return (
    <form onSubmit={e => { e.preventDefault(); onGuardar(form) }} className="space-y-4">

      {/* Nombre / Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido *</label>
          <input value={form.apellido} onChange={e => set('apellido', e.target.value)} required className={inputCls} />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Correo institucional *</label>
        <input value={form.email} onChange={e => set('email', e.target.value.toLowerCase())}
          type="email" required placeholder="usuario@uide.edu.ec" className={inputCls} />
      </div>

      {/* Rol */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Rol *</label>
        <select value={form.rol} onChange={e => set('rol', e.target.value)} required className={inputCls}>
          {Object.entries(ROL_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Carrera — solo cuando aplica */}
      {necesitaCarrera && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-600">Carrera *</label>
            <button
              type="button"
              onClick={() => { setMostrarNuevaCarrera(v => !v); setErrorCarrera('') }}
              className="text-xs text-[#003087] font-semibold hover:underline"
            >
              {mostrarNuevaCarrera ? '✕ Cancelar' : '+ Nueva carrera'}
            </button>
          </div>

          <select
            value={form.carrera_id ?? ''}
            onChange={e => set('carrera_id', e.target.value || null)}
            required
            disabled={cargandoCarreras}
            className={`${inputCls} ${cargandoCarreras ? 'opacity-50' : ''}`}
          >
            <option value="">
              {cargandoCarreras ? 'Cargando carreras...' : 'Selecciona una carrera'}
            </option>
            {carreras.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {/* Panel inline para crear nueva carrera */}
          {mostrarNuevaCarrera && (
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-800">Nueva carrera</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre oficial *</label>
                <input
                  value={nuevaCarrera.nombre}
                  onChange={e => setNuevaCarrera(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="ej: Medicina Veterinaria"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Escuela (opcional)</label>
                <input
                  value={nuevaCarrera.escuela}
                  onChange={e => setNuevaCarrera(f => ({ ...f, escuela: e.target.value }))}
                  placeholder="ej: Escuela de Ciencias de la Vida"
                  className={inputCls}
                />
              </div>
              {errorCarrera && <p className="text-red-600 text-xs">{errorCarrera}</p>}
              <button
                type="button"
                onClick={handleCrearCarreraInline}
                disabled={creandoCarrera || !nuevaCarrera.nombre.trim()}
                className="w-full py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                {creandoCarrera ? 'Creando...' : 'Crear carrera y seleccionar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tipo de contrato — solo docente */}
      {necesitaContrato && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de contrato *</label>
          <select value={form.tipo_contrato ?? ''} onChange={e => set('tipo_contrato', e.target.value || null)} required className={inputCls}>
            <option value="">Selecciona tipo</option>
            {Object.entries(TIPO_CONTRATO_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancelar
        </button>
        <button type="submit" disabled={cargando}
          className="px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ── Panel de Inicialización ────────────────────────────────────────────────────

function PanelSeed() {
  const [estado, setEstado] = useState('idle')
  const [resultado, setResultado] = useState(null)

  async function handleInit() {
    setEstado('cargando')
    try {
      const yaInit = await firestoreYaInicializado()
      if (yaInit) {
        setResultado({ msg: 'Firestore ya tiene datos semilla. No se realizaron cambios.', tipo: 'warn' })
        setEstado('ok')
        return
      }
      const r1 = await inicializarFirestore()
      const r2 = await inicializarPeriodoActivo()
      setResultado({
        msg: `Cargados: ${r1.carreras} carrera(s), ${r1.usuarios} usuario(s). Período activo: ${r2.creado ? 'creado' : 'ya existía'}.`,
        tipo: 'ok',
      })
      setEstado('ok')
    } catch (err) {
      setResultado({ msg: err.message, tipo: 'error' })
      setEstado('error')
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Solo ejecutar una vez</p>
        <p className="text-xs text-amber-700">
          Carga las 7 carreras del campus Loja y el usuario superadmin en Firestore.
          El proceso es idempotente: no duplica datos si ya existen.
          Después, gestiona todo desde las pestañas Carreras y Usuarios.
        </p>
      </div>
      <button
        onClick={handleInit}
        disabled={estado === 'cargando'}
        className="px-5 py-2.5 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
      >
        {estado === 'cargando' ? 'Inicializando...' : 'Inicializar Firestore'}
      </button>
      {resultado && (
        <div className={`text-sm rounded-lg px-4 py-3 border ${
          resultado.tipo === 'ok'   ? 'bg-green-50 border-green-200 text-green-800' :
          resultado.tipo === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                      'bg-red-50 border-red-200 text-red-700'
        }`}>
          {resultado.msg}
        </div>
      )}
    </div>
  )
}
