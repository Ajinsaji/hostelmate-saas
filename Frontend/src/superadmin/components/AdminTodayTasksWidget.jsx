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
  Trash2,
} from "lucide-react";
import api from "../../utils/apiClient";
import useAdminAutoRefresh from "../hooks/useAdminAutoRefresh";
import MessageDetailDrawer from "../../components/MessageDetailDrawer";
import toast from "react-hot-toast";
import ConfirmDialog from "./modals/ConfirmDialog";

export default function AdminTodayTasksWidget({ onRefreshTrigger }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "completed"
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasksToday, setCompletedTasksToday] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [dismissingIds, setDismissingIds] = useState({});

  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null); // null for bulk, string id for single
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
      if (res?.data?.success) {
        const pTasks = Array.isArray(res.data.pendingTasks)
          ? res.data.pendingTasks
          : Array.isArray(res.data.tasks)
          ? res.data.tasks
          : [];
        const cTasks = Array.isArray(res.data.completedTasksToday)
          ? res.data.completedTasksToday
          : [];

        setPendingTasks(pTasks);
        setCompletedTasksToday(cTasks);
        setPendingCount(Number(res.data.pendingCount ?? res.data.summary?.pendingCount ?? pTasks.length) || 0);
        setCompletedCount(Number(res.data.completedCount ?? res.data.completedTodayCount ?? res.data.summary?.completedTodayCount ?? cTasks.length) || 0);
        setTotalCount(Number(res.data.totalCount ?? res.data.summary?.totalActivityCount ?? (pTasks.length + cTasks.length)) || 0);

        if (res.data.categories && typeof res.data.categories === "object") {
          setCategories((prev) => ({ ...prev, ...res.data.categories }));
        }
      }
    } catch (err) {
      console.warn("Could not load Admin Today's Tasks:", err);
      // Retain safe default states
      setPendingTasks((prev) => prev || []);
      setCompletedTasksToday((prev) => prev || []);
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
    const raw = task?.raw || task || {};
    const waUrl = task?.waMeUrl || raw.waMeUrl;
    const phone = task?.phone || task?.recipient || raw.recipient;
    const message = task?.message || raw.message || raw.customMessage || "";

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
      const dbId = task?.dbId || task?.id || raw._id;
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
      if (res?.data?.success) {
        toast.success("Task retried successfully");
        fetchTasks();
      } else {
        toast.error(res?.data?.message || "Retry failed");
        fetchTasks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to retry message");
      fetchTasks();
    } finally {
      setRetryingIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleDismissTask = (taskId) => {
    if (!taskId) return;
    setTaskToDelete(taskId);
    setIsConfirmModalOpen(true);
  };

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      const taskId = taskToDelete;
      try {
        setDismissingIds((prev) => ({ ...prev, [taskId]: true }));
        const res = await api.post(`/api/admin/tasks/completed/${encodeURIComponent(taskId)}/dismiss`, {
          reason: "Dismissed by admin from Today's Tasks Widget",
        });
        if (res?.data?.success) {
          toast.success("Task removed from Today's Tasks.");
          setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
          fetchTasks();
        } else {
          toast.error(res?.data?.message || "Failed to remove task");
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to remove task");
      } finally {
        setDismissingIds((prev) => ({ ...prev, [taskId]: false }));
        setIsConfirmModalOpen(false);
        setTaskToDelete(null);
      }
    } else if (selectedTaskIds.size > 0) {
      const idsArray = Array.from(selectedTaskIds);
      try {
        setIsBulkDeleting(true);
        const res = await api.post("/api/admin/tasks/completed/bulk-dismiss", {
          taskIds: idsArray,
          reason: "Bulk dismissed by admin from Today's Tasks Widget",
        });
        if (res?.data?.success) {
          toast.success(`Successfully removed ${res.data.dismissedCount || idsArray.length} task(s).`);
          setSelectedTaskIds(new Set());
          fetchTasks();
        } else {
          toast.error(res?.data?.message || "Failed to remove selected tasks.");
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to remove selected tasks.");
      } finally {
        setIsBulkDeleting(false);
        setIsConfirmModalOpen(false);
      }
    }
  };

  // Current display list based on active tab with safe array coercion
  const rawList = activeTab === "pending" ? pendingTasks : completedTasksToday;
  const currentList = Array.isArray(rawList) ? rawList : [];

  const filteredTasks = currentList.filter((item) => {
    if (!item) return false;
    if (categoryFilter === "all") return true;
    if (categoryFilter === "whatsapp") {
      return (
        item.category === "whatsapp" ||
        item.type?.includes("whatsapp") ||
        item.templateCode === "RENT_REMINDER" ||
        item.templateCode === "OWNER_ACCOUNT_ACTIVATED" ||
        item.templateCode === "PAYMENT_RECEIVED"
      );
    }
    if (categoryFilter === "registration" || categoryFilter === "registrations") {
      return (
        item.category === "registration" ||
        item.type?.includes("registration") ||
        item.actionType === "review_registration"
      );
    }
    if (categoryFilter === "activation" || categoryFilter === "activations") {
      return (
        item.category === "activation" ||
        item.type?.includes("activation") ||
        item.actionType === "finalize_activation"
      );
    }
    if (categoryFilter === "subscription" || categoryFilter === "subscriptions") {
      return (
        item.category === "subscription" ||
        item.type?.includes("subscription") ||
        item.actionType === "approve_subscription"
      );
    }
    if (categoryFilter === "payment" || categoryFilter === "payments") {
      return (
        item.category === "payment" ||
        item.type?.includes("payment") ||
        item.actionType === "verify_payment"
      );
    }
    if (categoryFilter === "subscription_payment") {
      return (
        item.category === "subscription" ||
        item.category === "payment" ||
        item.type?.includes("subscription") ||
        item.type?.includes("payment")
      );
    }
    if (categoryFilter === "failed" || categoryFilter === "failed_deliveries") {
      return (
        item.status === "failed" ||
        item.category === "failed" ||
        item.type === "whatsapp_failed" ||
        item.type?.includes("failed")
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
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
                {pendingCount} Pending
              </span>
              {completedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] hidden sm:inline">
                  {completedCount} Completed Today
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
            onClick={() => setCategoryFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "all"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategoryFilter("registration")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "registration" || categoryFilter === "registrations"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Registrations ({categories?.pendingRegistrationsCount || 0})
          </button>
          <button
            onClick={() => setCategoryFilter("activation")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "activation" || categoryFilter === "activations"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Activations ({categories?.pendingActivationsCount || 0})
          </button>
          <button
            onClick={() => setCategoryFilter("subscription")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "subscription" || categoryFilter === "subscriptions"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Subscriptions ({categories?.pendingSubscriptionsCount || 0})
          </button>
          <button
            onClick={() => setCategoryFilter("payment")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "payment" || categoryFilter === "payments"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Payments ({categories?.pendingPaymentsCount || 0})
          </button>
          <button
            onClick={() => setCategoryFilter("whatsapp")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "whatsapp"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            WhatsApp ({(categories?.rentRemindersCount || 0) + (categories?.ownerActivationsCount || 0) + (categories?.paymentConfirmationsCount || 0)})
          </button>
          <button
            onClick={() => setCategoryFilter("failed")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
              categoryFilter === "failed" || categoryFilter === "failed_deliveries"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Failed ({categories?.failedDeliveriesCount || 0})
          </button>
        </div>
      </div>
      
      {/* Select All & Bulk Action Toolbar */}
      {filteredTasks.length > 0 && (
        <div className="bg-[#131C2E] border-b border-[#202B45] px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-bold hover:text-white">
              <input
                type="checkbox"
                checked={
                  filteredTasks.length > 0 &&
                  filteredTasks.every((t) => selectedTaskIds.has(t.dbId || t.id || t._id))
                }
                onChange={() => {
                  const visibleIds = filteredTasks.map((t) => t.dbId || t.id || t._id).filter(Boolean);
                  const allSel = visibleIds.length > 0 && visibleIds.every((id) => selectedTaskIds.has(id));
                  if (allSel) {
                    setSelectedTaskIds(new Set());
                  } else {
                    setSelectedTaskIds(new Set(visibleIds));
                  }
                }}
                className="w-4 h-4 rounded border-[#202B45] bg-[#0B1220] text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer"
              />
              <span>Select All ({filteredTasks.length})</span>
            </label>
            {selectedTaskIds.size > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">
                {selectedTaskIds.size} Selected
              </span>
            )}
          </div>

          {selectedTaskIds.size > 0 && (
            <button
              onClick={() => {
                setTaskToDelete(null);
                setIsConfirmModalOpen(true);
              }}
              disabled={isBulkDeleting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} className={isBulkDeleting ? "animate-spin" : ""} />
              <span>{isBulkDeleting ? "Deleting..." : `Delete Selected (${selectedTaskIds.size})`}</span>
            </button>
          )}
        </div>
      )}

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
              {activeTab === "pending" ? "You're all caught up" : "No Completed Admin Actions Logged Yet Today"}
            </span>
            <p className="text-slate-400 max-w-sm text-xs">
              {activeTab === "pending"
                ? "No pending admin actions. All registrations, activations, WhatsApp messages, and billing items are up to date."
                : "Completed hostel approvals, activations, WhatsApp dispatches, and security actions for today will appear here."}
            </p>
          </div>
        ) : (
          filteredTasks.map((item) => {
            const taskId = item.dbId || item.id || item._id;
            const isCompleted = activeTab === "completed" || item.status === "completed" || item.status === "activated" || item.status === "manual_opened";
            const isFailed = item.status === "failed" || item.type === "whatsapp_failed";
            const isManual = item.status === "pending_manual" || item.type === "whatsapp_manual";
            const isRetrying = retryingIds[taskId];

            return (
              <div
                key={taskId}
                className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(taskId)}
                    onChange={() => toggleSelectTask(taskId)}
                    className="w-4 h-4 rounded border-[#202B45] bg-[#0B1220] text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer shrink-0 mt-2"
                  />

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
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Send WhatsApp</span>
                    </button>
                  )}

                  {/* Retry Button */}
                  {isFailed && (
                    <button
                      onClick={() => handleRetryTask(item.id || item.dbId)}
                      disabled={isRetrying}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isRetrying ? "animate-spin" : ""} />
                      <span>{isRetrying ? "Retrying..." : "Retry"}</span>
                    </button>
                  )}

                  {/* Action Link Buttons */}
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

                  <button
                    onClick={() => handleDismissTask(taskId)}
                    disabled={dismissingIds[taskId]}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                    title="Remove from Today's Tasks"
                  >
                    <Trash2 size={13} className={dismissingIds[taskId] ? "animate-spin" : ""} />
                    <span>{dismissingIds[taskId] ? "Removing..." : "Remove"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={taskToDelete ? "Remove Task?" : `Remove ${selectedTaskIds.size} Selected Tasks?`}
        message={
          taskToDelete
            ? "This will remove the task from Today's Tasks list. The permanent Audit Log and Communication record will remain intact."
            : `This will remove ${selectedTaskIds.size} selected task(s) from Today's Tasks list. The permanent Audit Log and Communication records will remain intact.`
        }
        confirmLabel={isBulkDeleting ? "Deleting..." : "Remove Task"}
        cancelLabel="Cancel"
        isDanger={true}
        loading={isBulkDeleting}
      />

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
