// Datos de ejemplo para probar el sistema rápidamente.
import { agregar, guardar, siguienteNumero } from './db.js'
import { TARIFAS_BASE, tarifa } from './ruta.js'
import { tipoDeAsiento } from './asientos.js'
import { hoyISO } from './util.js'

export async function cargarEjemplo () {
  const bus1 = await agregar('buses', {
    placa: 'V2A-401', marca: 'Scania', modelo: 'K410 Marcopolo', anio: 2019, asientos: 39, estado: 'Operativo'
  })
  const bus2 = await agregar('buses', {
    placa: 'V3B-725', marca: 'Volvo', modelo: 'B420R', anio: 2021, asientos: 39, estado: 'Operativo'
  })
  await agregar('buses', {
    placa: 'V1C-118', marca: 'Mercedes-Benz', modelo: 'O500 RS', anio: 2016, asientos: 39, estado: 'Mantenimiento'
  })

  const ch1 = await agregar('choferes', {
    nombres: 'Juan Carlos Quispe Huamán', dni: '28301455', licencia: 'Q28301455', categoria: 'A-IIIc',
    vencimiento: '2028-06-30', telefono: '966123456', estado: 'Activo'
  })
  const ch2 = await agregar('choferes', {
    nombres: 'Rosa Elena Huamaní Ccahuana', dni: '28455120', licencia: 'Q28455120', categoria: 'A-IIIc',
    vencimiento: '2027-11-15', telefono: '954876321', estado: 'Activo'
  })

  await guardar('tarifas', TARIFAS_BASE)

  const hoy = hoyISO()
  const viaje1 = await agregar('viajes', { fecha: hoy, hora: '17:00', sentido: 'PL', busId: bus1, choferId: ch1 })
  await agregar('viajes', { fecha: hoy, hora: '18:30', sentido: 'LP', busId: bus2, choferId: ch2 })

  // Algunos boletos: el asiento 5 se vende dos veces en tramos distintos.
  const vendidos = [
    { asiento: 1, origen: 'Pauza', destino: 'Lima', nombres: 'María Pariona Gómez', dni: '41236587' },
    { asiento: 5, origen: 'Pauza', destino: 'Nasca', nombres: 'Pedro Cárdenas Ayala', dni: '45879632' },
    { asiento: 5, origen: 'Nasca', destino: 'Lima', nombres: 'Lucía Tello Ramos', dni: '47125896' },
    { asiento: 10, origen: 'Ica', destino: 'Lima', nombres: 'Jorge Palomino Rojas', dni: '40658974' }
  ]
  for (const b of vendidos) {
    await agregar(`boletos/${viaje1}`, {
      ...b,
      tipoAsiento: tipoDeAsiento(b.asiento),
      telefono: '',
      precio: tarifa(TARIFAS_BASE, b.origen, b.destino),
      numero: await siguienteNumero(),
      vendidoEn: Date.now()
    })
  }
  return viaje1
}
