import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../media',
    rollupOptions: {
      output: {
        entryFileNames: 'webview.js',
        assetFileNames: 'webview.css'
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})