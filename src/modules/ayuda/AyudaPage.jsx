import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { ROL_LABELS } from '../../utils/constants'
import { AYUDA_POR_ROL, AYUDA_GENERAL, AYUDA_TUTORIALES } from './ayudaContenido'
import Acordeon from './Acordeon'
import { IconBuscar } from '../../components/icons'

/**
 * AyudaPage — Centro de ayuda por rol (RF-039).
 * Muestra FAQ, guías y tutoriales segmentados según el rol del usuario,
 * organizados en secciones con preguntas desplegables (acordeones).
 */
export default function AyudaPage() {
  const { user } = useAuth()
  const [busqueda, setBusqueda] = useState('')

  // Secciones del rol + sección general común a todos.
  const secciones = useMemo(() => {
    const propias = AYUDA_POR_ROL[user?.rol] ?? []
    return [...propias, AYUDA_TUTORIALES, AYUDA_GENERAL]
  }, [user?.rol])

  // Filtro por texto sobre pregunta y respuesta.
  const seccionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return secciones
    return secciones
      .map(sec => ({
        ...sec,
        items: sec.items.filter(
          it =>
            it.pregunta.toLowerCase().includes(q) ||
            it.respuesta.toLowerCase().includes(q)
        ),
      }))
      .filter(sec => sec.items.length > 0)
  }, [secciones, busqueda])

  const hayResultados = seccionesFiltradas.length > 0

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de ayuda</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Guías y preguntas frecuentes para tu rol
          {user?.rol && ROL_LABELS[user.rol] ? `: ${ROL_LABELS[user.rol]}` : ''}.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar en la ayuda…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary/40 focus:border-uide-secondary"
        />
      </div>

      {/* Secciones */}
      {hayResultados ? (
        <div className="space-y-7">
          {seccionesFiltradas.map((sec, si) => (
            <section key={sec.titulo} className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {sec.icono && <sec.icono className="h-4 w-4 text-uide-primary" />}
                {sec.titulo}
              </h2>
              <div className="space-y-2">
                {sec.items.map((it, ii) => (
                  <Acordeon
                    key={it.pregunta}
                    titulo={it.pregunta}
                    defaultOpen={si === 0 && ii === 0 && !busqueda}
                  >
                    {it.respuesta}
                  </Acordeon>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <IconBuscar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">
            No encontramos resultados para «{busqueda}».
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Prueba con otras palabras o revisa las secciones disponibles.
          </p>
        </div>
      )}

      {/* Pie de contacto */}
      <div className="bg-uide-primary/5 border border-uide-primary/15 rounded-xl p-4 text-sm text-gray-600">
        ¿No encontraste lo que buscabas? Contacta al área de{' '}
        <span className="font-medium text-uide-primary">TIC del campus Loja</span> para soporte.
      </div>
    </div>
  )
}
