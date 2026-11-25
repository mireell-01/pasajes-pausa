import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' para que funcione en GitHub Pages (https://usuario.github.io/repositorio/)
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: { port: 5173 }
})
