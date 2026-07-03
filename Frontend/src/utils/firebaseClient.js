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
    console.error("Firebase messaging init failed:", e?.message || e);
    return null;
  }
}

/**
 * Register the Firebase messaging service worker explicitly.
 * This is required for background notifications to work.
 */
async function registerFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported in this browser");
    return null;
  }

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration("/");

    if (existingRegistration) {
      const scriptUrl =
        existingRegistration.active?.scriptURL ||
        existingRegistration.waiting?.scriptURL ||
        existingRegistration.installing?.scriptURL ||
        "";

      if (scriptUrl.includes("firebase-messaging-sw.js")) {
        console.log("✓ Reusing existing Firebase service worker:", existingRegistration.scope);
        return existingRegistration;
      }

      console.log("⚠️ Unregistering stale service worker:", scriptUrl || existingRegistration.scope);
      await existingRegistration.unregister();
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    console.log("✓ Firebase service worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("✗ Failed to register Firebase service worker:", error);
    return null;
  }
}

export async function requestFcmPermissionAndToken() {
  if (cachedFcmTokenPromise) {
    console.log("Using cached FCM token request");
    return cachedFcmTokenPromise;
  }

  // Return null when env not configured
  const messaging = getFirebaseMessagingSafe();
  if (!messaging) {
    console.warn("Firebase messaging not initialized (config missing)");
    return null;
  }

  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser");
    return null;
  }

  const currentPermission = Notification.permission;
  if (currentPermission !== "granted") {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied by user");
      return null;
    }
    console.log("✓ Notification permission granted");
  } else {
    console.log("✓ Notification permission already granted");
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    console.error("✗ Missing or invalid VITE_FIREBASE_VAPID_KEY - background notifications will not work");
    return null;
  }
  console.log("✓ VAPID key loaded");

  console.log("Registering Firebase messaging service worker...");
  const swRegistration = await registerFirebaseServiceWorker();
  if (!swRegistration) {
    console.error("✗ Service worker registration failed - background notifications may not work");
    return null;
  }

  const tokenPromise = (async () => {
    try {
      console.log("Requesting FCM token...");
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      });

      if (!token) {
        console.warn("✗ No FCM token returned (empty response)");
        return null;
      }

      console.log("✓ FCM token obtained:", token.substring(0, 20) + "...");
      return token;
    } catch (error) {
      console.error("✗ Failed to retrieve FCM token:", error?.message || error);
      throw error;
    }
  })();

  cachedFcmTokenPromise = tokenPromise;

  try {
    const token = await tokenPromise;
    if (!token) {
      cachedFcmTokenPromise = null;
    }
    return token;
  } catch (error) {
    cachedFcmTokenPromise = null;
    return null;
  }
}

