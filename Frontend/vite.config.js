/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function firebaseConfigPlugin(env) {
  return {
    name: 'generate-firebase-config',
    apply: 'build',
    generateBundle() {
      const config = {
        apiKey: env.VITE_FIREBASE_API_KEY || "",
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "hostelmate-f0de8.firebaseapp.com",
        projectId: env.VITE_FIREBASE_PROJECT_ID || "hostelmate-f0de8",
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "hostelmate-f0de8.firebasestorage.app",
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "654995812093",
        appId: env.VITE_FIREBASE_APP_ID || "1:654995812093:web:5d2b7c4f4a3e2189",
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          importScripts: [],
        },
      }),
      firebaseConfigPlugin(env),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react/')) {
                return 'vendor-react';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react') || id.includes('react-icons')) {
                return 'vendor-icons';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (id.includes('firebase') || id.includes('socket.io-client')) {
                return 'vendor-realtime';
              }
              return 'vendor-misc';
            }
          },
        },
      },
    },
  }
})

