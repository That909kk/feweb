import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(() => {
 

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    envPrefix: 'VITE_', // Giữ nguyên
    server: {
      proxy: {
        '/address-kit': {
          target: 'https://production.cas.so',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      },
      host: true,
      allowedHosts: ['.'],
      port: 5173
    }
  }
})