import { ref, watch, onScopeDispose } from 'vue'
import { escuchar } from '../db.js'

/**
 * Escucha una ruta de la base de datos en tiempo real.
 * `ruta` puede ser texto o una función (si cambia, se vuelve a conectar).
 */
export function useRuta (ruta) {
  const datos = ref({})
  const cargando = ref(true)
  let apagar = null

  const conectar = r => {
    if (apagar) apagar()
    apagar = null
    if (!r) { datos.value = {}; cargando.value = false; return }
    cargando.value = true
    apagar = escuchar(r, v => {
      datos.value = v ?? {}
      cargando.value = false
    })
  }

  if (typeof ruta === 'function') watch(ruta, conectar, { immediate: true })
  else conectar(ruta)

  onScopeDispose(() => apagar && apagar())
  return { datos, cargando }
}
