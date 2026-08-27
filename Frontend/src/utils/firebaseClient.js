import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

let cachedFcmTokenPromise = null;

const hasEnv = () => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID
  );
};

export function getFirebaseAppConfig() {
  if (!hasEnv()) return null;

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function getFirebaseMessagingSafe() {
  try {
    const cfg = getFirebaseAppConfig();
    if (!cfg) return null;

    const app = getApps().length ? getApps()[0] : initializeApp(cfg);
    const messaging = getMessaging(app);
    return messaging;
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Firebase messaging initialization deferred:", e?.message || e);
    }
    return null;
  }
}

/**
 * Helper to wait until a ServiceWorkerRegistration has an active worker
 * to prevent PushManager.subscribe() race condition errors.
 */
export function waitForServiceWorkerActive(registration, timeoutMs = 8000) {
  if (!registration) return Promise.resolve(null);
  if (registration.active) return Promise.resolve(registration);

  return new Promise((resolve) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) {
      setTimeout(() => resolve(registration.active ? registration : null), 500);
      return;
    }

    let timer = null;

    const onStateChange = () => {
      if (worker.state === "activated" || registration.active) {
        if (timer) clearTimeout(timer);
        worker.removeEventListener("statechange", onStateChange);
        resolve(registration);
      } else if (worker.state === "redundant") {
        if (timer) clearTimeout(timer);
        worker.removeEventListener("statechange", onStateChange);
        resolve(null);
      }
    };

    worker.addEventListener("statechange", onStateChange);

    timer = setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      resolve(registration.active ? registration : null);
    }, timeoutMs);
  });
}

/**
 * Register/reuse the dedicated Firebase messaging service worker.
 */
export async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Service workers not supported in this browser");
    }
    return null;
  }

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js"
    );

    if (existingRegistration) {
      const scriptUrl =
        existingRegistration.active?.scriptURL ||
        existingRegistration.waiting?.scriptURL ||
        existingRegistration.installing?.scriptURL ||
        "";

      if (scriptUrl.includes("firebase-messaging-sw.js")) {
        const activeRegistration = await waitForServiceWorkerActive(existingRegistration);
        if (activeRegistration) return activeRegistration;
      }
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      {
        scope: "/firebase-messaging-sw.js",
      }
    );

    const activeRegistration = await waitForServiceWorkerActive(registration);
    return activeRegistration || registration;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Failed to register Firebase service worker:", error?.message || error);
    }
    return null;
  }
}

export async function requestFcmPermissionAndToken() {
  if (cachedFcmTokenPromise) {
    return cachedFcmTokenPromise;
  }

  const messaging = getFirebaseMessagingSafe();
  if (!messaging) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Firebase messaging not configured");
    }
    return null;
  }

  if (!("Notification" in window)) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Notifications not supported in this browser");
    }
    return null;
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (import.meta.env.DEV) {
        console.warn("[FCM] Notification permission not granted");
      }
      return null;
    }
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Missing VITE_FIREBASE_VAPID_KEY");
    }
    return null;
  }

  const swRegistration = await registerFirebaseServiceWorker();
  if (!swRegistration) {
    if (import.meta.env.DEV) {
      console.warn("[FCM] Service worker registration unavailable");
    }
    return null;
  }

  const tokenPromise = (async () => {
    try {
      const activeSw = await waitForServiceWorkerActive(swRegistration);
      if (!activeSw || !activeSw.active) {
        if (import.meta.env.DEV) {
          console.warn("[FCM] Registration has no active worker - deferring getToken");
        }
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: activeSw,
      });

      if (!token || typeof token !== "string" || !token.trim()) {
        return null;
      }

      return token.trim();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[FCM] Push registration unavailable:", error?.message || error);
      }
      return null;
    }
  })();

  cachedFcmTokenPromise = tokenPromise;

  try {
    const token = await tokenPromise;
    if (!token) {
      cachedFcmTokenPromise = null;
    }
    return token;
  } catch {
    cachedFcmTokenPromise = null;
    return null;
  }
}
