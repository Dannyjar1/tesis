import { useEffect } from 'react'

/**
 * Modal genérico con efecto Liquid Glass.
 * Fondo: backdrop-blur + overlay oscuro semitransparente.
 * Cierra con Escape o clic fuera del panel.
 */
export default function Modal({ abierto, onCerrar, titulo, children, ancho = 'max-w-lg' }) {
  useEffect(() => {
    if (!abierto) return
    const handleKey = e => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Capa Liquid Glass: desenfoque + oscurecimiento del fondo */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />

      {/* Panel del modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${ancho} z-10
          ring-1 ring-black/5 animate-modal-in`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="modal-titulo" className="text-base font-semibold text-gray-900">
            {titulo}
          </h3>
          <button
            onClick={onCerrar}
            className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400
              hover:text-gray-700 hover:bg-gray-100 transition"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
