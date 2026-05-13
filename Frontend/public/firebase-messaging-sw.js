/* eslint-disable no-undef */

// Firebase Messaging Service Worker
// This file must live in /public so it is served at the root.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// NOTE: Replace values at build time using Vite env is not possible inside SW directly.
// We rely on Vite to copy env-inlined values by generating this file in build in real deployment.
// For now, keep placeholders; the runtime will no-op if credentials are missing.

const firebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || "",
  authDomain: "",
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: "",
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || "",
};

// Fallback for environments where import.meta is not available in SW runtime.
// The SW will still parse, but FCM will only work once firebaseConfig is properly injected.

let app;
try {
  if (!firebase.apps?.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
} catch (e) {
  // ignore
}

const messaging = app ? firebase.messaging() : null;

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "HostelMate";
    const body = payload?.notification?.body || "New notification";

    const route = payload?.data?.route || "";

    self.registration.showNotification({
      title,
      body,
      // Pass route in data so the click handler can navigate.
      data: { route },
      icon: payload?.notification?.icon || undefined,
    });
  });
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

