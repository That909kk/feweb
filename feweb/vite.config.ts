import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/address-kit': {
        target: 'https://production.cas.so',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
