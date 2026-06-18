import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../dist-client',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8086',
      '/interaction': 'http://localhost:8086',
    }
  }
})
