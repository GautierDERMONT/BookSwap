// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteImagemin from 'vite-plugin-imagemin' // Ajoutez cette ligne

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({ // Ajouter ce plugin
      gifsicle: { optimizationLevel: 3 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: {
        plugins: [{ removeViewBox: false }]
      }
    })
  ],
  server: {
    hmr: false,
    open: true,
    cors: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
