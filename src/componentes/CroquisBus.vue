<script setup>
import { FILAS } from '../asientos.js'

const props = defineProps({
  // { numeroAsiento: 'ocupado' | 'parcial' }  (lo que no aparece está libre)
  estados: { type: Object, default: () => ({}) },
  elegido: { type: Number, default: null },
  placa: { type: String, default: '' }
})
defineEmits(['elegir'])

const TEXTO = {
  libre: 'libre',
  ocupado: 'ocupado en este tramo',
  parcial: 'vendido en otro tramo, libre en este'
}
const estado = num => props.estados[num] || 'libre'
</script>

<template>
  <div class="bus" role="group" :aria-label="`Croquis del bus ${placa}`">
    <div class="bus-frente">
      <div class="volante" title="Chofer">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
          <path d="M3.5 11h6M14.5 11h6M12 14.4V21" stroke="currentColor" stroke-width="2.4" />
        </svg>
        <span>Chofer</span>
      </div>
      <span class="placa" v-if="placa">{{ placa }}</span>
      <div class="puerta">Puerta</div>
    </div>

    <div class="bus-filas">
      <template v-for="(fila, i) in FILAS" :key="i">
        <template v-for="(c, j) in fila" :key="`${i}-${j}`">
          <div v-if="c === null" class="pasadizo" aria-hidden="true"></div>
          <div v-else-if="c.bano" class="bano">SS.HH.</div>
          <button
            v-else
            type="button"
            class="asiento"
            :class="[c.tipo, estado(c.num), { elegido: elegido === c.num }]"
            :aria-pressed="elegido === c.num"
            :aria-label="`Asiento ${c.num}, ${c.tipo}, ${TEXTO[estado(c.num)]}`"
            :title="`Asiento ${c.num} · ${c.tipo} · ${TEXTO[estado(c.num)]}`"
            @click="$emit('elegir', c.num)"
          >
            <span class="num">{{ c.num }}</span>
            <span class="tipo">{{ c.tipo === 'ventana' ? 'Ventana' : 'Pasillo' }}</span>
          </button>
        </template>
      </template>
    </div>
    <div class="bus-atras">Parte trasera</div>
  </div>
</template>
