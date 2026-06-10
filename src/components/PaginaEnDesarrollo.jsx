import { IconHerramienta } from './icons'

export default function PaginaEnDesarrollo({ titulo, sprint, descripcion }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Módulo del sistema UIDE</p>
      </div>
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
        <IconHerramienta className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700">Módulo en desarrollo</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">{descripcion}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-uide-light text-uide-primary rounded-full text-sm font-semibold">
          <span className="w-5 h-5 rounded-full bg-uide-primary text-white text-xs flex items-center justify-center font-bold">
            {sprint}
          </span>
          Disponible en Sprint {sprint}
        </div>
      </div>
    </div>
  )
}
