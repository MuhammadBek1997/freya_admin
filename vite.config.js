import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), flowbiteReact()],
  server: {
    proxy: {
      '/api': {
        target: 'https://freyabackend-n5gu1r7os-muhammads-projects-3a6ae627.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})