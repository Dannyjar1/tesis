/**
 * Panel de autorización/revocación del calendario Outlook.
 * Simula el flujo OAuth 2.0 individual por docente (RF-013, RN-005).
 */
export default function CalendarioConfig({ autorizado = false, onAutorizar, onRevocar, autorizando = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">
            {autorizado ? 'Calendario Outlook conectado' : 'Conecta tu calendario Outlook'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {autorizado
              ? 'Tus eventos de Microsoft 365 están sincronizados. Puedes revocar el acceso en cualquier momento.'
              : 'Autoriza el acceso a tu cuenta Microsoft 365 para sincronizar automáticamente tus eventos del calendario académico.'
            }
          </p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {autorizado ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Conectado
                </span>
                <button
                  onClick={onRevocar}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline transition"
                >
                  Revocar acceso
                </button>
              </>
            ) : (
              <button
                onClick={onAutorizar}
                disabled={autorizando}
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-uide-primary hover:bg-uide-dark px-4 py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {autorizando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Conectando con Microsoft…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Conectar con Microsoft 365
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
