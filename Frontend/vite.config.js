import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,

        // Allow large hashed bundles (prevents build failure on Vercel)
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,

        // Also prevent treating those assets as build-blocking errors
        importScripts: [],
      },
    }),
  ],
})
