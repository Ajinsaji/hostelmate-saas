import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../layouts/PageContainer";
import {
  CheckSquare,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  AlertTriangle,
  Calendar,
  CreditCard,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Building,
  Clock,
  RotateCcw,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import api from "../../utils/apiClient";
import useAdminAutoRefresh from "../hooks/useAdminAutoRefresh";
import MessageDetailDrawer from "../../components/MessageDetailDrawer";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/modals/ConfirmDialog";

export default function AdminTasksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "completed"

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

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedComm, setSelectedComm] = useState(null);
  const [retryingIds, setRetryingIds] = useState({});
  const [dismissingIds, setDismissingIds] = useState({});

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
      console.warn("Could not load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useAdminAutoRefresh(fetchTasks, 30000, true);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const handleRetryTask = async (taskId) => {
    try {
      setRetryingIds((prev) => ({ ...prev, [taskId]: true }));
      const res = await api.post(`/api/communication/whatsapp/retry/${taskId}`);
      if (res.data?.success) {
        toast.success("Task retried successfully");
        fetchTasks();
      } else {
        toast.error(res.data?.message || "Retry failed");
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
          reason: "Dismissed by admin from Today's Tasks UI",
        });
        if (res.data?.success) {
          // Immediately remove task from visible list and update counts
          setPendingTasks((prev) => prev.filter((t) => (t.dbId || t.id || t._id) !== taskId && t.id !== taskId && t.dbId !== taskId));
          setCompletedTasksToday((prev) => prev.filter((t) => (t.dbId || t.id || t._id) !== taskId && t.id !== taskId && t.dbId !== taskId));
          setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
          if (activeTab === "pending") {
            setPendingCount((c) => Math.max(0, c - 1));
          } else {
            setCompletedCount((c) => Math.max(0, c - 1));
          }
          setTotalCount((c) => Math.max(0, c - 1));
          toast.success("Task removed from Today's Tasks.");
          fetchTasks();
        } else {
          toast.error(res.data?.message || "Failed to remove task");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to remove task");
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
          reason: "Bulk dismissed by admin from Today's Tasks UI",
        });
        if (res?.data?.success) {
          const idSet = new Set(idsArray);
          setPendingTasks((prev) => prev.filter((t) => !idSet.has(t.dbId || t.id || t._id) && !idSet.has(t.id) && !idSet.has(t.dbId)));
          setCompletedTasksToday((prev) => prev.filter((t) => !idSet.has(t.dbId || t.id || t._id) && !idSet.has(t.id) && !idSet.has(t.dbId)));
          setSelectedTaskIds(new Set());
          toast.success(`Successfully removed ${res.data.dismissedCount || idsArray.length} task(s).`);
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

  const rawList = activeTab === "pending" ? pendingTasks : completedTasksToday;
  const currentList = Array.isArray(rawList) ? rawList : [];

  const filteredTasks = currentList.filter((item) => {
    if (!item) return false;

    // Search match
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.hostelName?.toLowerCase().includes(q) ||
        item.recipientName?.toLowerCase().includes(q) ||
        item.phone?.includes(q) ||
        item.details?.toLowerCase().includes(q);

      if (!match) return false;
    }

    // Category filter
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
    <PageContainer
      title="Today's Operational Tasks"
      description="Today's operational activity — pending work and completed Admin actions"
    >
      <div className="space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-[#202B45] shadow-lg">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Actions
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-[#202B45] shadow-lg">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed Today
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-[#202B45] shadow-lg">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              WhatsApp Pending
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-blue-400">
                {categories.rentRemindersCount + categories.ownerActivationsCount + categories.paymentConfirmationsCount}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-[#202B45] shadow-lg">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Failed Retries
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-rose-400">{categories.failedDeliveriesCount}</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-[#202B45] p-4 rounded-2xl">
          {/* Main Tab Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "pending"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Clock size={15} />
              <span>Pending Tasks</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/20 text-slate-950">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "completed"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <CheckCircle2 size={15} />
              <span>Completed Today</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/20 text-slate-950">
                {completedCount}
              </span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search hostel, recipient, phone, action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="registration">Registrations</option>
              <option value="activation">Activations</option>
              <option value="subscription">Subscriptions</option>
              <option value="payment">Payments</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="failed">Failed Retries</option>
            </select>

            <button
              onClick={fetchTasks}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Refresh Task Queue"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
            </button>
          </div>
        </div>

        {/* Tasks List Table */}
        <div className="bg-slate-900/60 border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
          {filteredTasks.length > 0 && (
            <div className="bg-[#131C2E] border-b border-[#202B45] px-4 py-3 flex items-center justify-between gap-3 text-xs">
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

          <div className="divide-y divide-[#202B45]">
            {loading && currentList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <RefreshCw size={24} className="animate-spin text-emerald-400 mx-auto mb-2" />
                Loading operational tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={36} className="text-emerald-400 opacity-80" />
                <span className="text-white font-bold text-base">
                  {activeTab === "pending" ? "You're all caught up" : "No Completed Admin Work Logged Yet Today"}
                </span>
                <p className="text-slate-400 text-xs max-w-sm">
                  {activeTab === "pending"
                    ? "No pending admin actions. All registrations, activations, manual WhatsApp messages, and delivery retries are up to date."
                    : "Admin operations performed today will appear here in chronological order."}
                </p>
              </div>
            ) : (
              filteredTasks.map((item) => {
                const taskId = item.dbId || item.id || item._id;
                const isFailed = item.status === "failed" || item.type === "whatsapp_failed";
                const isManual = item.status === "pending_manual" || item.type === "whatsapp_manual";
                const isRetrying = retryingIds[taskId];

                return (
                  <div
                    key={taskId}
                    className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(taskId)}
                        onChange={() => toggleSelectTask(taskId)}
                        className="w-4 h-4 rounded border-[#202B45] bg-[#0B1220] text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer shrink-0 mt-2"
                      />
                      <div className="mt-0.5 shrink-0">
                        {item.category === "registration" ? (
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Building size={18} />
                          </div>
                        ) : item.category === "activation" ? (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <ShieldCheck size={18} />
                          </div>
                        ) : item.category === "subscription" || item.category === "payment" ? (
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                            <CreditCard size={18} />
                          </div>
                        ) : isFailed ? (
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                            <AlertTriangle size={18} />
                          </div>
                        ) : item.templateCode === "RENT_REMINDER" ? (
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                            <Calendar size={18} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Smartphone size={18} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-sm">
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
                          {item.phone && (
                            <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              {item.phone}
                            </span>
                          )}
                          {item.hostelName && (
                            <span className="text-xs text-slate-400 font-medium">• {item.hostelName}</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 max-w-xl">
                          {item.subtitle || item.details || item.message || "Operational activity"}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-1">
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
                            <span className="text-amber-400 font-semibold">
                              (Attempt {item.attemptCount}/3)
                            </span>
                          )}
                          {item.failureReason && (
                            <span className="text-rose-400 truncate max-w-sm" title={item.failureReason}>
                              • Reason: {item.failureReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Triggers */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      {isManual && (item.waMeUrl || item.phone) && (
                        <button
                          onClick={() => handleOpenWaMe(item)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                        >
                          <Send size={14} />
                          <span>Open WhatsApp</span>
                        </button>
                      )}

                      {isFailed && (
                        <button
                          onClick={() => handleRetryTask(item.dbId || item.id)}
                          disabled={isRetrying || item.attemptCount >= 3}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                        >
                          <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
                          <span>{isRetrying ? "Retrying..." : item.attemptCount >= 3 ? "Requires Action" : "Retry Send"}</span>
                        </button>
                      )}

                      {item.actionType === "review_registration" && (
                        <button
                          onClick={() => navigate("/admin/requests")}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Building size={14} />
                          <span>Review Registration</span>
                        </button>
                      )}

                      {item.actionType === "finalize_activation" && (
                        <button
                          onClick={() => navigate("/admin/requests")}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          <span>Finalize Activation</span>
                        </button>
                      )}

                      {item.actionType === "approve_subscription" && (
                        <button
                          onClick={() => navigate("/admin/subscriptions")}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CreditCard size={14} />
                          <span>Review Subscription</span>
                        </button>
                      )}

                      {item.actionType === "verify_payment" && (
                        <button
                          onClick={() => navigate("/admin/revenue")}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Wallet size={14} />
                          <span>Verify Payment</span>
                        </button>
                      )}

                      {item.raw && (
                        <button
                          onClick={() => setSelectedComm(item.raw)}
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Inspect</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDismissTask(taskId)}
                        disabled={dismissingIds[taskId]}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Remove from Today's Tasks (Audit trail preserved)"
                      >
                        <Trash2 size={14} className={dismissingIds[taskId] ? "animate-spin" : ""} />
                        <span>{dismissingIds[taskId] ? "Removing..." : "Remove"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
              ? "This will remove the task from Today's Tasks. The permanent Audit Log and Communication record will remain intact."
              : `This will remove ${selectedTaskIds.size} selected task(s) from Today's Tasks. The permanent Audit Log and Communication records will remain intact.`
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
    </PageContainer>
  );
}
