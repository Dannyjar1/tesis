import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: false,
  },

  // pdfmake usa patrón UMD (this.pdfMake.vfs) que no funciona con ESM puro.
  // optimizeDeps lo pre-bundlea como CJS y resuelve el problema de fuentes.
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'],
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
