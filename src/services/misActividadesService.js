/**
 * Servicio de Mis Actividades — mock con localStorage.
 * Estados: por_hacer | en_progreso | completada
 * Al conectar Firebase, reemplazar con Firestore /tareas_todo sin cambiar la interfaz.
 */

const KEY = 'uide_mis_actividades'

function cargarTodas() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) ?? []
    // migración: estado 'pendiente' → 'por_hacer'
    return data.map(a => a.estado === 'pendiente' ? { ...a, estado: 'por_hacer' } : a)
  } catch {
    return []
  }
}

function guardarTodas(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista))
}

export async function getActividades(docenteUid) {
  await new Promise(r => setTimeout(r, 300))
  return cargarTodas().filter(a => a.docente_uid === docenteUid)
}

export async function crearActividad(docenteUid, datos) {
  await new Promise(r => setTimeout(r, 300))
  const nueva = {
    id: `act_${Date.now()}`,
    docente_uid: docenteUid,
    titulo: datos.titulo,
    categoria_ces: datos.categoria_ces,
    fecha_limite: datos.fecha_limite ?? null,
    estado: 'por_hacer',
    fecha_creacion: new Date().toISOString(),
    fecha_completada: null,
  }
  const lista = cargarTodas()
  lista.unshift(nueva)
  guardarTodas(lista)
  return nueva
}

export async function actualizarActividad(id, cambios) {
  await new Promise(r => setTimeout(r, 300))
  const lista = cargarTodas().map(a => a.id === id ? { ...a, ...cambios } : a)
  guardarTodas(lista)
}

export async function moverActividad(id, nuevoEstado) {
  await new Promise(r => setTimeout(r, 150))
  const lista = cargarTodas().map(a => {
    if (a.id !== id) return a
    return {
      ...a,
      estado: nuevoEstado,
      fecha_completada: nuevoEstado === 'completada' ? new Date().toISOString() : null,
    }
  })
  guardarTodas(lista)
}

export async function eliminarActividad(id) {
  await new Promise(r => setTimeout(r, 200))
  guardarTodas(cargarTodas().filter(a => a.id !== id))
}
