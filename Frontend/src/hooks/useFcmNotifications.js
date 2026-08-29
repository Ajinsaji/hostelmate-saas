import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { requestFcmPermissionAndToken, getFirebaseMessagingSafe } from "../utils/firebaseClient";
import { getStoredUser } from "../utils/authToken";

// Foreground listener + device token registration.
// Background notifications are handled by firebase-messaging-sw.js.

export default function useFcmNotifications({ enabled = true, onIncoming } = {}) {
  const location = useLocation();
  const onIncomingRef = useRef(onIncoming);

  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe = null;

    async function boot() {
      const jwt =
        localStorage.getItem("ownerToken") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token");

      // Require authentication before requesting or registering FCM device tokens
      if (!jwt || typeof jwt !== "string" || !jwt.trim()) {
        return;
      }
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
            const title = payload?.notification?.title || payload?.data?.title || "HostelMate";
            const body = payload?.notification?.body || payload?.data?.body || "New notification";

            onIncomingRef.current?.({
              title,
              body,
              route,
              payload,
            });

            // Display native OS notification if permission is granted in foreground
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                const notif = new Notification(title, {
                  body,
                  icon: "/logo192.png",
                  badge: "/logo192.png",
                  tag: payload?.data?.notificationId || undefined,
                  data: { route },
                });
                notif.onclick = () => {
                  window.focus();
                  if (route && window.location.pathname !== route) {
                    window.location.href = route;
                  }
                };
              } catch (notifErr) {
                // Ignore if browser restricts Notification constructor in foreground
              }
            }
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

    const handleAuthChange = () => {
      boot();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth_state_changed", handleAuthChange);
    }

    return () => {
      try {
        if (typeof window !== "undefined") {
          window.removeEventListener("auth_state_changed", handleAuthChange);
        }
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [enabled, location.pathname]);
}
