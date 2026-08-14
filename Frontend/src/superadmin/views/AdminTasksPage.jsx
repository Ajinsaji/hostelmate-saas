import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import api from "../../utils/apiClient";
import useAdminAutoRefresh from "../hooks/useAdminAutoRefresh";
import MessageDetailDrawer from "../../components/MessageDetailDrawer";

export default function AdminTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState({
    rentRemindersCount: 0,
    ownerActivationsCount: 0,
    paymentConfirmationsCount: 0,
    failedDeliveriesCount: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedComm, setSelectedComm] = useState(null);
  const [retryingIds, setRetryingIds] = useState({});

  const fetchTasks = useCallback(async () => {
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

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      (t.recipientName && t.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.recipient && t.recipient.includes(searchTerm)) ||
      (t.hostelId?.hostelName && t.hostelId.hostelName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.templateCode && t.templateCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;

    let matchesType = true;
    if (typeFilter === "rent") matchesType = t.templateCode === "RENT_REMINDER" || t.businessEvent === "RENT_REMINDER";
    else if (typeFilter === "owner") matchesType = t.templateCode === "OWNER_ACCOUNT_ACTIVATED" || t.recipientType === "Owner" || t.businessEvent === "OWNER_ACCOUNT_ACTIVATED";
    else if (typeFilter === "payment") matchesType = t.templateCode === "PAYMENT_RECEIVED" || t.businessEvent === "PAYMENT_RECEIVED";
    else if (typeFilter === "failed") matchesType = t.status === "failed";

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-white">Admin Operational Tasks Queue</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
                {totalCount} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Centralized queue for all pending manual WhatsApp dispatches, activation credentials, and failed delivery retries
            </p>
          </div>

          <button
            onClick={fetchTasks}
            className="px-3.5 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => setTypeFilter(typeFilter === "rent" ? "all" : "rent")}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              typeFilter === "rent"
                ? "bg-rose-500/20 border-rose-500/50 text-white"
                : "bg-slate-900/60 border-slate-800 text-rose-300 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Calendar size={14} className="text-rose-400" /> Rent Reminders
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 font-extrabold text-xs">
                {categories.rentRemindersCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">Pending WhatsApp link dispatches</span>
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === "owner" ? "all" : "owner")}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              typeFilter === "owner"
                ? "bg-amber-500/20 border-amber-500/50 text-white"
                : "bg-slate-900/60 border-slate-800 text-amber-300 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <UserCheck size={14} className="text-amber-400" /> Owner Activations
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 font-extrabold text-xs">
                {categories.ownerActivationsCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">Hostel activation notifications</span>
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === "payment" ? "all" : "payment")}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              typeFilter === "payment"
                ? "bg-yellow-500/20 border-yellow-500/50 text-white"
                : "bg-slate-900/60 border-slate-800 text-yellow-300 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <CreditCard size={14} className="text-yellow-400" /> Payment Receipts
              </span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 font-extrabold text-xs">
                {categories.paymentConfirmationsCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">Payment receipt messages</span>
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === "failed" ? "all" : "failed")}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
              typeFilter === "failed"
                ? "bg-blue-500/20 border-blue-500/50 text-white"
                : "bg-slate-900/60 border-slate-800 text-blue-300 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-blue-400" /> Failed Deliveries
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 font-extrabold text-xs">
                {categories.failedDeliveriesCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">Requires automatic retry</span>
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-slate-900/60 border border-[#202B45] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient, phone, hostel, template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending_manual">Pending Manual</option>
              <option value="failed">Failed Delivery</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-slate-900/60 border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-[#202B45]">
            {loading && tasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <RefreshCw size={24} className="animate-spin text-emerald-400 mx-auto mb-2" />
                Loading operational tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={36} className="text-emerald-400 opacity-80" />
                <span className="text-white font-bold text-base">No Matching Tasks in Queue</span>
                <p className="text-slate-400 text-xs max-w-sm">
                  All manual WhatsApp messages and automatic delivery retries are up to date.
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
                    className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isFailed ? (
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                            <AlertTriangle size={18} />
                          </div>
                        ) : item.templateCode === "RENT_REMINDER" ? (
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                            <Calendar size={18} />
                          </div>
                        ) : item.templateCode === "OWNER_ACCOUNT_ACTIVATED" || item.recipientType === "Owner" ? (
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                            <UserCheck size={18} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
                            <CreditCard size={18} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {item.recipientName || "Recipient"}
                          </span>
                          <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {item.recipient}
                          </span>
                          {item.hostelId?.hostelName && (
                            <span className="text-xs text-slate-400 font-medium">• {item.hostelId.hostelName}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="font-semibold text-slate-200">
                            {item.templateCode || item.businessEvent}
                          </span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleString("en-IN")}</span>
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

                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      {isManual && item.waMeUrl && (
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
                          onClick={() => handleRetryTask(item._id)}
                          disabled={isRetrying || item.attemptCount >= 3}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                        >
                          <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
                          <span>{isRetrying ? "Retrying..." : item.attemptCount >= 3 ? "Requires Action" : "Retry Send"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedComm(item)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
    </PageContainer>
  );
}
