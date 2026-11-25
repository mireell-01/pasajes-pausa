<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import CroquisBus from '../componentes/CroquisBus.vue'
import { useRuta } from '../composables/useRuta.js'
import { lista, soles, fechaCorta, diaSemana, hoyISO, numeroBoleto } from '../util.js'
import { SENTIDOS, tarifa, seCruzan } from '../ruta.js'
import { tipoDeAsiento, TOTAL_ASIENTOS } from '../asientos.js'
import { transaccion, claveNueva, borrar, siguienteNumero } from '../db.js'
import { cargarEjemplo } from '../datosEjemplo.js'

const route = useRoute()
const router = useRouter()

const { datos: viajesObj, cargando } = useRuta('viajes')
const { datos: busesObj } = useRuta('buses')
const { datos: choferesObj } = useRuta('choferes')
const { datos: tarifasObj } = useRuta('tarifas')

/* ---- Viaje ---- */
const verAnteriores = ref(false)
const viajes = computed(() =>
  lista(viajesObj.value)
    .filter(v => verAnteriores.value || v.fecha >= hoyISO())
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
)
const viajeId = ref(String(route.query.viaje || ''))
watch([viajes, cargando], () => {
  if (cargando.value) return
  if (viajeId.value && viajesObj.value[viajeId.value]) return
  viajeId.value = viajes.value[0]?.id || ''
}, { immediate: true })
watch(viajeId, id => router.replace({ query: id ? { viaje: id } : {} }))

const viaje = computed(() => (viajeId.value ? viajesObj.value[viajeId.value] : null))
const bus = computed(() => (viaje.value ? busesObj.value[viaje.value.busId] : null))
const chofer = computed(() => (viaje.value ? choferesObj.value[viaje.value.choferId] : null))
const paradas = computed(() => SENTIDOS[viaje.value?.sentido]?.paradas || [])

const etiquetaViaje = v =>
  `${fechaCorta(v.fecha)} ${v.hora} · ${SENTIDOS[v.sentido]?.nombre || ''} · ${busesObj.value[v.busId]?.placa || 'sin bus'}`

/* ---- Tramo ---- */
const origen = ref('')
const destino = ref('')
const elegido = ref(null)
const origenes = computed(() => paradas.value.slice(0, -1))
const destinos = computed(() => paradas.value.slice(paradas.value.indexOf(origen.value) + 1))

watch(() => `${viajeId.value}|${viaje.value?.sentido}`, () => {
  origen.value = paradas.value[0] || ''
  destino.value = paradas.value[paradas.value.length - 1] || ''
  elegido.value = null
}, { immediate: true })
watch(origen, o => {
  const ps = paradas.value
  if (ps.indexOf(destino.value) <= ps.indexOf(o)) destino.value = ps[ps.length - 1]
})

/* ---- Asientos ---- */
const { datos: boletosObj } = useRuta(() => (viajeId.value ? `boletos/${viajeId.value}` : null))
const boletos = computed(() =>
  lista(boletosObj.value).sort((a, b) => a.asiento - b.asiento || paradas.value.indexOf(a.origen) - paradas.value.indexOf(b.origen))
)
const cruza = b => seCruzan(paradas.value, b.origen, b.destino, origen.value, destino.value)

const estados = computed(() => {
  const e = {}
  for (const b of boletos.value) {
    if (cruza(b)) e[b.asiento] = 'ocupado'
    else if (e[b.asiento] !== 'ocupado') e[b.asiento] = 'parcial'
  }
  return e
})
const ocupados = computed(() => Object.values(estados.value).filter(x => x === 'ocupado').length)
const recaudado = computed(() => boletos.value.reduce((s, b) => s + Number(b.precio || 0), 0))

const boletosDelAsiento = computed(() => boletos.value.filter(b => b.asiento === elegido.value))
const asientoLibre = computed(() => elegido.value != null && estados.value[elegido.value] !== 'ocupado')

function elegir (num) {
  elegido.value = elegido.value === num ? null : num
  error.value = ''
}

/* ---- Venta ---- */
const precio = ref(0)
watch([origen, destino, tarifasObj], () => {
  precio.value = tarifa(tarifasObj.value, origen.value, destino.value)
}, { immediate: true })

const form = reactive({ nombres: '', dni: '', telefono: '' })
const error = ref('')
const enviando = ref(false)

async function vender () {
  error.value = ''
  const nombres = form.nombres.trim().replace(/\s+/g, ' ')
  const dni = form.dni.trim()
  const telefono = form.telefono.trim()
  if (!asientoLibre.value) { error.value = 'Elija un asiento libre en el croquis.'; return }
  if (nombres.length < 3) { error.value = 'Escriba los nombres y apellidos del pasajero.'; return }
  if (!/^\d{8}$/.test(dni)) { error.value = 'El DNI debe tener 8 números.'; return }
  if (telefono && !/^\d{6,9}$/.test(telefono)) { error.value = 'El teléfono debe tener solo números (6 a 9).'; return }
  if (!(Number(precio.value) > 0)) { error.value = 'El precio debe ser mayor que cero.'; return }
  if (boletos.value.some(b => b.dni === dni && cruza(b))) {
    error.value = 'Ese DNI ya tiene un boleto en este viaje para ese tramo.'
    return
  }

  enviando.value = true
  try {
    const id = claveNueva(`boletos/${viajeId.value}`)
    const ps = paradas.value
    const boleto = {
      asiento: elegido.value,
      tipoAsiento: tipoDeAsiento(elegido.value),
      origen: origen.value,
      destino: destino.value,
      nombres,
      dni,
      telefono,
      precio: Number(precio.value),
      numero: await siguienteNumero(),
      vendidoEn: Date.now()
    }
    // La transacción revisa otra vez el asiento: si otro vendedor lo vendió recién, se cancela.
    const r = await transaccion(`boletos/${viajeId.value}`, actual => {
      const todos = actual || {}
      const choque = Object.values(todos).some(b =>
        b.asiento === boleto.asiento && seCruzan(ps, b.origen, b.destino, boleto.origen, boleto.destino))
      if (choque) return undefined
      return { ...todos, [id]: boleto }
    })
    if (!r.ok) {
      error.value = 'Ese asiento se acaba de vender. Elija otro.'
      return
    }
    Object.assign(form, { nombres: '', dni: '', telefono: '' })
    router.push(`/boleto/${viajeId.value}/${id}`)
  } catch (e) {
    error.value = 'No se pudo guardar la venta: ' + (e?.message || e)
  } finally {
    enviando.value = false
  }
}

async function anular (b) {
  if (!confirm(`¿Anular el boleto ${numeroBoleto(b.numero)} de ${b.nombres} (asiento ${b.asiento})?`)) return
  await borrar(`boletos/${viajeId.value}/${b.id}`)
}

/* ---- Datos de ejemplo ---- */
const cargandoEjemplo = ref(false)
async function ejemplo () {
  cargandoEjemplo.value = true
  try { viajeId.value = await cargarEjemplo() } finally { cargandoEjemplo.value = false }
}
const sinDatos = computed(() => !cargando.value && !Object.keys(viajesObj.value).length && !Object.keys(busesObj.value).length)
</script>

<template>
  <section>
    <h1>Venta de pasajes</h1>

    <p v-if="cargando" class="aviso">Cargando viajes…</p>

    <div v-else-if="sinDatos" class="tarjeta vacio">
      <h2>Todavía no hay buses ni viajes</h2>
      <p>Registre sus buses en <RouterLink to="/flota">Flota</RouterLink>, sus choferes en
        <RouterLink to="/choferes">Choferes</RouterLink> y programe la salida en <RouterLink to="/viajes">Viajes</RouterLink>.</p>
      <p>O cargue datos de ejemplo para probar el sistema ahora mismo:</p>
      <button class="btn" :disabled="cargandoEjemplo" @click="ejemplo">
        {{ cargandoEjemplo ? 'Cargando…' : 'Cargar datos de ejemplo' }}
      </button>
    </div>

    <div v-else-if="!viajes.length" class="tarjeta vacio">
      <h2>No hay viajes programados desde hoy</h2>
      <p>Programe una salida en <RouterLink to="/viajes">Viajes</RouterLink>.</p>
      <label class="check"><input type="checkbox" v-model="verAnteriores" /> Ver viajes anteriores</label>
    </div>

    <template v-else>
      <div class="tarjeta filtros">
        <label class="campo ancho">
          <span>Viaje</span>
          <select v-model="viajeId">
            <option v-for="v in viajes" :key="v.id" :value="v.id">{{ etiquetaViaje(v) }}</option>
          </select>
        </label>
        <label class="campo">
          <span>Origen</span>
          <select v-model="origen">
            <option v-for="p in origenes" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label class="campo">
          <span>Destino</span>
          <select v-model="destino">
            <option v-for="p in destinos" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label class="check"><input type="checkbox" v-model="verAnteriores" /> Ver viajes anteriores</label>
      </div>

      <div v-if="viaje" class="venta">
        <div class="tarjeta col-bus">
          <div class="resumen-viaje">
            <div>
              <strong>{{ SENTIDOS[viaje.sentido]?.nombre }}</strong>
              <span class="suave">· {{ diaSemana(viaje.fecha) }} {{ fechaCorta(viaje.fecha) }}, {{ viaje.hora }}</span>
            </div>
            <div class="suave">
              Bus {{ bus?.placa || '—' }} · Chofer: {{ chofer?.nombres || '—' }}
            </div>
            <div class="paradas">
              <span v-for="(p, i) in paradas" :key="p"
                    :class="{ activa: i >= paradas.indexOf(origen) && i <= paradas.indexOf(destino) }">{{ p }}</span>
            </div>
          </div>

          <div class="leyenda">
            <span><i class="m libre"></i> Libre</span>
            <span><i class="m ocupado"></i> Ocupado</span>
            <span><i class="m parcial"></i> Libre en este tramo</span>
            <span><i class="m elegido"></i> Elegido</span>
            <span><i class="m ventana-m"></i> Ventana</span>
          </div>

          <CroquisBus :estados="estados" :elegido="elegido" :placa="bus?.placa" @elegir="elegir" />

          <p class="contador">
            <b>{{ TOTAL_ASIENTOS - ocupados }}</b> libres de {{ TOTAL_ASIENTOS }} para {{ origen }} → {{ destino }}
          </p>
        </div>

        <div class="col-form">
          <div class="tarjeta">
            <h2 v-if="elegido == null">Elija un asiento</h2>
            <h2 v-else>Asiento {{ elegido }} <small class="etiqueta">{{ tipoDeAsiento(elegido) }}</small></h2>

            <p v-if="elegido == null" class="suave">Toque un asiento libre en el croquis del bus.</p>

            <ul v-if="boletosDelAsiento.length" class="ocupantes">
              <li v-for="b in boletosDelAsiento" :key="b.id" :class="{ cruza: cruza(b) }">
                <div><b>{{ b.nombres }}</b> · DNI {{ b.dni }}</div>
                <div class="suave">{{ b.origen }} → {{ b.destino }} · {{ numeroBoleto(b.numero) }}</div>
                <RouterLink :to="`/boleto/${viajeId}/${b.id}`">Ver / imprimir</RouterLink>
              </li>
            </ul>
            <p v-if="elegido != null && !asientoLibre" class="error">
              Este asiento ya está ocupado en el tramo {{ origen }} → {{ destino }}.
            </p>

            <form v-if="asientoLibre" class="formulario" @submit.prevent="vender">
              <p class="tramo-venta">{{ origen }} → {{ destino }}</p>
              <label class="campo">
                <span>Nombres y apellidos</span>
                <input v-model="form.nombres" autocomplete="off" maxlength="80" required />
              </label>
              <div class="fila2">
                <label class="campo">
                  <span>DNI</span>
                  <input v-model="form.dni" inputmode="numeric" maxlength="8" required />
                </label>
                <label class="campo">
                  <span>Teléfono (opcional)</span>
                  <input v-model="form.telefono" inputmode="numeric" maxlength="9" />
                </label>
              </div>
              <label class="campo">
                <span>Precio (S/)</span>
                <input v-model.number="precio" type="number" min="1" step="0.5" required />
              </label>
              <p v-if="error" class="error" role="alert">{{ error }}</p>
              <button class="btn grande" :disabled="enviando">
                {{ enviando ? 'Vendiendo…' : `Vender e imprimir · ${soles(precio)}` }}
              </button>
            </form>
          </div>

          <div class="tarjeta">
            <h2>Pasajeros de este viaje <small class="suave">({{ boletos.length }})</small></h2>
            <p v-if="!boletos.length" class="suave">Aún no hay boletos vendidos.</p>
            <div v-else class="tabla-envoltura">
              <table class="tabla">
                <thead>
                  <tr><th>Asiento</th><th>Pasajero</th><th>Tramo</th><th>Precio</th><th></th></tr>
                </thead>
                <tbody>
                  <tr v-for="b in boletos" :key="b.id">
                    <td><b>{{ b.asiento }}</b> <small class="suave">{{ b.tipoAsiento }}</small></td>
                    <td>{{ b.nombres }}<br /><small class="suave">DNI {{ b.dni }}</small></td>
                    <td>{{ b.origen }} → {{ b.destino }}</td>
                    <td>{{ soles(b.precio) }}</td>
                    <td class="acciones">
                      <RouterLink :to="`/boleto/${viajeId}/${b.id}`">Imprimir</RouterLink>
                      <button class="enlace peligro" @click="anular(b)">Anular</button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr><td colspan="3">Total vendido</td><td colspan="2"><b>{{ soles(recaudado) }}</b></td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
