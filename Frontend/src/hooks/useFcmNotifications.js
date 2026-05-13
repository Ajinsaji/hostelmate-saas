import { useEffect } from "react";
import { requestFcmPermissionAndToken } from "../utils/firebaseClient";

// Foreground listener + device token registration.
// Background notifications are handled by firebase-messaging-sw.js.

export default function useFcmNotifications({ enabled = true, onIncoming } = {}) {
  useEffect(() => {
    if (!enabled) return;

    let unsubscribe = null;

    async function boot() {
      // env-guarded no-op if Firebase credentials are missing
      const token = await requestFcmPermissionAndToken();
      if (!token) return;

      // Register device token with backend (endpoint is assumed to exist)
      try {
        const backend = import.meta.env.VITE_API_URL;
        const authToken = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");

        await fetch(`${backend}/api/notifications/device-token`, {

          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token,
            platform: "web",
            role: user?.role || "owner",
            hostelId: user?.hostelId || null,
          }),
        });
      } catch (e) {
        // ignore until wired
      }

      // Foreground updates
      try {
        const { getFirebaseMessagingSafe } = await import("../utils/firebaseClient");
        const messaging = getFirebaseMessagingSafe();
        if (!messaging) return;

        const { onMessage } = await import("firebase/messaging");

        unsubscribe = onMessage(messaging, (payload) => {
          const route = payload?.data?.route || "";
          const title = payload?.notification?.title || "HostelMate";
          const body = payload?.notification?.body || "New notification";

          onIncoming?.({
            title,
            body,
            route,
            payload,
          });
        });
      } catch (e) {
        // ignore
      }
    }

    boot();

    return () => {
      try {
        unsubscribe?.();
      } catch (e) {}
    };
  }, [enabled, onIncoming]);
}

