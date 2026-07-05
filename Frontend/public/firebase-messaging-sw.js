/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

const firebaseConfig = self.__FIREBASE_CONFIG__;

if (
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Background message:", payload);

    const title =
      payload.notification?.title || "HostelMate";

    const options = {
      body:
        payload.notification?.body ||
        "New notification",

      icon: "/logo192.png",
      badge: "/logo192.png",

      image: payload.notification?.image,

      tag:
        payload.data?.notificationId ||
        "hostelmate",

      renotify: true,

      requireInteraction: true,

      silent: false,

      vibrate: [200, 100, 200],

      data: {
        route:
          payload.data?.route ||
          "/notifications",
      },
    };

    self.registration.showNotification(
      title,
      options
    );
  });
}

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

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

          if (clients.openWindow) {
            return clients.openWindow(route);
          }
        })
    );
  }
);