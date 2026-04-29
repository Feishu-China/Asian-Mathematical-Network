import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_PROXY_TARGET = 'http://127.0.0.1:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        // Keep proxy mode as the default lightweight local-dev path.
        // Real-flow acceptance should use a dedicated frontend dev server with
        // VITE_API_BASE_URL pointed at http://127.0.0.1:3001/api/v1 instead.
        target: DEFAULT_PROXY_TARGET,
        changeOrigin: true,
      }
    }
  }
})
