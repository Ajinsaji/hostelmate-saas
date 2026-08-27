import { useEffect, useRef } from "react";
import { requestFcmPermissionAndToken, getFirebaseMessagingSafe } from "../utils/firebaseClient";
import { getStoredUser } from "../utils/authToken";

// Foreground listener + device token registration.
// Background notifications are handled by firebase-messaging-sw.js.

export default function useFcmNotifications({ enabled = true, onIncoming } = {}) {
  const onIncomingRef = useRef(onIncoming);

  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  useEffect(() => {
    if (!enabled) return;

    const jwt =
      localStorage.getItem("ownerToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    // Strictly require authentication before requesting or registering FCM device tokens
    if (!jwt || typeof jwt !== "string" || !jwt.trim()) {
      return;
    }

    let unsubscribe = null;

    async function boot() {
      try {
        const token = await requestFcmPermissionAndToken();

        // Strict empty token protection: reject null, undefined, empty string
        if (!token || typeof token !== "string" || !token.trim()) {
          return;
        }

        const user = getStoredUser();

        try {
          const { api } = await import("../services/api");
          await api.post(`/api/notifications/device-token`, {
            token: token.trim(),
            platform: "web",
            userId: user?._id || user?.id || null,
          });
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn("[useFcmNotifications] Device token registration deferred:", e?.message || e);
          }
        }

        // Foreground message listener
        try {
          const messaging = getFirebaseMessagingSafe();
          if (!messaging) return;

          const { onMessage } = await import("firebase/messaging");

          unsubscribe = onMessage(messaging, (payload) => {
            const route = payload?.data?.route || "";
            const title = payload?.notification?.title || "HostelMate";
            const body = payload?.notification?.body || "New notification";

            onIncomingRef.current?.({
              title,
              body,
              route,
              payload,
            });
          });
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn("[useFcmNotifications] Foreground message listener deferred:", e?.message || e);
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn("[useFcmNotifications] FCM initialization deferred:", e?.message || e);
        }
      }
    }

    boot();

    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [enabled]);
}
