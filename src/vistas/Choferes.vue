<script setup>
import { ref, reactive, computed } from 'vue'
import { useRuta } from '../composables/useRuta.js'
import { lista, fechaCorta, licenciaVencida } from '../util.js'
import { agregar, actualizar, borrar } from '../db.js'

const { datos: choferesObj } = useRuta('choferes')
const { datos: viajesObj } = useRuta('viajes')

// Categorías de licencia para transporte de pasajeros (MTC).
const CATEGORIAS = ['A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc']
const ESTADOS = ['Activo', 'Inactivo']

const vacio = () => ({ nombres: '', dni: '', licencia: '', categoria: 'A-IIIc', vencimiento: '', telefono: '', estado: 'Activo' })
const form = reactive(vacio())
const editando = ref(null)
const error = ref('')

const choferes = computed(() => lista(choferesObj.value).sort((a, b) => a.nombres.localeCompare(b.nombres)))
const viajesDe = id => lista(viajesObj.value).filter(v => v.choferId === id).length

async function guardarChofer () {
  error.value = ''
  const nombres = form.nombres.trim().replace(/\s+/g, ' ')
  const dni = form.dni.trim()
  const licencia = form.licencia.trim().toUpperCase()
  const telefono = form.telefono.trim()
  if (nombres.length < 5) { error.value = 'Escriba nombres y apellidos completos.'; return }
  if (!/^\d{8}$/.test(dni)) { error.value = 'El DNI debe tener 8 números.'; return }
  if (choferes.value.some(c => c.dni === dni && c.id !== editando.value)) { error.value = 'Ya hay un chofer con ese DNI.'; return }
  if (!/^[A-Z0-9-]{6,12}$/.test(licencia)) { error.value = 'Escriba el número de licencia (6 a 12 letras o números).'; return }
  if (!form.vencimiento) { error.value = 'Indique la fecha de vencimiento de la licencia.'; return }
  if (telefono && !/^\d{9}$/.test(telefono)) { error.value = 'El celular debe tener 9 números.'; return }
  const datos = { nombres, dni, licencia, categoria: form.categoria, vencimiento: form.vencimiento, telefono, estado: form.estado }
  if (editando.value) await actualizar(`choferes/${editando.value}`, datos)
  else await agregar('choferes', datos)
  cancelar()
}

function editar (c) {
  editando.value = c.id
  Object.assign(form, {
    nombres: c.nombres, dni: c.dni, licencia: c.licencia, categoria: c.categoria,
    vencimiento: c.vencimiento, telefono: c.telefono || '', estado: c.estado
  })
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function cancelar () {
  editando.value = null
  Object.assign(form, vacio())
  error.value = ''
}

async function eliminar (c) {
  if (viajesDe(c.id)) {
    alert('Este chofer tiene viajes registrados. Cámbielo a «Inactivo» en vez de eliminarlo.')
    return
  }
  if (confirm(`¿Eliminar al chofer ${c.nombres}?`)) await borrar(`choferes/${c.id}`)
}
</script>

<template>
  <section>
    <h1>Choferes</h1>
    <div class="dos-columnas">
      <form class="tarjeta formulario" @submit.prevent="guardarChofer">
        <h2>{{ editando ? 'Editar chofer' : 'Registrar chofer' }}</h2>
        <label class="campo"><span>Nombres y apellidos</span><input v-model="form.nombres" maxlength="80" required /></label>
        <div class="fila2">
          <label class="campo"><span>DNI</span><input v-model="form.dni" inputmode="numeric" maxlength="8" required /></label>
          <label class="campo"><span>Celular</span><input v-model="form.telefono" inputmode="numeric" maxlength="9" /></label>
        </div>
        <div class="fila2">
          <label class="campo"><span>N° de licencia</span><input v-model="form.licencia" maxlength="12" required /></label>
          <label class="campo">
            <span>Categoría</span>
            <select v-model="form.categoria"><option v-for="c in CATEGORIAS" :key="c">{{ c }}</option></select>
          </label>
        </div>
        <div class="fila2">
          <label class="campo"><span>Licencia vence</span><input v-model="form.vencimiento" type="date" required /></label>
          <label class="campo">
            <span>Estado</span>
            <select v-model="form.estado"><option v-for="e in ESTADOS" :key="e">{{ e }}</option></select>
          </label>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="botones">
          <button class="btn">{{ editando ? 'Guardar cambios' : 'Registrar chofer' }}</button>
          <button v-if="editando" type="button" class="btn secundario" @click="cancelar">Cancelar</button>
        </div>
      </form>

      <div class="tarjeta">
        <h2>Choferes registrados <small class="suave">({{ choferes.length }})</small></h2>
        <p v-if="!choferes.length" class="suave">Aún no hay choferes.</p>
        <div v-else class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Chofer</th><th>Licencia</th><th>Vence</th><th>Estado</th><th>Viajes</th><th></th></tr></thead>
            <tbody>
              <tr v-for="c in choferes" :key="c.id">
                <td><b>{{ c.nombres }}</b><br /><small class="suave">DNI {{ c.dni }}<template v-if="c.telefono"> · {{ c.telefono }}</template></small></td>
                <td>{{ c.licencia }}<br /><small class="suave">{{ c.categoria }}</small></td>
                <td>
                  {{ fechaCorta(c.vencimiento) }}
                  <span v-if="licenciaVencida(c)" class="estado Vencida">Vencida</span>
                </td>
                <td><span class="estado" :class="c.estado">{{ c.estado }}</span></td>
                <td>{{ viajesDe(c.id) }}</td>
                <td class="acciones">
                  <button class="enlace" @click="editar(c)">Editar</button>
                  <button class="enlace peligro" @click="eliminar(c)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
