<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRuta } from '../composables/useRuta.js'
import { lista, fechaCorta, diaSemana, hoyISO, licenciaVencida } from '../util.js'
import { SENTIDOS, TRAMOS, claveTramo, tarifa } from '../ruta.js'
import { TOTAL_ASIENTOS } from '../asientos.js'
import { agregar, actualizar, borrar, guardar } from '../db.js'

const { datos: viajesObj } = useRuta('viajes')
const { datos: busesObj } = useRuta('buses')
const { datos: choferesObj } = useRuta('choferes')
const { datos: boletosObj } = useRuta('boletos')
const { datos: tarifasObj } = useRuta('tarifas')

const busesListos = computed(() => lista(busesObj.value).filter(b => b.estado === 'Operativo'))
const choferesListos = computed(() => lista(choferesObj.value).filter(c => c.estado === 'Activo' && !licenciaVencida(c)))

const vacio = () => ({ fecha: hoyISO(), hora: '17:00', sentido: 'PL', busId: '', choferId: '' })
const form = reactive(vacio())
const editando = ref(null)
const error = ref('')

function validar () {
  if (!form.fecha || !form.hora) return 'Indique fecha y hora de salida.'
  if (!editando.value && form.fecha < hoyISO()) return 'La fecha no puede ser anterior a hoy.'
  if (!form.busId) return 'Elija un bus operativo.'
  if (!form.choferId) return 'Elija un chofer activo.'
  const mismoDia = lista(viajesObj.value).filter(v => v.fecha === form.fecha && v.id !== editando.value)
  if (mismoDia.some(v => v.busId === form.busId)) return 'Ese bus ya tiene un viaje ese día.'
  if (mismoDia.some(v => v.choferId === form.choferId)) return 'Ese chofer ya tiene un viaje ese día.'
  return ''
}

async function guardarViaje () {
  error.value = validar()
  if (error.value) return
  const datos = { fecha: form.fecha, hora: form.hora, sentido: form.sentido, busId: form.busId, choferId: form.choferId }
  if (editando.value) await actualizar(`viajes/${editando.value}`, datos)
  else await agregar('viajes', datos)
  cancelar()
}

function editar (v) {
  editando.value = v.id
  Object.assign(form, { fecha: v.fecha, hora: v.hora, sentido: v.sentido, busId: v.busId, choferId: v.choferId })
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function cancelar () {
  editando.value = null
  Object.assign(form, vacio())
  error.value = ''
}

const vendidos = v => Object.keys(boletosObj.value[v.id] || {}).length

async function eliminar (v) {
  if (vendidos(v)) {
    alert('Este viaje ya tiene boletos vendidos. Anule primero los boletos para poder eliminarlo.')
    return
  }
  if (confirm(`¿Eliminar el viaje del ${fechaCorta(v.fecha)} a las ${v.hora}?`)) await borrar(`viajes/${v.id}`)
}

const verAnteriores = ref(false)
const viajes = computed(() =>
  lista(viajesObj.value)
    .filter(v => verAnteriores.value || v.fecha >= hoyISO())
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
)

/* ---- Tarifas ---- */
const precios = reactive({})
watch(tarifasObj, t => {
  for (const [a, b] of TRAMOS) precios[claveTramo(a, b)] = tarifa(t, a, b)
}, { immediate: true })
const tarifasGuardadas = ref(false)
async function guardarTarifas () {
  const datos = {}
  for (const [a, b] of TRAMOS) {
    const k = claveTramo(a, b)
    const n = Number(precios[k])
    if (!(n > 0)) { alert(`El precio ${a} – ${b} debe ser mayor que cero.`); return }
    datos[k] = n
  }
  await guardar('tarifas', datos)
  tarifasGuardadas.value = true
  setTimeout(() => (tarifasGuardadas.value = false), 2500)
}
</script>

<template>
  <section>
    <h1>Viajes programados</h1>

    <div class="dos-columnas">
      <form class="tarjeta formulario" @submit.prevent="guardarViaje">
        <h2>{{ editando ? 'Editar viaje' : 'Programar salida' }}</h2>
        <div class="fila2">
          <label class="campo"><span>Fecha</span><input type="date" v-model="form.fecha" required /></label>
          <label class="campo"><span>Hora</span><input type="time" v-model="form.hora" required /></label>
        </div>
        <label class="campo">
          <span>Sentido</span>
          <select v-model="form.sentido">
            <option v-for="(s, k) in SENTIDOS" :key="k" :value="k">{{ s.nombre }} ({{ s.paradas.join(' – ') }})</option>
          </select>
        </label>
        <label class="campo">
          <span>Bus</span>
          <select v-model="form.busId">
            <option value="" disabled>Elija un bus</option>
            <option v-for="b in busesListos" :key="b.id" :value="b.id">{{ b.placa }} · {{ b.marca }} {{ b.modelo }}</option>
          </select>
        </label>
        <p v-if="!busesListos.length" class="suave">No hay buses operativos. Regístrelos en <RouterLink to="/flota">Flota</RouterLink>.</p>
        <label class="campo">
          <span>Chofer</span>
          <select v-model="form.choferId">
            <option value="" disabled>Elija un chofer</option>
            <option v-for="c in choferesListos" :key="c.id" :value="c.id">{{ c.nombres }} · {{ c.categoria }}</option>
          </select>
        </label>
        <p v-if="!choferesListos.length" class="suave">No hay choferes activos con licencia vigente. Regístrelos en <RouterLink to="/choferes">Choferes</RouterLink>.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="botones">
          <button class="btn">{{ editando ? 'Guardar cambios' : 'Programar viaje' }}</button>
          <button v-if="editando" type="button" class="btn secundario" @click="cancelar">Cancelar</button>
        </div>
      </form>

      <form class="tarjeta formulario" @submit.prevent="guardarTarifas">
        <h2>Tarifas por tramo</h2>
        <p class="suave">Valen para los dos sentidos (por ejemplo, Pauza – Ica e Ica – Pauza).</p>
        <div class="tarifas">
          <label v-for="[a, b] in TRAMOS" :key="claveTramo(a, b)" class="campo">
            <span>{{ a }} – {{ b }}</span>
            <input type="number" min="1" step="0.5" v-model.number="precios[claveTramo(a, b)]" />
          </label>
        </div>
        <div class="botones">
          <button class="btn">Guardar tarifas</button>
          <span v-if="tarifasGuardadas" class="ok">Guardado ✓</span>
        </div>
      </form>
    </div>

    <div class="tarjeta">
      <div class="titulo-lista">
        <h2>Salidas</h2>
        <label class="check"><input type="checkbox" v-model="verAnteriores" /> Ver anteriores</label>
      </div>
      <p v-if="!viajes.length" class="suave">No hay viajes programados.</p>
      <div v-else class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr><th>Fecha</th><th>Hora</th><th>Ruta</th><th>Bus</th><th>Chofer</th><th>Vendidos</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="v in viajes" :key="v.id">
              <td>{{ diaSemana(v.fecha) }} {{ fechaCorta(v.fecha) }}</td>
              <td>{{ v.hora }}</td>
              <td>{{ SENTIDOS[v.sentido]?.nombre }}</td>
              <td>{{ busesObj[v.busId]?.placa || '—' }}</td>
              <td>{{ choferesObj[v.choferId]?.nombres || '—' }}</td>
              <td>{{ vendidos(v) }} boletos <small class="suave">/ {{ TOTAL_ASIENTOS }} asientos</small></td>
              <td class="acciones">
                <RouterLink :to="{ path: '/', query: { viaje: v.id } }">Vender</RouterLink>
                <button class="enlace" @click="editar(v)">Editar</button>
                <button class="enlace peligro" @click="eliminar(v)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
