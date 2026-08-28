/* eslint-disable no-undef */

// Firebase Cloud Messaging Service Worker for Android PWA & Web Push
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

const firebaseConfig = self.__FIREBASE_CONFIG__ || {
  projectId: "hostelmate-f0de8",
  messagingSenderId: "654995812093",
};

const activeConfig = {
  apiKey: firebaseConfig.apiKey || "",
  authDomain: firebaseConfig.authDomain || "hostelmate-f0de8.firebaseapp.com",
  projectId: firebaseConfig.projectId || "hostelmate-f0de8",
  storageBucket: firebaseConfig.storageBucket || "hostelmate-f0de8.firebasestorage.app",
  messagingSenderId: firebaseConfig.messagingSenderId || "654995812093",
  appId: firebaseConfig.appId || "1:654995812093:web:5d2b7c4f4a3e2189",
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(activeConfig);
  }
  const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log("[FCM-SW] Background push notification received:", payload);

      const title =
        payload.notification?.title ||
        payload.data?.title ||
        "HostelMate";

      const body =
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message ||
        "New notification received.";

      const route =
        payload.data?.route ||
        payload.data?.deepLink ||
        payload.fcmOptions?.link ||
        "/notifications";

      const options = {
        body,
        icon: payload.notification?.icon || "/logo192.png",
        badge: "/logo192.png",
        image: payload.notification?.image || undefined,
        tag: payload.data?.notificationId || payload.data?.referenceId || "hostelmate-alert",
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          route,
          notificationId: payload.data?.notificationId,
          referenceId: payload.data?.referenceId,
          timestamp: Date.now(),
        },
        actions: [
          { action: "open_notification", title: "Open" },
          { action: "dismiss", title: "Dismiss" }
        ]
      };

      self.registration.showNotification(title, options);
    });
  } catch (err) {
    console.error("[FCM-SW] Initialization error:", err);
  }
}

// Notification Click Deep-Link Handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const route =
    event.notification.data?.route ||
    "/notifications";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Focus existing open tab if available
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "FCM_NAVIGATE",
              route,
            });
            return;
          }
        }

        // Otherwise open new window/PWA viewport
        if (clients.openWindow) {
          return clients.openWindow(route);
        }
      })
  );
});
