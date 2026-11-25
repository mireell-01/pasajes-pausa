// Pasajeros frecuentes: con solo el DNI se recuperan los datos de su primera compra.
import { leer, guardar } from './db.js'

/** Busca un pasajero por DNI. Devuelve { nombres, telefono, viajes } o null. */
export async function buscarPasajero (dni) {
  const registrado = await leer(`pasajeros/${dni}`)

  // Cuenta sus boletos (y sirve de respaldo para ventas hechas antes de guardar «pasajeros»).
  const boletos = (await leer('boletos')) || {}
  let ultimo = null
  let viajes = 0
  for (const delViaje of Object.values(boletos)) {
    for (const b of Object.values(delViaje || {})) {
      if (b?.dni !== dni) continue
      viajes++
      if (!ultimo || (b.vendidoEn || 0) > (ultimo.vendidoEn || 0)) ultimo = b
    }
  }

  const datos = registrado?.nombres ? registrado : ultimo
  if (!datos) return null
  return { nombres: datos.nombres, telefono: datos.telefono || '', viajes }
}

/** Guarda (o actualiza) los datos del pasajero para la próxima compra. */
export function recordarPasajero ({ dni, nombres, telefono }) {
  return guardar(`pasajeros/${dni}`, { nombres, telefono: telefono || '', actualizado: Date.now() })
}
