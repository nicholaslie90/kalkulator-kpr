import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/kalkulator-kpr/ on GitHub Pages.
  base: '/kalkulator-kpr/',
  plugins: [react()],
})
