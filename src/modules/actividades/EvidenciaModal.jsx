import { useState } from 'react'
import Modal from '../../components/Modal'
import AlertBanner from '../../components/AlertBanner'

/**
 * EvidenciaModal — Adjuntar evidencia a una actividad (PROJECT_BRIEF §15.5).
 * Dos vías: pegar una URL o seleccionar un archivo. La subida real a Firebase
 * Storage queda pendiente (no bloquea el MVP); por ahora se guarda la URL, o el
 * nombre del archivo como referencia.
 * @param {{ actividad, onGuardar: (url:string)=>Promise, onCerrar: ()=>void }} props
 */
export default function EvidenciaModal({ actividad, onGuardar, onCerrar }) {
  const [tab, setTab]       = useState('url') // 'url' | 'archivo'
  const [url, setUrl]       = useState('')
  const [archivo, setArchivo] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]   = useState(null)

  function leerArchivoComoDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload  = () => resolve(r.result)   // data:...;base64,... (se abre/previsualiza en el navegador)
      r.onerror = () => reject(new Error('No se pudo leer el archivo.'))
      r.readAsDataURL(file)
    })
  }

  async function handleGuardar(e) {
    e.preventDefault()
    setError(null)
    if (tab === 'url' && !url.trim()) { setError('Ingresa una URL válida.'); return }
    if (tab === 'archivo' && !archivo) { setError('Selecciona un archivo.'); return }
    // Límite razonable para localStorage en modo mock (~3MB en base64)
    if (tab === 'archivo' && archivo.size > 3 * 1024 * 1024) {
      setError('El archivo supera 3 MB. Usa una URL (Drive/OneDrive) para archivos grandes.')
      return
    }
    setGuardando(true)
    try {
      const valor = tab === 'url' ? url.trim() : await leerArchivoComoDataURL(archivo)
      await onGuardar(valor, tab === 'archivo' ? archivo.name : null)
      onCerrar()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Subir evidencia — ${actividad.titulo}`}>
      <form onSubmit={handleGuardar} className="space-y-4">
        {error && <AlertBanner tipo="error" mensaje={error} onCerrar={() => setError(null)} />}

        <div className="flex gap-2 text-sm">
          {['url', 'archivo'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === t ? 'bg-uide-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'url' ? 'Pegar URL' : 'Subir archivo'}
            </button>
          ))}
        </div>

        {tab === 'url' ? (
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
          />
        ) : (
          <div>
            <input
              type="file"
              onChange={e => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-uide-light file:text-uide-primary file:text-sm file:font-medium"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              La subida a almacenamiento se habilitará con las credenciales institucionales; por ahora se registra el nombre del archivo.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar evidencia'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
