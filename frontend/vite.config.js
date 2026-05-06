import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
build: {
    chunkSizeWarningLimit: 1000,   // or 1200 / 1600 — choose based on your needs
  },
})
