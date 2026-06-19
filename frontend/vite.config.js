

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHost = env.VITE_ALLOWED_HOST || 'localhost';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    server: {
      port: 3000,
      host: '0.0.0.0', // allow external access
      allowedHosts: allowedHost.split(',').map(h => h.trim()),
    },
  }
})
