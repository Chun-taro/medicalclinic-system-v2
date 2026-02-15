import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('react-chartjs-2')) return 'vendor-charts';
            if (id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('react-icons')) return 'vendor-icons';
            return 'vendor'; // all other node_modules
          }
        },
      },
    },
  },
});
