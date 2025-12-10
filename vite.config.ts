import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    envPrefix: 'VITE_', // Giữ nguyên
    // Loại bỏ console.log, console.warn, console.debug, console.info khi build production
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
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