import { useEffect, useMemo, useState } from "react";

import { Bell, CheckCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import useFcmNotifications from "../hooks/useFcmNotifications";
import { playNotificationSound } from "../utils/notificationSound";











function typeToUI(type) {
  switch (type) {
    case "admission_submitted":
      return { color: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.35)", label: "Admission" };
    case "resident_approved":
      return { color: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.35)", label: "Approved" };
    case "resident_rejected":
      return { color: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.35)", label: "Rejected" };
    case "payment_uploaded":
      return { color: "rgba(20,241,217,0.12)", border: "rgba(20,241,217,0.28)", label: "Payment" };
    case "subscription_alert":
      return { color: "rgba(180,83,9,0.18)", border: "rgba(180,83,9,0.35)", label: "Subscription" };
    default:
      return { color: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.10)", label: "Update" };
  }
}

export default function NotificationBell() {
  useFcmNotifications({
    enabled: true,
    onIncoming: async ({ title, body, route }) => {
      // Best-effort realtime UX; safe no-ops if APIs are missing.
      try {
        // sound (autoplay-safe; silently fails if blocked)
        playNotificationSound({ cooldownMs: 900 });
      } catch (e) {}

      try {
        toast((t) => (
          <div style={{ fontWeight: 800 }}>
            {title || "HostelMate"}: {body || "New notification"}
          </div>
        ));
      } catch (e) {}


      try {
        // prevent UI staleness
        await Promise.all([fetchUnread(), (open ? fetchNotifications() : fetchUnread())]);
      } catch (e) {
        // ignore
      }

      // optionally bounce to route immediately if provided
      // (still allow user to use dropdown to mark read)
      if (route) {
        // don't auto-navigate if dropdown is open
      }
    },
  });

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const axiosAuth = useMemo(() => {
    return axios.create({
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  const fetchUnread = async () => {
    try {
      const res = await axiosAuth.get(`${import.meta.env.VITE_API_URL}/api/notifications/unread-count`);
      if (res.data?.success) setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      // silent
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get(`${import.meta.env.VITE_API_URL}/api/notifications/mine?limit=30`);
      if (res.data?.success) setNotifications(res.data.notifications || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();

    // Lightweight polling for unread badge even before FCM wiring is live
    const id = setInterval(() => {
      fetchUnread();
    }, 30000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const markAllRead = async () => {
    // We don't have bulk endpoint yet; mark by iterating.
    try {
      const unread = notifications.filter((n) => !n.isRead);
      for (const n of unread) {
        await axiosAuth.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${n._id}`);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Marked all as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNavigate = async (n) => {
    try {
      if (!n.isRead) {
        await axiosAuth.put(`${import.meta.env.VITE_API_URL}/api/notifications/read/${n._id}`);
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (e) {
      // ignore
    }

    const route = n?.meta?.route;
    if (route) {
      navigate(route);
    }

    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn-icon"
        style={{ background: "rgba(255,255,255,0.2)", position: "relative" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell size={22} color="white" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ef4444",
              color: "white",
              fontSize: "11px",
              fontWeight: "bold",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s infinite",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="glass-card"
          style={{
            position: "absolute",
            top: "54px",
            right: 0,
            width: "320px",
            maxWidth: "88vw",
            zIndex: 2000,
            padding: 12,
          }}
        >
          <div className="flex justify-between items-center mb-2" style={{ padding: "0 6px" }}>
            <div>
              <h3 style={{ color: "#fff", fontWeight: 900 }}>Notifications</h3>
              <p className="text-small" style={{ color: "rgba(255,255,255,0.7)" }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-icon"
                style={{ width: 32, height: 32, background: "rgba(255,255,255,0.08)" }}
                onClick={markAllRead}
              >
                <CheckCheck size={14} color="white" />
              </button>
              <button
                className="btn-icon"
                style={{ width: 32, height: 32, background: "rgba(255,255,255,0.08)" }}
                onClick={() => setOpen(false)}
              >
                <X size={14} color="white" />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && <p className="text-small">Loading...</p>}

            {!loading && notifications.length === 0 && (
              <p className="text-small" style={{ color: "rgba(255,255,255,0.65)", padding: 10 }}>
                No notifications yet.
              </p>
            )}

            {!loading &&
              notifications.map((n) => {
                const ui = typeToUI(n.type);
                return (
                  <div
                    key={n._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(n)}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: `1px solid ${ui.border}`,
                      background: ui.color,
                      marginBottom: 8,
                      cursor: "pointer",
                      opacity: n.isRead ? 0.7 : 1,
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <p className="text-small" style={{ fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                      {ui.label}
                      <span style={{ opacity: 0.8, fontWeight: 600, marginLeft: 8 }}>
                        • {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                    <p className="text-small" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {n.message}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

