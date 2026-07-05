import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, ArrowRight, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import useNotificationSocket from "../hooks/useNotificationSocket";
import { PageShell, GlassCard, StatusPill, EmptyState, PREMIUM_THEME } from "../owner/PremiumUI";

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
    <PageShell title="Notifications" subtitle={subtitle} action={<button disabled={saving || notifications.length === 0} onClick={markAllRead} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018", opacity: saving || notifications.length === 0 ? 0.7 : 1 }}><CheckCheck size={16} /> Mark all read</button>}>
      <GlassCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
            <Search size={16} style={{ color: PREMIUM_THEME.muted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications" className="w-full bg-transparent text-sm outline-none" style={{ color: PREMIUM_THEME.text }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'admissions', 'payments', 'residents', 'rooms', 'system'].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: filter === item ? PREMIUM_THEME.primary : "rgba(255,255,255,0.05)", color: filter === item ? "#031018" : PREMIUM_THEME.text }}>
                {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {loading ? <GlassCard className="text-center">Loading notifications...</GlassCard> : filteredNotifications.length === 0 ? <EmptyState title="No notifications" message="No matching updates right now." /> : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const ui = typeToUI(notification.type);
            return (
              <GlassCard key={notification._id} hover className="cursor-pointer" onClick={() => handleOpen(notification)} style={{ opacity: notification.isRead ? 0.8 : 1 }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={notification.isRead ? "neutral" : "warning"}>{ui.label}</StatusPill>
                      <span className="text-xs" style={{ color: PREMIUM_THEME.muted }}>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{notification.title || "HostelMate"}</h3>
                    <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>{notification.message}</p>
                  </div>
                  <ArrowRight size={18} style={{ color: PREMIUM_THEME.primary }} />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
      <BottomNav />
    </PageShell>
  );
}
