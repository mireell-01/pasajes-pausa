<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRuta } from '../composables/useRuta.js'
import { EMPRESA } from '../empresa.js'
import { SENTIDOS } from '../ruta.js'
import { soles, fechaCorta, diaSemana, fechaHora, numeroBoleto } from '../util.js'

const props = defineProps({ viajeId: String, boletoId: String })

const { datos: boletoObj, cargando } = useRuta(() => `boletos/${props.viajeId}/${props.boletoId}`)
const { datos: viaje } = useRuta(() => `viajes/${props.viajeId}`)
const { datos: busesObj } = useRuta('buses')
const { datos: choferesObj } = useRuta('choferes')

const boleto = computed(() => (boletoObj.value && boletoObj.value.asiento ? boletoObj.value : null))
const bus = computed(() => busesObj.value[viaje.value?.busId] || {})
const chofer = computed(() => choferesObj.value[viaje.value?.choferId] || {})

const imprimir = () => window.print()
</script>

<template>
  <section class="pagina-boleto">
    <div class="acciones-boleto no-imprimir">
      <RouterLink :to="{ path: '/', query: { viaje: viajeId } }" class="btn secundario">← Volver a la venta</RouterLink>
      <button v-if="boleto" class="btn" @click="imprimir">Imprimir boleto</button>
    </div>

    <p v-if="cargando" class="aviso">Cargando boleto…</p>
    <div v-else-if="!boleto" class="tarjeta vacio">
      <h2>Este boleto no existe o fue anulado</h2>
    </div>

    <article v-else class="boleto">
      <header class="boleto-cab">
        <div>
          <strong class="boleto-empresa">{{ EMPRESA.nombre }}</strong>
          <small>RUC {{ EMPRESA.ruc }}</small>
          <small>{{ EMPRESA.direccion }}</small>
          <small>Tel. {{ EMPRESA.telefono }}</small>
        </div>
        <div class="boleto-num">
          <span>BOLETO DE VIAJE</span>
          <b>{{ numeroBoleto(boleto.numero) }}</b>
        </div>
      </header>

      <div class="boleto-tramo">
        <div><small>Origen</small><b>{{ boleto.origen }}</b></div>
        <span class="flecha">→</span>
        <div><small>Destino</small><b>{{ boleto.destino }}</b></div>
        <div class="boleto-asiento">
          <small>Asiento</small>
          <b>{{ boleto.asiento }}</b>
          <small>{{ boleto.tipoAsiento }}</small>
        </div>
      </div>

      <dl class="boleto-datos">
        <div><dt>Pasajero</dt><dd>{{ boleto.nombres }}</dd></div>
        <div><dt>DNI</dt><dd>{{ boleto.dni }}</dd></div>
        <div><dt>Fecha de viaje</dt><dd>{{ diaSemana(viaje.fecha) }} {{ fechaCorta(viaje.fecha) }}</dd></div>
        <div><dt>Hora de salida</dt><dd>{{ viaje.hora }}</dd></div>
        <div><dt>Ruta del bus</dt><dd>{{ SENTIDOS[viaje.sentido]?.nombre }}</dd></div>
        <div><dt>Bus</dt><dd>{{ bus.placa }} · {{ bus.marca }}</dd></div>
        <div><dt>Chofer</dt><dd>{{ chofer.nombres }}</dd></div>
        <div v-if="boleto.telefono"><dt>Teléfono</dt><dd>{{ boleto.telefono }}</dd></div>
      </dl>

      <div class="boleto-total">
        <span>Total pagado</span>
        <b>{{ soles(boleto.precio) }}</b>
      </div>

      <footer class="boleto-pie">
        <p>Emitido: {{ fechaHora(boleto.vendidoEn) }}</p>
        <p>Preséntese 30 minutos antes de la salida con su DNI. Equipaje permitido: 20 kg.
          Boleto personal e intransferible.</p>
      </footer>

      <div class="boleto-talon">
        <span>Talón de control</span>
        <b>{{ numeroBoleto(boleto.numero) }}</b>
        <span>Asiento <b>{{ boleto.asiento }}</b></span>
        <span>{{ boleto.origen }} → {{ boleto.destino }}</span>
        <span>{{ fechaCorta(viaje.fecha) }} {{ viaje.hora }}</span>
        <span>{{ boleto.nombres }}</span>
      </div>
    </article>
  </section>
</template>
