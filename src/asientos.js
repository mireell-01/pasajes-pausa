// Croquis del bus de 39 asientos.
// Filas 1–9: ventana, pasillo | pasadizo | pasillo, ventana  (4 asientos)
// Fila 10:  ventana, pasillo | pasadizo | pasillo, SS.HH.   (3 asientos)
const V = 'ventana'
const P = 'pasillo'

export const FILAS = []
for (let f = 0; f < 9; f++) {
  const n = f * 4
  FILAS.push([
    { num: n + 1, tipo: V }, { num: n + 2, tipo: P },
    null,
    { num: n + 3, tipo: P }, { num: n + 4, tipo: V }
  ])
}
FILAS.push([{ num: 37, tipo: V }, { num: 38, tipo: P }, null, { num: 39, tipo: P }, { bano: true }])

export const ASIENTOS = FILAS.flat().filter(c => c && c.num)
export const TOTAL_ASIENTOS = ASIENTOS.length // 39

export function tipoDeAsiento (num) {
  return ASIENTOS.find(a => a.num === num)?.tipo || ''
}
