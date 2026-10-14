import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://mcwifi.net',
        changeOrigin: true,
        secure: true
      },
      '/www': {
        target: 'https://mcwifi.net',
        changeOrigin: true,
        secure: true
      }
    }
  }
});