/**
 * Botón de sincronización del calendario Outlook.
 * RF-013, RF-014 — se usa en CalendarioPage cuando el usuario ya está autorizado.
 */
export default function SyncOutlookButton({ onSync, sincronizando = false }) {
  return (
    <button
      onClick={onSync}
      disabled={sincronizando}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {sincronizando ? 'Sincronizando...' : 'Sincronizar Outlook'}
    </button>
  )
}
