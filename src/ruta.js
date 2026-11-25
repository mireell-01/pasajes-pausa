// La ruta del bus y sus paradas. Un mismo bus lleva pasajeros a cualquier tramo.
export const PARADAS = ['Pauza', 'Nasca', 'Ica', 'Lima']

export const SENTIDOS = {
  PL: { nombre: 'Pauza → Lima', paradas: PARADAS },
  LP: { nombre: 'Lima → Pauza', paradas: [...PARADAS].reverse() }
}

// Precios por defecto (soles). Se cambian en la pantalla «Viajes».
export const TARIFAS_BASE = {
  Pauza_Nasca: 50,
  Pauza_Ica: 70,
  Pauza_Lima: 100,
  Nasca_Ica: 25,
  Nasca_Lima: 60,
  Ica_Lima: 35
}

/** Todos los tramos posibles (sin importar el sentido). */
export const TRAMOS = PARADAS.flatMap((a, i) => PARADAS.slice(i + 1).map(b => [a, b]))

export function claveTramo (a, b) {
  const [x, y] = [a, b].sort((p, q) => PARADAS.indexOf(p) - PARADAS.indexOf(q))
  return `${x}_${y}`
}

export function tarifa (tarifas, a, b) {
  const k = claveTramo(a, b)
  return Number((tarifas || {})[k] ?? TARIFAS_BASE[k] ?? 0)
}

/** ¿Dos tramos del mismo viaje comparten parte del camino? */
export function seCruzan (paradas, origen1, destino1, origen2, destino2) {
  const i = p => paradas.indexOf(p)
  return i(origen1) < i(destino2) && i(origen2) < i(destino1)
}
