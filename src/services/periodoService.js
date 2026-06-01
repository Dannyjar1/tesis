/**
 * Mock períodos académicos con localStorage.
 * Al integrar Firebase, reemplazar con Firestore /periodos_academicos.
 */

const KEY = 'uide_periodos_v2'

const SEED = [
  {
    id: '2025-B',
    nombre: 'Período 2025-B',
    fecha_inicio: '2025-09-01',
    fecha_fin: '2026-02-28',
    estado: 'archivado',
  },
  {
    id: '2026-A',
    nombre: 'Período 2026-A',
    fecha_inicio: '2026-05-04',
    fecha_fin: '2026-08-21',
    estado: 'activo',
  },
]

function cargar() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEY, JSON.stringify(SEED))
    return SEED
  } catch { return SEED }
}

function guardar(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista))
}

function tick(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export async function getPeriodos() {
  await tick(150)
  return cargar()
}

export async function crearPeriodo(datos) {
  await tick(300)
  const lista = cargar()
  const nuevo = {
    id: datos.id || `${datos.nombre.replace(/\s+/g, '-')}-${Date.now()}`,
    nombre: datos.nombre,
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin,
    estado: datos.estado ?? 'planificacion',
  }
  lista.push(nuevo)
  guardar(lista)
  return nuevo
}

export async function activarPeriodo(id) {
  await tick(200)
  const lista = cargar().map(p => ({
    ...p,
    estado: p.id === id ? 'activo' : p.estado === 'activo' ? 'cerrado' : p.estado,
  }))
  guardar(lista)
}

export async function cerrarPeriodo(id) {
  await tick(200)
  const lista = cargar()
  const actual = lista.find(p => p.id === id)
  if (!actual) return

  const actualizada = lista.map(p =>
    p.id === id ? { ...p, estado: 'cerrado' } : p
  )

  const hayFuturo = actualizada.some(p => ['proximo', 'planificacion'].includes(p.estado))
  if (!hayFuturo) {
    const fin = new Date(actual.fecha_fin + 'T12:00:00')
    const inicio = new Date(fin)
    inicio.setDate(inicio.getDate() + 1)
    const finSig = new Date(inicio)
    finSig.setMonth(finSig.getMonth() + 6)
    const año = inicio.getFullYear()
    const sem = inicio.getMonth() < 6 ? 'A' : 'B'
    actualizada.push({
      id: `${año}-${sem}`,
      nombre: `Período ${año}-${sem}`,
      fecha_inicio: inicio.toISOString().split('T')[0],
      fecha_fin: finSig.toISOString().split('T')[0],
      estado: 'proximo',
    })
  }

  guardar(actualizada)
}
