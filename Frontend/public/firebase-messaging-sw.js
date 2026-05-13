/* eslint-disable no-undef */

// Firebase Messaging Service Worker
// This file must live in /public so it is served at the root.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// NOTE: Replace values at build time using Vite env is not possible inside SW directly.
// We rely on Vite to copy env-inlined values by generating this file in build in real deployment.
// For now, keep placeholders; the runtime will no-op if credentials are missing.

// IMPORTANT: Service workers cannot access `import.meta.env` in production.
// Use VITE_FIREBASE_* values at build-time by hardcoding them here during deployment,
// OR ensure you generate this file at build time.
//
// To prevent Vercel service worker evaluation crashes, we only attempt initialization
// when required config fields are non-empty.

const firebaseConfig = {
  // NOTE: These placeholders must be replaced during deployment.
  // For production you should generate this file at build time, or manually
  // set real values here (public Firebase config only).
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
      cfg.apiKey &&
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
  } catch (e) {
    // ignore if already initialized
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Background message:", payload);

    const notificationTitle = payload?.notification?.title || "HostelMate";
    const notificationOptions = {
      body: payload?.notification?.body || "New notification",
      data: payload?.data || {},
      icon: payload?.notification?.icon || "/logo192.png",
      badge: payload?.notification?.icon || "/logo192.png",
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn(
    "[firebase-messaging-sw.js] Firebase config missing/invalid. Background notifications disabled."
  );
}



self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const route = event.notification.data?.route || "/";

  // Support minimized/background clicks: focus existing tab if possible.


  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.includes("/"));
      if (client) {
        client.focus();
        client.postMessage({ type: "FCM_NAVIGATE", route });
        return;
      }

      return self.clients.openWindow(route);
    })
  );
});

