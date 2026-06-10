import { useState } from 'react'

/**
 * Acordeon — Ítem desplegable para el módulo de Ayuda (RF-039).
 * Muestra una pregunta clicable que despliega/oculta su respuesta.
 */
export default function Acordeon({ titulo, children, defaultOpen = false }) {
  const [abierto, setAbierto] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">{titulo}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {abierto && (
        <div className="px-4 pb-4 pt-1 text-sm text-gray-600 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}
