// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
   proxy: {
  '/api': {
    target: 'https://qsutrarmsclm.hub.swajyot.co.in:8458',
    changeOrigin: true,
    // ✅ No rewrite — forward path as-is
  },
  '/app': {
    target: 'https://qsutrarmsclm.hub.swajyot.co.in:8458',
    changeOrigin: true,
    ws: true,
  },
  '/topic': {
    target: 'https://qsutrarmsclm.hub.swajyot.co.in:8458',
    changeOrigin: true,
    ws: true,
  },
},
  },
  base: '/',
  optimizeDeps: {
    include: ['moment'],
  },
})