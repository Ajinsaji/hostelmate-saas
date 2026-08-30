import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { requestFcmPermissionAndToken, getFirebaseMessagingSafe } from "../utils/firebaseClient";
import { getStoredUser, getAnyAuthToken, getDeviceId } from "../utils/authToken";

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
    let isSubscribed = true;

    async function boot(retryAttempt = 0) {
      const jwt = getAnyAuthToken();
      const user = getStoredUser();
      const deviceId = getDeviceId();
      const deviceIdFingerprint = deviceId ? `${deviceId.slice(0, 8)}...` : "unknown";
      const userIdStr = user?._id || user?.id || null;
      const userFingerprint = userIdStr ? `${String(userIdStr).slice(0, 8)}...` : "none";
      const role = user?.role || "user";
      const permissionState = typeof Notification !== "undefined" ? Notification.permission : "unsupported";

      if (import.meta.env.DEV || (typeof window !== "undefined" && window.location.hostname.includes("render"))) {
        console.log(`[FCM CLIENT INIT] platform=web userId=${userFingerprint} role=${role} deviceId=${deviceIdFingerprint} permissionState=${permissionState}`);
        console.log(`[FCM PERMISSION] state=${permissionState}`);
      }

      // Require valid authenticated user context before requesting or registering FCM device tokens
      if (!jwt || typeof jwt !== "string" || !jwt.trim() || !user) {
        return;
      }

      try {
        const token = await requestFcmPermissionAndToken();

        // Strict empty token protection: reject null, undefined, empty string
        if (!token || typeof token !== "string" || !token.trim() || !isSubscribed) {
          return;
        }

        const trimmedToken = token.trim();
        const tokenFingerprint = `${trimmedToken.slice(0, 8)}...`;

        if (import.meta.env.DEV || (typeof window !== "undefined" && window.location.hostname.includes("render"))) {
          console.log(`[FCM DEVICE TOKEN REQUEST] userId=${userFingerprint} role=${role} platform=web deviceId=${deviceIdFingerprint} tokenFingerprint=${tokenFingerprint}`);
        }

        try {
          const { api } = await import("../services/api");
          const res = await api.post(`/api/notifications/device-token`, {
            token: trimmedToken,
            deviceId,
            platform: "web",
            userId: user?._id || user?.id || null,
          });

          if (import.meta.env.DEV || (typeof window !== "undefined" && window.location.hostname.includes("render"))) {
            console.log(`[FCM DEVICE TOKEN RESPONSE] status=${res.status} userId=${userFingerprint} tokenFingerprint=${tokenFingerprint}`);
          }
        } catch (e) {
          const status = e?.response?.status || (e?.message?.includes("401") ? 401 : "ERR");
          if (import.meta.env.DEV || (typeof window !== "undefined" && window.location.hostname.includes("render"))) {
            console.warn(`[FCM DEVICE TOKEN RESPONSE] status=${status} userId=${userFingerprint} tokenFingerprint=${tokenFingerprint} error=${e?.message || e}`);
          }

          // Retry device token registration if initial call fails due to transient 401 or auth timing
          if (retryAttempt < 2 && isSubscribed) {
            const nextAttempt = retryAttempt + 1;
            if (import.meta.env.DEV) {
              console.log(`[FCM DEVICE TOKEN RETRY] userId=${userFingerprint} attempt=${nextAttempt}`);
            }
            setTimeout(() => {
              if (isSubscribed) boot(nextAttempt);
            }, nextAttempt * 1500);
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
      isSubscribed = false;
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
