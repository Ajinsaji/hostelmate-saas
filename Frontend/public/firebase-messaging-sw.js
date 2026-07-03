/* eslint-disable no-undef */

// Firebase Messaging Service Worker
// This file must live in /public so it is served at the root.

importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

// NOTE: Replace values at build time using Vite env is not possible inside SW directly.
// We rely on Vite to generate /firebase-config.js at build time, or use the placeholder values below.

// IMPORTANT: Service workers cannot access `import.meta.env` in production.
// Use VITE_FIREBASE_* values at build-time by hardcoding them here during deployment,
// OR ensure you generate this file at build time.
//
// To prevent Vercel service worker evaluation crashes, we only attempt initialization
// when required config fields are non-empty.

const firebaseConfig = self.__FIREBASE_CONFIG__ || {
  // NOTE: These placeholders should be replaced during deployment.
  // The apiKey must be the Firebase Web API key (starts with "AIza").
  apiKey: "BIV9VuYsa_WqehZNiyaepcgB-Lh1hpTs_UmUKgetlpW1Mx2DMkxpyhBrxo_izXfxjPqbD03865KzYji-S0mLh7U",
  authDomain: "hostelmate-f0de8.firebaseapp.com",
  projectId: "hostelmate-f0de8",
  storageBucket: "hostelmate-f0de8.firebasestorage.app",
  messagingSenderId: "654995812093",
  appId: "1:654995812093:web:6cfeed4b8a6fc5a15d9894",
};

function isValidFirebaseConfig(cfg) {
  return Boolean(
    cfg &&
      typeof cfg.apiKey === "string" &&
      cfg.apiKey.startsWith("AIza") &&
      cfg.projectId &&
      cfg.messagingSenderId &&
      cfg.appId
  );
}

// Always register click handler to avoid SW crashes.
// Background message handler is attached only when Firebase config exists.

if (isValidFirebaseConfig(firebaseConfig)) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log("[firebase-messaging-sw.js] Firebase initialized");
  } catch (e) {
    // ignore if already initialized
    console.log("[firebase-messaging-sw.js] Firebase already initialized:", e?.message);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] 🔔 Background message received:", payload);

    const notificationTitle = payload?.notification?.title || "HostelMate";
    const notificationOptions = {
      body: payload?.notification?.body || "New notification",
      data: payload?.data || {},
      icon: payload?.notification?.icon || "/logo192.png",
      badge: payload?.notification?.icon || "/logo192.png",
      tag: "hostelmate-notification",
      requireInteraction: false,
    };

    console.log("[firebase-messaging-sw.js] Showing notification:", notificationTitle);
    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  console.log("[firebase-messaging-sw.js] Background message handler registered ✓");
} else {
  console.warn(
    "[firebase-messaging-sw.js] Firebase config missing/invalid. Background notifications disabled."
  );
}

self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event.notification.tag);
  event.notification.close();

  const route = event.notification.data?.route || "/";
  console.log("[firebase-messaging-sw.js] Navigating to:", route);

  // Support minimized/background clicks: focus existing tab if possible.
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.includes("/"));
      if (client) {
        console.log("[firebase-messaging-sw.js] Focusing existing client");
        client.focus();
        client.postMessage({ type: "FCM_NAVIGATE", route });
        return;
      }

      console.log("[firebase-messaging-sw.js] Opening new window");
      return self.clients.openWindow(route);
    })
  );
});

