import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    proxy: {
        '/api': 'http://localhost:3001',
        '/uploads': 'http://localhost:3001'
    }
  }
})
