import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function copyIndexTo404() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname || process.cwd(), 'dist')
      const indexPath = path.join(distDir, 'index.html')
      const notFoundPath = path.join(distDir, '404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  appType: 'spa',
  plugins: [
    react(),
    tailwindcss(),
    copyIndexTo404(),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor'
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
