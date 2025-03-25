// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Ajoutez cette ligne

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false, // Désactive le HMR si tu n'en as pas besoin
    open: true, // Ouvre automatiquement dans le navigateur
    cors: true, // Permet les requêtes cross-origin
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Optimisation des dépendances
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
