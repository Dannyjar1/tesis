/**
 * Componente de reporte en PDF usando pdfmake.
 * Sprint 5: generar PDF con firma de auditoría y código de verificación.
 * Referencia: RF-018, RN-007, RN-017.
 */
export default function ReportePDF({ datos, onDescargar, generando = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Reporte PDF</h3>
      <p className="text-xs text-gray-400 mb-3">
        Incluye código de verificación único y firma de auditoría para acreditación CACES.
      </p>
      <button
        onClick={onDescargar}
        disabled={generando || !datos}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{generando ? 'Generando...' : 'Descargar PDF'}</span>
      </button>
    </div>
  )
}
