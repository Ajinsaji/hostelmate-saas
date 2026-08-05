import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import useFcmNotifications from "../hooks/useFcmNotifications";
import useNotificationSocket from "../hooks/useNotificationSocket";
import { playNotificationSound } from "../utils/notificationSound";
import { api } from "../services/api";

const NotificationContext = createContext(null);

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
      const res = await api.get(`/api/notifications/mine?limit=30`);
      if (res.data?.success) setNotifications(res.data.notifications || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Bind WebSocket & FCM listeners
  useFcmNotifications({
    enabled: true,
    onIncoming: async ({ title, body, route }) => {
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

  useNotificationSocket({
    enabled: true,
    onNotification: ({ notification, unreadCount: socketUnread }) => {
      if (!notification) return;

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

  // Pull initial unread count on login/route change
  useEffect(() => {
    const ownerToken = localStorage.getItem("ownerToken");
    const adminToken = localStorage.getItem("adminToken");
    
    if (ownerToken || adminToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUnread();
      const id = setInterval(() => {
        fetchUnread();
      }, 30000);
      return () => clearInterval(id);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      await api.put(`/api/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Marked all as read");
    } catch {
      try {
        const unread = notifications.filter((n) => !n.isRead);
        for (const n of unread) {
          await api.put(`/api/notifications/read/${n._id}`);
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
      await api.put(`/api/notifications/read/${id}`);
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
      connect: () => {
        isConnectedRef.current = true;
      },
      disconnect: () => {
        isConnectedRef.current = false;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, unreadCount, loading, open, isBellAnimated]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
