import { createRouter, createWebHashHistory } from 'vue-router'
import Venta from './vistas/Venta.vue'
import Boleto from './vistas/Boleto.vue'
import Viajes from './vistas/Viajes.vue'
import Flota from './vistas/Flota.vue'
import Choferes from './vistas/Choferes.vue'

// Historial con # para que GitHub Pages no dé error 404 al recargar.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Venta },
    { path: '/boleto/:viajeId/:boletoId', component: Boleto, props: true },
    { path: '/viajes', component: Viajes },
    { path: '/flota', component: Flota },
    { path: '/choferes', component: Choferes },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
