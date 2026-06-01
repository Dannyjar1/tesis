/**
 * Mock horario semanal con localStorage.
 * Al integrar Firebase, reemplazar con Firestore /horario_semanal.
 */

const KEY = 'uide_horario_semanal'

function cargar() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? [] }
  catch { return [] }
}

function guardar(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista))
}

export async function getHorario(docenteUid) {
  await new Promise(r => setTimeout(r, 200))
  return cargar().filter(b => b.docente_uid === docenteUid)
}

export async function crearBloque(docenteUid, datos) {
  await new Promise(r => setTimeout(r, 300))
  const nuevo = {
    id: `bloque_${Date.now()}`,
    docente_uid: docenteUid,
    dia: datos.dia,
    hora_inicio: datos.hora_inicio,
    hora_fin: datos.hora_fin,
    materia: datos.materia,
    aula: datos.aula ?? '',
  }
  const lista = cargar()
  lista.push(nuevo)
  guardar(lista)
  return nuevo
}

export async function eliminarBloque(id) {
  await new Promise(r => setTimeout(r, 200))
  guardar(cargar().filter(b => b.id !== id))
}
