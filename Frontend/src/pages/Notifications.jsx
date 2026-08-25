import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, ArrowRight, Search, Sparkles, Settings as SettingsIcon } from "lucide-react";
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
    case "payment_received":
      return { color: "rgba(20,241,217,0.12)", border: "rgba(20,241,217,0.25)", label: "Payment" };
    case "room_transferred":
    case "room_added":
    case "bed_assigned":
      return { color: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", label: "Rooms" };
    case "complaint_submitted":
    case "complaint_raised":
      return { color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", label: "Complaint" };
    case "subscription_alert":
    case "account_activated":
    case "hostel_activated":
      return { color: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", label: "System" };
    default:
      return { color: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", label: "Update" };
  }
}

export default function Notifications() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
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
        api.get("/api/notifications/mine?limit=100").catch(() => api.get("/api/notifications?limit=100")),
        api.get("/api/notifications/unread-count"),
      ]);

      if (notificationsRes?.data?.success) {
        setNotifications(notificationsRes.data.notifications || []);
      }
      if (unreadRes?.data?.success) {
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
      const res = await api.get("/api/notifications/unread-count");
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
      await api.post("/api/notifications/read-all");
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
        await api.patch(`/api/notifications/${notification._id}/read`);
        setNotifications((prev) => prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // ignore
    }

    const route = notification.actionUrl || notification.meta?.route || notification.meta?.deepLink;
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

  const filteredNotifications = useMemo(() => {
    const term = search.toLowerCase();
    return notifications.filter((notification) => {
      const label = typeToUI(notification.type).label.toLowerCase();
      const matchesFilter = filter === "all" || label === filter;
      const matchesSearch = !term || `${notification.title || ""} ${notification.message || ""}`.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [notifications, search, filter]);

  return (
    <PageContainer
      title="Notifications"
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/owner/notification-settings")}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border border-slate-700 bg-white/5 hover:bg-white/10 text-slate-300 transition"
          >
            <SettingsIcon size={14} className="text-emerald-400" />
            <span>Settings</span>
          </button>
          <button
            disabled={saving || notifications.length === 0}
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
            style={{
              background: colors.accent.primary,
              color: "#031018",
              opacity: saving || notifications.length === 0 ? 0.7 : 1,
            }}
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        </div>
      }
    >
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
            <Search size={16} style={{ color: colors.text.muted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications" className="w-full bg-transparent text-sm outline-none" style={{ color: colors.text.primary }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'admissions', 'payments', 'residents', 'rooms', 'complaint', 'system'].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className="rounded-full px-3 py-2 text-xs font-semibold" style={{ background: filter === item ? colors.accent.primary : "rgba(255,255,255,0.05)", color: filter === item ? "#031018" : colors.text.primary }}>
                {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="text-center py-8 text-slate-400 text-sm">Loading notifications...</Card>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState title="No notifications" message="No matching updates right now." />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const ui = typeToUI(notification.type);
            return (
              <Card key={notification._id} hover className="cursor-pointer" onClick={() => handleOpen(notification)} style={{ opacity: notification.isRead ? 0.75 : 1 }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={notification.isRead ? "neutral" : "warning"}>{ui.label}</StatusPill>
                      <span className="text-xs" style={{ color: colors.text.muted }}>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{notification.title || "HostelMate"}</h3>
                    <p className="mt-1 text-sm text-slate-300">{notification.message}</p>
                  </div>
                  <ArrowRight size={18} style={{ color: colors.accent.primary }} className="shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
