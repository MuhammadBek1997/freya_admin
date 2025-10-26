import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), flowbiteReact()],
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    // Devda CORS muammosini oldini olish uchun backendga proxy qilamiz
    proxy: {
      '/api': {
        target: 'https://freya-salon-backend-cc373ce6622a.herokuapp.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: 'localhost'
  }
})