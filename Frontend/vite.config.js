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
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
        projectId: env.VITE_FIREBASE_PROJECT_ID || "",
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: env.VITE_FIREBASE_APP_ID || "",
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
          skipWaiting: true,
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

