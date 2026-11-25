<script setup>
import { ref, reactive, computed } from 'vue'
import { useRuta } from '../composables/useRuta.js'
import { lista } from '../util.js'
import { TOTAL_ASIENTOS, ASIENTOS } from '../asientos.js'
import { agregar, actualizar, borrar } from '../db.js'

const { datos: busesObj } = useRuta('buses')
const { datos: viajesObj } = useRuta('viajes')

const ESTADOS = ['Operativo', 'Mantenimiento', 'Inactivo']
const ventanas = ASIENTOS.filter(a => a.tipo === 'ventana').length
const pasillos = ASIENTOS.filter(a => a.tipo === 'pasillo').length
const anioMax = new Date().getFullYear() + 1

const vacio = () => ({ placa: '', marca: '', modelo: '', anio: '', estado: 'Operativo' })
const form = reactive(vacio())
const editando = ref(null)
const error = ref('')

const buses = computed(() => lista(busesObj.value).sort((a, b) => a.placa.localeCompare(b.placa)))
const viajesDe = id => lista(viajesObj.value).filter(v => v.busId === id).length

async function guardarBus () {
  error.value = ''
  const placa = form.placa.trim().toUpperCase()
  const anio = Number(form.anio)
  if (!/^[A-Z0-9]{3}-?[A-Z0-9]{3}$/.test(placa)) { error.value = 'La placa debe tener 6 letras o números, por ejemplo V2A-401.'; return }
  if (buses.value.some(b => b.placa === placa && b.id !== editando.value)) { error.value = 'Ya existe un bus con esa placa.'; return }
  if (!form.marca.trim()) { error.value = 'Escriba la marca.'; return }
  if (!(anio >= 1990 && anio <= anioMax)) { error.value = `El año debe estar entre 1990 y ${anioMax}.`; return }
  const datos = {
    placa, marca: form.marca.trim(), modelo: form.modelo.trim(), anio, asientos: TOTAL_ASIENTOS, estado: form.estado
  }
  if (editando.value) await actualizar(`buses/${editando.value}`, datos)
  else await agregar('buses', datos)
  cancelar()
}

function editar (b) {
  editando.value = b.id
  Object.assign(form, { placa: b.placa, marca: b.marca, modelo: b.modelo || '', anio: b.anio, estado: b.estado })
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function cancelar () {
  editando.value = null
  Object.assign(form, vacio())
  error.value = ''
}

async function eliminar (b) {
  if (viajesDe(b.id)) {
    alert('Este bus tiene viajes registrados. Cámbielo a «Inactivo» en vez de eliminarlo.')
    return
  }
  if (confirm(`¿Eliminar el bus ${b.placa}?`)) await borrar(`buses/${b.id}`)
}
</script>

<template>
  <section>
    <h1>Flota de buses</h1>
    <div class="dos-columnas">
      <form class="tarjeta formulario" @submit.prevent="guardarBus">
        <h2>{{ editando ? 'Editar bus' : 'Registrar bus' }}</h2>
        <div class="fila2">
          <label class="campo"><span>Placa</span><input v-model="form.placa" maxlength="7" placeholder="V2A-401" required /></label>
          <label class="campo"><span>Año</span><input v-model="form.anio" type="number" min="1990" :max="anioMax" required /></label>
        </div>
        <div class="fila2">
          <label class="campo"><span>Marca</span><input v-model="form.marca" maxlength="30" placeholder="Scania" required /></label>
          <label class="campo"><span>Modelo</span><input v-model="form.modelo" maxlength="40" placeholder="K410" /></label>
        </div>
        <label class="campo">
          <span>Estado</span>
          <select v-model="form.estado"><option v-for="e in ESTADOS" :key="e">{{ e }}</option></select>
        </label>
        <p class="suave">Cada bus tiene {{ TOTAL_ASIENTOS }} asientos: {{ ventanas }} de ventana y {{ pasillos }} de pasillo.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="botones">
          <button class="btn">{{ editando ? 'Guardar cambios' : 'Registrar bus' }}</button>
          <button v-if="editando" type="button" class="btn secundario" @click="cancelar">Cancelar</button>
        </div>
      </form>

      <div class="tarjeta">
        <h2>Buses registrados <small class="suave">({{ buses.length }})</small></h2>
        <p v-if="!buses.length" class="suave">Aún no hay buses.</p>
        <div v-else class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Placa</th><th>Bus</th><th>Año</th><th>Estado</th><th>Viajes</th><th></th></tr></thead>
            <tbody>
              <tr v-for="b in buses" :key="b.id">
                <td><b>{{ b.placa }}</b></td>
                <td>{{ b.marca }} {{ b.modelo }}<br /><small class="suave">{{ b.asientos }} asientos</small></td>
                <td>{{ b.anio }}</td>
                <td><span class="estado" :class="b.estado">{{ b.estado }}</span></td>
                <td>{{ viajesDe(b.id) }}</td>
                <td class="acciones">
                  <button class="enlace" @click="editar(b)">Editar</button>
                  <button class="enlace peligro" @click="eliminar(b)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
