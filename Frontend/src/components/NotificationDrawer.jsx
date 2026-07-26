import React, { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X, AlertCircle, AlertTriangle, Info, BellOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export const NotificationDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [nRes, cRes] = await Promise.all([
        api.get("/api/notifications?limit=30"),
        api.get("/api/notifications/unread-count"),
      ]);

      if (nRes.data?.notifications) setNotifications(nRes.data.notifications);
      if (cRes.data?.unreadCount !== undefined) setUnreadCount(cRes.data.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
        title="Notification Center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b1739] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">Notification Center</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Read All
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 transition flex gap-3 items-start ${
                    n.status !== "Read" ? "bg-white/[0.04]" : "hover:bg-white/[0.02] opacity-75"
                  }`}
                >
                  <div className="mt-0.5">
                    {n.priority === "Critical" ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : n.priority === "High" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white leading-tight">{n.title}</span>
                      <span className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                        {n.channel}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">{n.type}</span>
                    </div>
                  </div>
                  {n.status !== "Read" && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <BellOff className="w-8 h-8 mx-auto text-slate-600" />
                <p>No notifications yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDrawer;
