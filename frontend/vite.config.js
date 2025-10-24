import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on all network interfaces so other devices on LAN can access
    port: 5173,
    strictPort: true,
    proxy: {
      // Frontend http://localhost:5173  →  Backend http://localhost:5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/roles': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
