import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Calendar,
  CreditCard,
  UserCheck
} from "lucide-react";
import api from "../../utils/apiClient";
import useAdminAutoRefresh from "../hooks/useAdminAutoRefresh";
import MessageDetailDrawer from "../../components/MessageDetailDrawer";

export default function AdminTodayTasksWidget({ onRefreshTrigger }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState({
    rentRemindersCount: 0,
    ownerActivationsCount: 0,
    paymentConfirmationsCount: 0,
    failedDeliveriesCount: 0,
  });
  const [selectedComm, setSelectedComm] = useState(null);
  const [retryingIds, setRetryingIds] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchPendingTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/communication/tasks/pending");
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
        setTotalCount(res.data.totalCount || res.data.count || 0);
        setCategories(
          res.data.categories || {
            rentRemindersCount: 0,
            ownerActivationsCount: 0,
            paymentConfirmationsCount: 0,
            failedDeliveriesCount: 0,
          }
        );
      }
    } catch (err) {
      console.warn("Could not load Admin Today's Tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 30-Second Visibility-Aware Auto-Refresh
  useAdminAutoRefresh(fetchPendingTasks, 30000, true);

  useEffect(() => {
    fetchPendingTasks();
  }, [fetchPendingTasks, onRefreshTrigger]);

  // Handle Manual wa.me Link Click
  const handleOpenWaMe = async (task) => {
    if (task.waMeUrl) {
      window.open(task.waMeUrl, "_blank", "noopener,noreferrer");
    } else if (task.recipient) {
      const cleanPhone = String(task.recipient).replace(/\D/g, "");
      const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(
        `https://wa.me/${formatted}?text=${encodeURIComponent(task.message || task.customMessage || "")}`,
        "_blank",
        "noopener,noreferrer"
      );
    }

    try {
      await api.post(`/api/communication/whatsapp/log-manual/${task._id}`, { communicationId: task._id });
      // Re-fetch to immediately remove from pending_manual list
      fetchPendingTasks();
    } catch (err) {
      console.warn("Manual click log error:", err);
    }
  };

  // Handle Automatic Retry Click
  const handleRetryTask = async (taskId) => {
    try {
      setRetryingIds((prev) => ({ ...prev, [taskId]: true }));
      const res = await api.post(`/api/communication/whatsapp/retry/${taskId}`);
      if (res.data?.success) {
        fetchPendingTasks();
      } else {
        alert(res.data?.message || "Retry failed");
        fetchPendingTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to retry message");
      fetchPendingTasks();
    } finally {
      setRetryingIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "rent") return t.templateCode === "RENT_REMINDER" || t.businessEvent === "RENT_REMINDER";
    if (activeFilter === "owner") return t.templateCode === "OWNER_ACCOUNT_ACTIVATED" || t.recipientType === "Owner" || t.businessEvent === "OWNER_ACCOUNT_ACTIVATED";
    if (activeFilter === "payment") return t.templateCode === "PAYMENT_RECEIVED" || t.businessEvent === "PAYMENT_RECEIVED";
    if (activeFilter === "failed") return t.status === "failed";
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-[#202B45] rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* 1. Header Bar */}
      <div className="p-5 border-b border-[#202B45] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Tasks</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
                {totalCount}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live operational work queue: manual WhatsApp dispatches, activations & failed retries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/admin/tasks")}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View All Tasks</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. Categorized Summary Alert Pills */}
      <div className="p-4 bg-black/20 border-b border-[#202B45] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Rent Reminders */}
        <button
          onClick={() => setActiveFilter(activeFilter === "rent" ? "all" : "rent")}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeFilter === "rent"
              ? "bg-rose-500/20 border-rose-500/50 text-white"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/15"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <Calendar size={14} className="text-rose-400" /> Rent Reminders
            </span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500/30 font-extrabold text-[11px]">
              {categories.rentRemindersCount}
            </span>
          </div>
          <span className="text-[10px] text-rose-200/60 mt-1 font-medium">Pending Review</span>
        </button>

        {/* Owner Activations */}
        <button
          onClick={() => setActiveFilter(activeFilter === "owner" ? "all" : "owner")}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeFilter === "owner"
              ? "bg-amber-500/20 border-amber-500/50 text-white"
              : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <UserCheck size={14} className="text-amber-400" /> Owner Activations
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/30 font-extrabold text-[11px]">
              {categories.ownerActivationsCount}
            </span>
          </div>
          <span className="text-[10px] text-amber-200/60 mt-1 font-medium">Credentials Pending</span>
        </button>

        {/* Payment Receipts */}
        <button
          onClick={() => setActiveFilter(activeFilter === "payment" ? "all" : "payment")}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeFilter === "payment"
              ? "bg-yellow-500/20 border-yellow-500/50 text-white"
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/15"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <CreditCard size={14} className="text-yellow-400" /> Payment Receipts
            </span>
            <span className="px-1.5 py-0.2 rounded bg-yellow-500/30 font-extrabold text-[11px]">
              {categories.paymentConfirmationsCount}
            </span>
          </div>
          <span className="text-[10px] text-yellow-200/60 mt-1 font-medium">Confirmation Ready</span>
        </button>

        {/* Failed Deliveries */}
        <button
          onClick={() => setActiveFilter(activeFilter === "failed" ? "all" : "failed")}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeFilter === "failed"
              ? "bg-blue-500/20 border-blue-500/50 text-white"
              : "bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/15"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-blue-400" /> Failed Deliveries
            </span>
            <span className="px-1.5 py-0.2 rounded bg-blue-500/30 font-extrabold text-[11px]">
              {categories.failedDeliveriesCount}
            </span>
          </div>
          <span className="text-[10px] text-blue-200/60 mt-1 font-medium">Retry Required</span>
        </button>
      </div>

      {/* 3. Task List Queue */}
      <div className="divide-y divide-[#202B45] overflow-y-auto max-h-[380px]">
        {loading && tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw size={20} className="animate-spin text-emerald-400 mx-auto mb-2" />
            Loading live operational tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={32} className="text-emerald-400 opacity-70" />
            <span className="text-white font-bold text-sm">All Caught Up!</span>
            <p className="text-slate-400 max-w-sm text-xs">
              There are no pending WhatsApp messages or failed deliveries requiring Admin action.
            </p>
          </div>
        ) : (
          filteredTasks.map((item) => {
            const isFailed = item.status === "failed";
            const isManual = item.status === "pending_manual";
            const isRetrying = retryingIds[item._id];

            return (
              <div
                key={item._id}
                className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isFailed ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertTriangle size={16} />
                      </div>
                    ) : item.templateCode === "RENT_REMINDER" ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                    ) : item.templateCode === "OWNER_ACCOUNT_ACTIVATED" || item.recipientType === "Owner" ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <UserCheck size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
                        <CreditCard size={16} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {item.recipientName || "Recipient"}
                      </span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                        {item.recipient}
                      </span>
                      {item.hostelId?.hostelName && (
                        <span className="text-[11px] text-slate-400">• {item.hostelId.hostelName}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-medium text-slate-300">
                        {item.templateCode || item.businessEvent || "NOTIFICATION"}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      {item.attemptCount > 0 && (
                        <span className="text-amber-400 font-semibold">
                          (Attempt {item.attemptCount}/3)
                        </span>
                      )}
                      {item.failureReason && (
                        <span className="text-rose-400 truncate max-w-xs" title={item.failureReason}>
                          Reason: {item.failureReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  {isManual && item.waMeUrl && (
                    <button
                      onClick={() => handleOpenWaMe(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                      title="Open WhatsApp Web / Desktop and record link opened"
                    >
                      <Send size={13} />
                      <span>Open WhatsApp</span>
                    </button>
                  )}

                  {isFailed && (
                    <button
                      onClick={() => handleRetryTask(item._id)}
                      disabled={isRetrying || item.attemptCount >= 3}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <RefreshCw size={13} className={isRetrying ? "animate-spin" : ""} />
                      <span>{isRetrying ? "Retrying..." : item.attemptCount >= 3 ? "Requires Action" : "Retry Send"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedComm(item)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Detail Drawer */}
      <MessageDetailDrawer
        isOpen={Boolean(selectedComm)}
        onClose={() => setSelectedComm(null)}
        communication={selectedComm}
        onRefresh={() => {
          fetchPendingTasks();
          setSelectedComm(null);
        }}
      />
    </div>
  );
}
