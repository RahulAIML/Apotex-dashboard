import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Simulator endpoints: dim_actividades + rol_play_sim_extractor + members + administrators
      '/apotex/api': {
        target: 'https://serv.aux-rolplay.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      // PHP Bridge: direct DB access for all advanced KPIs
      '/bridge': {
        target: 'https://serv.aux-rolplay.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => `/apotex/bridge/index.php${path.replace(/^\/bridge/, '')}`,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT ?? '4173'),
    allowedHosts: ['all'],
    proxy: {
      '/apotex/api': {
        target: 'https://serv.aux-rolplay.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      '/bridge': {
        target: 'https://serv.aux-rolplay.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => `/apotex/bridge/index.php${path.replace(/^\/bridge/, '')}`,
      },
    },
  },
})
