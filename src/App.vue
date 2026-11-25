<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { modoFirebase } from './db.js'
import { EMPRESA } from './empresa.js'

const logo = import.meta.env.BASE_URL + 'bus.svg'
</script>

<template>
  <header class="cabecera no-imprimir">
    <div class="cabecera-in">
      <RouterLink to="/" class="marca">
        <img :src="logo" alt="" width="34" height="34" />
        <span>
          <strong>{{ EMPRESA.nombre }}</strong>
          <small>Pauza · Nasca · Ica · Lima</small>
        </span>
      </RouterLink>
      <nav>
        <RouterLink to="/">Vender</RouterLink>
        <RouterLink to="/viajes">Viajes</RouterLink>
        <RouterLink to="/flota">Flota</RouterLink>
        <RouterLink to="/choferes">Choferes</RouterLink>
      </nav>
      <span v-if="modoFirebase" class="modo en-linea" title="Datos en Firebase Realtime Database">● Firebase</span>
      <span v-else class="modo demo" title="Sin configuración de Firebase: los datos se guardan solo en este navegador">Modo demo</span>
    </div>
  </header>
  <main class="contenido">
    <RouterView />
  </main>
</template>
