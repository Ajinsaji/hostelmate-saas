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
  UserCheck,
  Building,
  RotateCcw,
  Key,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import api from "../../utils/apiClient";
import useAdminAutoRefresh from "../hooks/useAdminAutoRefresh";
import MessageDetailDrawer from "../../components/MessageDetailDrawer";

export default function AdminTodayTasksWidget({ onRefreshTrigger }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "completed"
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");

  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasksToday, setCompletedTasksToday] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [categories, setCategories] = useState({
    rentRemindersCount: 0,
    ownerActivationsCount: 0,
    paymentConfirmationsCount: 0,
    failedDeliveriesCount: 0,
    pendingRegistrationsCount: 0,
    pendingActivationsCount: 0,
    pendingSubscriptionsCount: 0,
    pendingPaymentsCount: 0,
    completedTodayCount: 0,
  });

  const [selectedComm, setSelectedComm] = useState(null);
  const [retryingIds, setRetryingIds] = useState({});

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/communication/tasks/pending");
      if (res.data?.success) {
        const pTasks = res.data.pendingTasks || res.data.tasks || [];
        const cTasks = res.data.completedTasksToday || [];

        setPendingTasks(pTasks);
        setCompletedTasksToday(cTasks);
        setPendingCount(res.data.pendingCount ?? pTasks.length);
        setCompletedCount(res.data.completedCount ?? cTasks.length);
        setTotalCount(res.data.totalCount ?? (pTasks.length + cTasks.length));

        if (res.data.categories) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      console.warn("Could not load Admin Today's Tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 30-Second Visibility-Aware Auto-Refresh
  useAdminAutoRefresh(fetchTasks, 30000, true);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, onRefreshTrigger]);

  // Handle Manual wa.me Link Click
  const handleOpenWaMe = async (task) => {
    const raw = task.raw || task;
    const waUrl = task.waMeUrl || raw.waMeUrl;
    const phone = task.phone || task.recipient || raw.recipient;
    const message = task.message || raw.message || raw.customMessage || "";

    if (waUrl) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(
        `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }

    try {
      const dbId = task.dbId || task.id || raw._id;
      if (dbId) {
        await api.post(`/api/communication/whatsapp/log-manual/${dbId}`, { communicationId: dbId });
      }
      fetchTasks();
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
        fetchTasks();
      } else {
        alert(res.data?.message || "Retry failed");
        fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to retry message");
      fetchTasks();
    } finally {
      setRetryingIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  // Current display list based on active tab
  const currentList = activeTab === "pending" ? pendingTasks : completedTasksToday;

  const filteredTasks = currentList.filter((item) => {
    if (activeCategoryFilter === "all") return true;
    if (activeCategoryFilter === "whatsapp") return item.category === "whatsapp" || item.type?.includes("whatsapp");
    if (activeCategoryFilter === "registration") {
      return (
        item.category === "registration" ||
        item.category === "activation" ||
        item.type?.includes("registration") ||
        item.type?.includes("activation")
      );
    }
    if (activeCategoryFilter === "subscription_payment") {
      return (
        item.category === "subscription" ||
        item.category === "payment" ||
        item.type?.includes("subscription") ||
        item.type?.includes("payment")
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-[#202B45] rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* 1. Header Bar */}
      <div className="p-5 border-b border-[#202B45] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckSquare size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Tasks</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs">
                {pendingCount} Pending
              </span>
              {completedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] hidden sm:inline">
                  {completedCount} Done Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Today's operational activity — pending work and completed Admin actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/admin/tasks")}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
          >
            <span>Open Tasks Center</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. Primary Tabs (Pending vs Completed Today) */}
      <div className="p-3 bg-black/30 border-b border-[#202B45] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            <Clock size={14} />
            <span>Pending Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === "pending" ? "bg-black/20 text-slate-950" : "bg-amber-500/20 text-amber-300"}`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "completed"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Completed Today</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === "completed" ? "bg-black/20 text-slate-950" : "bg-emerald-500/20 text-emerald-300"}`}>
              {completedCount}
            </span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
          <button
            onClick={() => setActiveCategoryFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              activeCategoryFilter === "all"
                ? "bg-white/20 text-white"
                : "bg-transparent text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategoryFilter("whatsapp")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === "whatsapp"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-transparent text-slate-400 hover:text-emerald-300"
            }`}
          >
            <Smartphone size={12} />
            WhatsApp
          </button>
          <button
            onClick={() => setActiveCategoryFilter("registration")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === "registration"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-transparent text-slate-400 hover:text-blue-300"
            }`}
          >
            <Building size={12} />
            Registrations
          </button>
          <button
            onClick={() => setActiveCategoryFilter("subscription_payment")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === "subscription_payment"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-transparent text-slate-400 hover:text-purple-300"
            }`}
          >
            <CreditCard size={12} />
            Billing
          </button>
        </div>
      </div>

      {/* 3. Task List Queue */}
      <div className="divide-y divide-[#202B45] overflow-y-auto max-h-[380px]">
        {loading && currentList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw size={20} className="animate-spin text-emerald-400 mx-auto mb-2" />
            Loading live operational tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={32} className="text-emerald-400 opacity-70" />
            <span className="text-white font-bold text-sm">
              {activeTab === "pending" ? "All Caught Up!" : "No Completed Admin Actions Logged Yet Today"}
            </span>
            <p className="text-slate-400 max-w-sm text-xs">
              {activeTab === "pending"
                ? "There are no pending registrations, activations, WhatsApp messages, or billing items requiring attention."
                : "Completed hostel approvals, activations, WhatsApp dispatches, and security actions for today will appear here."}
            </p>
          </div>
        ) : (
          filteredTasks.map((item) => {
            const isCompleted = activeTab === "completed" || item.status === "completed" || item.status === "activated" || item.status === "manual_opened";
            const isFailed = item.status === "failed" || item.type === "whatsapp_failed";
            const isManual = item.status === "pending_manual" || item.type === "whatsapp_manual";
            const isRetrying = retryingIds[item.dbId || item.id];

            return (
              <div
                key={item.id || item.dbId || item._id}
                className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {item.category === "registration" ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Building size={16} />
                      </div>
                    ) : item.category === "activation" ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                    ) : item.category === "subscription" || item.category === "payment" ? (
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                        <CreditCard size={16} />
                      </div>
                    ) : isFailed ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertTriangle size={16} />
                      </div>
                    ) : item.templateCode === "RENT_REMINDER" ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Smartphone size={16} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {item.title || item.recipientName || "Task Item"}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            item.badgeColor === "emerald"
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                              : item.badgeColor === "rose"
                              ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                              : item.badgeColor === "amber"
                              ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                              : item.badgeColor === "purple"
                              ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                              : item.badgeColor === "blue"
                              ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                              : "bg-slate-800 border-slate-700 text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 truncate max-w-md">
                      {item.subtitle || item.details || item.message || "Operational activity"}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap mt-0.5">
                      {item.hostelName && <span className="font-medium text-slate-300">{item.hostelName}</span>}
                      {item.phone && (
                        <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                          {item.phone}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Today"}
                      </span>
                      {item.attemptCount > 0 && (
                        <span className="text-amber-400 font-semibold">(Attempt {item.attemptCount}/3)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  {/* Manual WhatsApp Button */}
                  {isManual && (item.waMeUrl || item.phone) && (
                    <button
                      onClick={() => handleOpenWaMe(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                      title="Open WhatsApp Web / App"
                    >
                      <Send size={13} />
                      <span>Open WhatsApp</span>
                    </button>
                  )}

                  {/* Retry Failed WhatsApp */}
                  {isFailed && (
                    <button
                      onClick={() => handleRetryTask(item.dbId || item.id)}
                      disabled={isRetrying || item.attemptCount >= 3}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <RefreshCw size={13} className={isRetrying ? "animate-spin" : ""} />
                      <span>{isRetrying ? "Retrying..." : item.attemptCount >= 3 ? "Action Req" : "Retry Send"}</span>
                    </button>
                  )}

                  {/* Registration / Activation Navigation */}
                  {item.actionType === "review_registration" && (
                    <button
                      onClick={() => navigate("/admin/requests")}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Building size={13} />
                      <span>Review</span>
                    </button>
                  )}

                  {item.actionType === "finalize_activation" && (
                    <button
                      onClick={() => navigate("/admin/requests")}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <ShieldCheck size={13} />
                      <span>Activate</span>
                    </button>
                  )}

                  {item.actionType === "approve_subscription" && (
                    <button
                      onClick={() => navigate("/admin/subscriptions")}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <CreditCard size={13} />
                      <span>Review Sub</span>
                    </button>
                  )}

                  {item.actionType === "verify_payment" && (
                    <button
                      onClick={() => navigate("/admin/revenue")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <CreditCard size={13} />
                      <span>Verify Pay</span>
                    </button>
                  )}

                  {/* General Detail Inspector */}
                  {item.raw && (
                    <button
                      onClick={() => setSelectedComm(item.raw)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  )}
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
          fetchTasks();
          setSelectedComm(null);
        }}
      />
    </div>
  );
}
