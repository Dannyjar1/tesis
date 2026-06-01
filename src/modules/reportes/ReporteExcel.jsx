/**
 * Exportación de reporte en formato Excel usando SheetJS (xlsx).
 * Sprint 5: generar archivo XLSX con hoja de cumplimiento por período.
 * Referencia: RF-018.
 */
export default function ReporteExcel({ datos, onDescargar, generando = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Reporte Excel</h3>
      <p className="text-xs text-gray-400 mb-3">
        Exporta el distributivo completo en formato XLSX compatible con Excel.
      </p>
      <button
        onClick={onDescargar}
        disabled={generando || !datos}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{generando ? 'Generando...' : 'Descargar Excel'}</span>
      </button>
    </div>
  )
}
