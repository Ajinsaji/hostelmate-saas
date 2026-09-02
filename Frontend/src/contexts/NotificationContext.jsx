import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import useFcmNotifications from "../hooks/useFcmNotifications";
import useNotificationSocket from "../hooks/useNotificationSocket";
import { playNotificationSound } from "../utils/notificationSound";
import { api } from "../services/api";
import { getStoredOwner, getStoredAdmin } from "../utils/authToken";

const NotificationContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY: notifications may only be displayed when notification.userId
// matches the currently authenticated user. The backend query is authoritative;
// this check is defense-in-depth only, guarding against stale socket payloads
// or any race condition during account switch.
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentAuthenticatedUserId() {
  try {
    const admin = getStoredAdmin();
    if (admin?._id || admin?.id) return String(admin._id || admin.id);
    const owner = getStoredOwner();
    if (owner?._id || owner?.id) return String(owner._id || owner.id);
    return null;
  } catch {
    return null;
  }
}

export function NotificationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBellAnimated, setIsBellAnimated] = useState(false);
  const animationTimer = useRef(null);
  const isConnectedRef = useRef(false);
  const recentToastIdsRef = useRef(new Set());

  const addNotificationToTop = (notification) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item._id === notification._id);
      if (exists) return prev;
      return [notification, ...prev].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    });
  };

  const fetchUnread = async () => {
    try {
      const res = await api.get(`/api/notifications/unread-count`);
      if (res.data?.success) setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silent
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/notifications?limit=30`);
      if (res.data?.success) setNotifications(res.data.notifications || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all notification state. Called on logout to prevent a subsequent
   * user (same device, same browser) from seeing the previous user's state.
   */
  const clearNotificationState = () => {
    setNotifications([]);
    setUnreadCount(0);
    setOpen(false);
    setIsBellAnimated(false);
    recentToastIdsRef.current.clear();
    if (animationTimer.current) {
      clearTimeout(animationTimer.current);
    }
  };

  // Helper to deduplicate toasts across Socket.IO and FCM foreground delivery
  const shouldShowToastForId = (id) => {
    if (!id) return true;
    const strId = String(id);
    if (recentToastIdsRef.current.has(strId)) {
      return false; // Already toasted recently — suppress duplicate
    }
    recentToastIdsRef.current.add(strId);
    setTimeout(() => {
      recentToastIdsRef.current.delete(strId);
    }, 8000);
    return true;
  };

  // Bind FCM foreground listener
  useFcmNotifications({
    enabled: true,
    onIncoming: async ({ title, body, route, payload }) => {
      const currentUserId = getCurrentAuthenticatedUserId();
      const fcmUserId = payload?.data?.userId || null;
      const notifId = payload?.data?.notificationId || null;

      // Defense-in-depth: if payload specifies a target userId, verify it matches
      if (fcmUserId && currentUserId && String(fcmUserId) !== currentUserId) {
        console.warn(
          "[NOTIFICATION SECURITY BLOCK] FCM payload targeted to another user — suppressed.",
          { currentUserId, fcmUserId, notifId }
        );
        return;
      }

      // Deduplicate: if socket already showed toast for this notificationId, skip
      if (notifId && !shouldShowToastForId(notifId)) {
        return;
      }

      try {
        playNotificationSound({ cooldownMs: 900 });
      } catch { /* silent */ }

      try {
        toast(() => (
          <div style={{ fontWeight: 800 }}>
            {title || "HostelMate"}: {body || "New notification"}
          </div>
        ));
      } catch { /* silent */ }

      try {
        await fetchUnread();
        if (open) {
          await fetchNotifications();
        }
      } catch { /* silent */ }

      if (route && !open) {
        navigate(route);
      }
    },
  });

  // Bind Socket.IO realtime notification listener
  useNotificationSocket({
    enabled: true,
    onNotification: ({ notification, unreadCount: socketUnread }) => {
      if (!notification) return;

      // ── Defense-in-depth recipient check ──────────────────────────────────
      // The backend is the authoritative isolation boundary; this check guards
      // against stale socket payloads during account switches.
      // If notification.userId is present, it MUST match the currently
      // authenticated user. If it does not match, block the toast entirely.
      const currentUserId = getCurrentAuthenticatedUserId();
      const notifUserId = notification.userId ? String(notification.userId) : null;

      if (notifUserId && currentUserId && notifUserId !== currentUserId) {
        console.warn(
          "[NOTIFICATION SECURITY BLOCK] Received notification for a different user — suppressed.",
          { currentUserId, notificationRecipientUserId: notifUserId, notificationId: notification._id }
        );
        return; // Do NOT display this toast or update state
      }
      // ── End recipient check ───────────────────────────────────────────────

      // Deduplicate: if FCM foreground already showed toast for this notificationId, skip
      if (notification._id && !shouldShowToastForId(notification._id)) {
        return;
      }

      console.info(
        `[NOTIFICATION TOAST] authenticatedUserId=${currentUserId} ` +
        `notificationId=${notification._id} recipientUserId=${notifUserId}`
      );

      addNotificationToTop(notification);
      setUnreadCount((prev) =>
        typeof socketUnread === "number" ? socketUnread : prev + 1
      );
      setIsBellAnimated(true);

      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
      animationTimer.current = window.setTimeout(() => {
        setIsBellAnimated(false);
      }, 280);

      try {
        playNotificationSound({ cooldownMs: 900 });
      } catch { /* silent */ }

      try {
        toast.success(notification.title || "New notification", {
          duration: 4000,
        });
      } catch { /* silent */ }
    },
    onDisconnect: () => {
      isConnectedRef.current = false;
    },
    onError: () => {
      isConnectedRef.current = false;
    },
  });

  // Pull initial unread count on login/route change.
  // Runs when a token exists — does NOT rely on client-supplied userId.
  useEffect(() => {
    const ownerToken = localStorage.getItem("ownerToken");
    const adminToken = localStorage.getItem("adminToken");

    if (ownerToken || adminToken) {
      const currentUserId = getCurrentAuthenticatedUserId();
      console.info(`[NOTIFICATION CLIENT INIT] authenticatedUserId=${currentUserId}`);
      fetchUnread();
      const id = setInterval(() => {
        fetchUnread();
      }, 30000);
      return () => clearInterval(id);
    } else {
      // No token present (logout occurred) — clear notification state
      clearNotificationState();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, []);

  const markAllRead = async () => {
    try {
      await api.post(`/api/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Marked all as read");
    } catch {
      try {
        const unread = notifications.filter((n) => !n.isRead);
        for (const n of unread) {
          await api.patch(`/api/notifications/${n._id}/read`);
        }
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Marked all as read");
      } catch {
        toast.error("Failed to mark all as read");
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      open,
      setOpen,
      isBellAnimated,
      markAllRead,
      markAsRead,
      refresh: fetchUnread,
      clearNotificationState,
      connect: () => {
        isConnectedRef.current = true;
      },
      disconnect: () => {
        isConnectedRef.current = false;
      },
    }),
    [notifications, unreadCount, loading, open, isBellAnimated]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
