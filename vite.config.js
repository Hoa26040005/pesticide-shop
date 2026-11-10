import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: false // Tắt overlay lỗi
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: ['electron'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@vladmandic/face-api')) return 'vendor-faceapi';
            if (id.includes('@ant-design/icons')) return 'vendor-antd-icons';
            if (id.includes('antd') || id.includes('@ant-design')) return 'vendor-antd';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('moment')) return 'vendor-reports';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
          }
        }
      }
    }
  }
})