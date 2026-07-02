import { useEffect } from "react";
import { requestFcmPermissionAndToken } from "../utils/firebaseClient";
import { getStoredUser } from "../utils/authToken";

// Foreground listener + device token registration.
// Background notifications are handled by firebase-messaging-sw.js.

export default function useFcmNotifications({ enabled = true, onIncoming } = {}) {
  useEffect(() => {
    if (!enabled) return;

    let unsubscribe = null;

    async function boot() {
      const token = await requestFcmPermissionAndToken();
      if (!token) return;

      const user = getStoredUser();

      try {
        const { api } = await import("../services/api");
        await api.post(`/api/notifications/device-token`, {
          token,
          platform: "web",
          // Backend derives userId/role/hostelId from JWT.
          ...(user ? {} : {}),
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

