import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import useNotificationSocket from "../hooks/useNotificationSocket";

function typeToUI(type) {
  switch (type) {
    case "admission_submitted":
      return { color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "Admission" };
    case "resident_approved":
      return { color: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", label: "Approved" };
    case "resident_rejected":
      return { color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "Rejected" };
    case "payment_uploaded":
      return { color: "rgba(20,241,217,0.12)", border: "rgba(20,241,217,0.25)", label: "Payment" };
    case "subscription_alert":
      return { color: "rgba(180,83,9,0.12)", border: "rgba(180,83,9,0.25)", label: "Subscription" };
    default:
      return { color: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", label: "Update" };
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pollingRef = useRef(null);

  const addNotificationToTop = (notification) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item._id === notification._id);
      if (exists) return prev;
      return [notification, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsRes, unreadRes] = await Promise.all([
        api.get(`/api/notifications/mine?limit=100`),
        api.get(`/api/notifications/unread-count`),
      ]);

      if (notificationsRes.data?.success) {
        setNotifications(notificationsRes.data.notifications || []);
      }
      if (unreadRes.data?.success) {
        setUnreadCount(unreadRes.data.unreadCount || 0);
      }
    } catch (error) {
      toast.error("Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await api.get(`/api/notifications/unread-count`);
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // ignore polling errors
    }
  };

  useEffect(() => {
    fetchNotifications();

    pollingRef.current = window.setInterval(fetchUnread, 30000);
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, []);

  useNotificationSocket({
    enabled: true,
    onNotification: ({ notification, unreadCount: socketUnread }) => {
      if (!notification) return;

      addNotificationToTop(notification);
      setUnreadCount((prev) => (typeof socketUnread === "number" ? socketUnread : prev + 1));
    },
    onDisconnect: () => {
      // polling fallback remains active
    },
    onError: () => {
      // polling fallback remains active
    },
  });

  const markAllRead = async () => {
    try {
      setSaving(true);
      await api.put(`/api/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Could not mark all notifications read");
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/api/notifications/read/${notification._id}`);
        setNotifications((prev) => prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // ignore
    }

    const route = notification.actionUrl || notification.meta?.route;
    if (route) {
      if (route.startsWith("http")) {
        window.location.href = route;
      } else {
        navigate(route);
      }
    }
  };

  const subtitle = useMemo(() => {
    if (loading) return "Loading your latest notifications";
    if (unreadCount === 0) return "You are all caught up";
    return `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`;
  }, [loading, unreadCount]);

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1">Notification Center</h1>
        <p style={{ opacity: 0.8 }}>{subtitle}</p>
      </div>

      <div className="card glass-card" style={{ background: "rgba(11,23,57,0.55)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={20} color="var(--primary)" />
            <div>
              <p className="text-h2" style={{ margin: 0 }}>Notifications</p>
              <p className="text-small" style={{ opacity: 0.75, margin: 0 }}>
                {notifications.length} items
              </p>
            </div>
          </div>
          <button className="btn-primary" disabled={saving || notifications.length === 0} onClick={markAllRead}>
            <CheckCheck size={16} style={{ marginRight: 8 }} />
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse p-8">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-small" style={{ color: "rgba(255,255,255,0.7)" }}>
            No notifications yet. Activity such as admissions, payments, and subscription alerts will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const ui = typeToUI(notification.type);
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className="card"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: ui.color,
                    border: `1px solid ${ui.border}`,
                    opacity: notification.isRead ? 0.75 : 1,
                    padding: "16px",
                    borderRadius: 18,
                    cursor: "pointer",
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-small" style={{ fontWeight: 800, marginBottom: 8, color: "#fff" }}>
                        {ui.label}
                      </p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                        {notification.title || "HostelMate"}
                      </p>
                    </div>
                    <ArrowRight size={18} color="white" />
                  </div>
                  <p className="text-small" style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.85)" }}>
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-small" style={{ color: "rgba(255,255,255,0.68)" }}>
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    {notification.isRead ? <span>Read</span> : <span>New</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
