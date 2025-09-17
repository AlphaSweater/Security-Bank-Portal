import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: '../server/certs/server.key',
      cert: '../server/certs/server.crt',
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3443', // match backend HTTPS port
        changeOrigin: true,
        secure: false, // allow self-signed certs in dev
      },
    },
  },
})
