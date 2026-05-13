import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

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

export async function requestFcmPermissionAndToken() {
  // Return null when env not configured
  const messaging = getFirebaseMessagingSafe();
  if (!messaging) return null;

  if (!("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("Missing VITE_FIREBASE_VAPID_KEY");
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey,
    // Service worker path is defined by default in most cases; for custom, pass swRegistration.
  });

  return token || null;
}

