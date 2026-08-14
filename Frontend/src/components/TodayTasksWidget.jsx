import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, AlertTriangle, ExternalLink, RefreshCw, Send, Smartphone } from "lucide-react";
import api from "../utils/apiClient";

export default function TodayTasksWidget({ onTaskComplete }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);

  const fetchPendingTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/communication/tasks/pending");
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
        setCount(res.data.count || 0);
      }
    } catch (err) {
      console.warn("Could not load pending communication tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const handleOpenWaMe = async (task) => {
    if (task.waMeUrl) {
      window.open(task.waMeUrl, "_blank");
    } else if (task.recipient) {
      const cleanPhone = String(task.recipient).replace(/\D/g, "");
      const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(task.customMessage || task.message || "")}`, "_blank");
    }

    try {
      await api.post("/api/communication/whatsapp/log-manual", { communicationId: task._id });
      fetchPendingTasks();
      if (onTaskComplete) onTaskComplete();
    } catch (err) {
      console.warn("Click log failed:", err);
    }
  };

  const handleRetryTask = async (task) => {
    try {
      const res = await api.post(`/api/communication/whatsapp/retry/${task._id}`);
      if (res.data?.success) {
        fetchPendingTasks();
        if (onTaskComplete) onTaskComplete();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Retry failed");
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-[#131C2E] border border-slate-800 text-xs text-slate-400 text-center">
        Loading Today's Action Tasks...
      </div>
    );
  }

  if (count === 0 && tasks.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-[#131C2E] border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Today's Communication Tasks: All Caught Up!</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">0 Pending</span>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#131C2E] border border-slate-800 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-sm">Today's Operational Action Tasks</h3>
        </div>
        <span className="bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full text-xs border border-amber-500/20">
          {count} Pending
        </span>
      </div>

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {tasks.map((t) => (
          <div key={t._id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate">{t.recipientName || "Resident"}</span>
                <span className="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {t.templateCode || t.businessEvent}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] truncate">
                {t.recipient} • {t.residentId?.roomNumber ? `Rm ${t.residentId.roomNumber}` : "General"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.status === "pending_manual" ? (
                <button
                  onClick={() => handleOpenWaMe(t)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" /> Open WhatsApp
                </button>
              ) : t.status === "failed" ? (
                <button
                  onClick={() => handleRetryTask(t)}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
