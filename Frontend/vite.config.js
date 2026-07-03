import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function firebaseConfigPlugin() {
  return {
    name: 'generate-firebase-config',
    apply: 'build',
    generateBundle() {
      const config = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || "",
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.VITE_FIREBASE_APP_ID || "",
      };

      this.emitFile({
        type: 'asset',
        fileName: 'firebase-config.js',
        source: `self.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`,
      });
    },
  };
}

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
    firebaseConfigPlugin(),
  ],
})
