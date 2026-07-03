import { useEffect, useRef } from "react";
import { requestFcmPermissionAndToken } from "../utils/firebaseClient";
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

    let unsubscribe = null;

    async function boot() {
      try {
        console.log("[useFcmNotifications] Initializing FCM...");

        const token = await requestFcmPermissionAndToken();
        if (!token) {
          console.warn("[useFcmNotifications] FCM token unavailable - background notifications disabled");
          return;
        }

        console.log("[useFcmNotifications] Token obtained, registering with backend...");
        const user = getStoredUser();

        try {
          const { api } = await import("../services/api");
          const response = await api.post(`/api/notifications/device-token`, {
            token,
            platform: "web",
            userId: user?._id || null,
          });
          
          if (response.data?.success) {
            console.log("✓ Device token registered successfully");
          } else {
            console.warn("⚠ Device token registration returned non-success:", response.data);
          }
        } catch (e) {
          console.error("✗ Failed to register device token:", e?.response?.data || e?.message || e);
        }

        // Foreground message listener
        console.log("[useFcmNotifications] Setting up foreground message listener...");
        try {
          const { getFirebaseMessagingSafe } = await import("../utils/firebaseClient");
          const messaging = getFirebaseMessagingSafe();
          if (!messaging) {
            console.warn("[useFcmNotifications] Firebase messaging not available for foreground");
            return;
          }

          const { onMessage } = await import("firebase/messaging");

          unsubscribe = onMessage(messaging, (payload) => {
            console.log("[useFcmNotifications] Foreground message received:", payload);
            
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
          
          console.log("✓ Foreground message listener active");
        } catch (e) {
          console.error("✗ Failed to setup foreground listener:", e?.message || e);
        }
      } catch (e) {
        console.error("[useFcmNotifications] Fatal initialization error:", e?.message || e);
      }
    }

    boot();

    return () => {
      try {
        unsubscribe?.();
      } catch (e) {}
    };
  }, [enabled]);
}

