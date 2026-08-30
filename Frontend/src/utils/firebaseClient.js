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
      "/firebase-cloud-messaging-push-scope"
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
        scope: "/firebase-cloud-messaging-push-scope",
      }
    );

    const activeRegistration = await waitForServiceWorkerActive(registration);
    const resolvedRegistration = activeRegistration || registration;

    if (import.meta.env.DEV || (typeof window !== "undefined" && window.location.hostname.includes("render"))) {
      const swState = resolvedRegistration?.active ? "active" : resolvedRegistration?.waiting ? "waiting" : resolvedRegistration?.installing ? "installing" : "none";
      console.log(`[FCM SW REGISTERED] scope=${resolvedRegistration?.scope || "/firebase-cloud-messaging-push-scope"} swState=${swState}`);
    }

    return resolvedRegistration;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[FCM GET TOKEN FAILED] errorCode=${error?.code || "SW_REGISTER_ERROR"} errorMessage=${error?.message || String(error)} permissionState=${typeof Notification !== "undefined" ? Notification.permission : "unsupported"}`);
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
      console.warn("[FCM GET TOKEN FAILED] errorCode=MESSAGING_NOT_CONFIGURED errorMessage=Firebase messaging not initialized");
    }
    return null;
  }

  if (!("Notification" in window)) {
    if (import.meta.env.DEV) {
      console.warn("[FCM GET TOKEN FAILED] errorCode=NOTIFICATIONS_UNSUPPORTED errorMessage=Notifications API not available in browser");
    }
    return null;
  }

  const currentPermission = Notification.permission;
  if (currentPermission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (import.meta.env.DEV) {
        console.warn(`[FCM GET TOKEN FAILED] errorCode=PERMISSION_DENIED errorMessage=User rejected notification permission permissionState=${permission}`);
      }
      return null;
    }
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    if (import.meta.env.DEV) {
      console.warn("[FCM GET TOKEN FAILED] errorCode=MISSING_VAPID_KEY errorMessage=VITE_FIREBASE_VAPID_KEY missing from environment");
    }
    return null;
  }

  const swRegistration = await registerFirebaseServiceWorker();
  if (!swRegistration) {
    if (import.meta.env.DEV) {
      console.warn("[FCM GET TOKEN FAILED] errorCode=SW_UNAVAILABLE errorMessage=Service worker registration failed or worker unavailable");
    }
    return null;
  }

  const tokenPromise = (async () => {
    try {
      if (import.meta.env.DEV) {
        console.log(`[FCM GET TOKEN START] platform=web permissionState=${Notification.permission} swScope=${swRegistration.scope || "unknown"}`);
      }

      const activeSw = await waitForServiceWorkerActive(swRegistration);
      if (!activeSw || !activeSw.active) {
        if (import.meta.env.DEV) {
          console.warn("[FCM GET TOKEN FAILED] errorCode=NO_ACTIVE_WORKER errorMessage=Registration active worker timing timeout");
        }
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: activeSw,
      });

      if (!token || typeof token !== "string" || !token.trim()) {
        if (import.meta.env.DEV) {
          console.warn("[FCM GET TOKEN FAILED] errorCode=EMPTY_TOKEN errorMessage=Firebase returned empty device token");
        }
        return null;
      }

      const trimmedToken = token.trim();
      const tokenFingerprint = `${trimmedToken.slice(0, 8)}...`;
      if (import.meta.env.DEV) {
        console.log(`[FCM GET TOKEN SUCCESS] platform=web tokenFingerprint=${tokenFingerprint}`);
      }
      return trimmedToken;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[FCM GET TOKEN FAILED] errorCode=${error?.code || "GET_TOKEN_ERROR"} errorMessage=${error?.message || String(error)} permissionState=${Notification.permission}`);
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
