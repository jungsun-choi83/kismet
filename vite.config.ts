import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { apiPlugin } from './vite-plugin-api'

export default defineConfig({
  plugins: [{ ...apiPlugin(), enforce: 'pre' }, react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
