import React, { useState, useEffect, useCallback, useRef } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import StatusBadge from "../components/feedback/StatusBadge";
import LoadingState from "../components/feedback/LoadingState";
import EmptyState from "../components/feedback/EmptyState";
import toast from "../../services/toast";
import { api } from "../../services/api";
import {
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiX,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiList,
  FiShield,
  FiSliders,
  FiCalendar,
  FiDownload,
  FiEye,
  FiExternalLink,
  FiInfo,
  FiFilter,
} from "react-icons/fi";

export const SubscriptionCenter = React.memo(() => {
  const [activeTab, setActiveTab] = useState("subscriptions"); // subscriptions | requests | calculator | logs
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search and filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestStatusFilter, setRequestStatusFilter] = useState("pending");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [approveForm, setApproveForm] = useState({
    extensionDays: 30,
    approvedAmount: 0,
    paymentStatus: "Paid",
    paidAmount: 0,
    adminNote: "",
  });

  const [rejectReason, setRejectReason] = useState("");

  const [extendForm, setExtendForm] = useState({
    extensionDays: 30,
    amount: 0,
    paymentStatus: "Paid",
    reason: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    daysAdjustment: 0,
    reason: "",
  });

  // Calculator State
  const [calcHostelId, setCalcHostelId] = useState("");
  const [calcData, setCalcData] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else if (!analytics) setLoading(true);
      setFetchError(null);

      const [dashResult, requestsResult, hostelsResult, logsResult] = await Promise.allSettled([
        api.get("/api/admin/subscriptions/dashboard"),
        api.get("/api/admin/subscriptions/requests", {
          params: { status: requestStatusFilter },
        }),
        api.get("/api/admin/subscriptions/hostels", {
          params: { status: statusFilter, search: searchQuery },
        }),
        api.get("/api/admin/subscriptions/reminder-logs"),
      ]);

      const dashData = dashResult.status === "fulfilled" ? dashResult.value?.data : null;
      const requestsData = requestsResult.status === "fulfilled" ? requestsResult.value?.data : null;
      const hostelsData = hostelsResult.status === "fulfilled" ? hostelsResult.value?.data : null;
      const logsData = logsResult.status === "fulfilled" ? logsResult.value?.data : null;

      if (dashData?.success) setAnalytics(dashData.analytics);
      if (requestsData?.success) setRequests(requestsData.requests || []);
      if (hostelsData?.success) {
        const subs = hostelsData.subscriptions || [];
        setHostels(subs);
        if (!calcHostelId && subs.length > 0) {
          setCalcHostelId(subs[0].hostelId);
        }
      }
      if (logsData?.success) setReminderLogs(logsData.logs || []);

      setLastUpdated(new Date());

      const rejected = [dashResult, requestsResult, hostelsResult, logsResult].filter(
        (r) => r.status === "rejected"
      );
      if (rejected.length > 0 && !dashData?.success && !hostelsData?.success) {
        const firstErr = rejected[0].reason;
        const msg = firstErr?.response?.data?.message || firstErr?.message || "Failed to load subscription data.";
        setFetchError(msg);
      }
    } catch (err) {
      console.error("[SubscriptionCenter] Error loading data:", err);
      const friendlyMsg =
        err?.response?.data?.message || err?.message || "Unable to load subscription requests.";
      setFetchError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [requestStatusFilter, statusFilter, searchQuery, calcHostelId, analytics]);

  useEffect(() => {
    fetchDashboardData();
  }, [requestStatusFilter, statusFilter, searchQuery]);

  // 60-Second Conservative Auto Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboardData(true);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Load History
  const openHistoryModal = async (hostel) => {
    setSelectedHostel(hostel);
    setShowHistoryModal(true);
    try {
      setHistoryLoading(true);
      const res = await api.get(`/api/admin/subscriptions/${hostel.hostelId}/history`);
      const data = res?.data || {};
      if (data.success) {
        setHistoryRecords(data.history || []);
      }
    } catch (err) {
      console.error("[SubscriptionCenter] Error loading history:", err);
      toast.error(err?.response?.data?.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Details Modal
  const openDetailsModal = (hostel) => {
    setSelectedHostel(hostel);
    setShowDetailsModal(true);
  };

  // Run Calculator
  const handleRunCalculator = async (hId) => {
    const targetId = hId || calcHostelId;
    if (!targetId) return;
    try {
      setCalcLoading(true);
      const res = await api.get("/api/admin/subscriptions/calculator", {
        params: { hostelId: targetId, monthlyRate: 10 },
      });
      const data = res?.data || {};
      if (data.success) {
        setCalcData(data.calculation);
      }
    } catch (err) {
      console.error("[SubscriptionCenter] Calculator error:", err);
      toast.error(err?.response?.data?.message || "Failed to run resident calculator");
    } finally {
      setCalcLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!hostels || hostels.length === 0) {
      toast.error("No subscription data available to export");
      return;
    }
    const headers = [
      "Hostel Name",
      "Owner Name",
      "Phone",
      "Email",
      "Plan",
      "Status",
      "Days Remaining",
      "Expiry Date",
      "Active Residents",
      "Monthly Bill (INR)",
      "Payment Status",
    ];

    const rows = hostels.map((h) => [
      `"${(h.hostelName || "").replace(/"/g, '""')}"`,
      `"${(h.ownerName || "").replace(/"/g, '""')}"`,
      `"${(h.phone || "").replace(/"/g, '""')}"`,
      `"${(h.email || "").replace(/"/g, '""')}"`,
      `"${(h.plan || "").replace(/"/g, '""')}"`,
      `"${(h.status || "").replace(/"/g, '""')}"`,
      h.daysRemaining !== null ? h.daysRemaining : "",
      h.expiryDate ? new Date(h.expiryDate).toLocaleDateString("en-GB") : "",
      h.activeResidents || 0,
      h.estimatedAmount || h.amount || 0,
      `"${(h.paymentStatus || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostelmate_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscription directory exported successfully!");
  };

  // 1. Approve Continuation Request
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      const res = await api.post(`/api/admin/subscriptions/requests/${selectedRequest._id}/approve`, approveForm);
      const data = res?.data || {};
      if (data.success) {
        toast.success(data.message || "Continuation request approved!");
        setShowApproveModal(false);
        fetchDashboardData(true);
      } else {
        toast.error(data.message || "Approval failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error approving request");
    }
  };

  // 2. Reject Continuation Request
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      const res = await api.post(`/api/admin/subscriptions/requests/${selectedRequest._id}/reject`, {
        reason: rejectReason,
      });
      const data = res?.data || {};
      if (data.success) {
        toast.success("Request rejected");
        setShowRejectModal(false);
        setRejectReason("");
        fetchDashboardData(true);
      } else {
        toast.error(data.message || "Rejection failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error rejecting request");
    }
  };

  // 3. Manual Extension
  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHostel) return;
    try {
      const res = await api.post(`/api/admin/subscriptions/${selectedHostel.hostelId}/extend`, extendForm);
      const data = res?.data || {};
      if (data.success) {
        toast.success(data.message || "Subscription extended successfully!");
        setShowExtendModal(false);
        fetchDashboardData(true);
      } else {
        toast.error(data.message || "Extension failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error extending subscription");
    }
  };

  // 4. Safe Adjust Days (+/-)
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHostel) return;
    try {
      const res = await api.post(`/api/admin/subscriptions/${selectedHostel.hostelId}/adjust-days`, adjustForm);
      const data = res?.data || {};
      if (data.success) {
        toast.success(data.message || "Subscription days adjusted!");
        setShowAdjustModal(false);
        fetchDashboardData(true);
      } else {
        toast.error(data.message || "Adjustment failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adjusting subscription days");
    }
  };

  // Filter Hostels by paymentStatus if filter active
  const filteredHostels = hostels.filter((h) => {
    if (paymentFilter === "all" || paymentFilter === "All") return true;
    return String(h.paymentStatus || "").toLowerCase() === paymentFilter.toLowerCase();
  });

  if (fetchError && !analytics) {
    return (
      <PageContainer>
        <SectionHeader title="SaaS Subscription & Continuation Hub" subtitle="HostelMate Enterprise Unified Owner Plan" />
        <ContentContainer>
          <div className="bg-[#0b1739]/60 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <FiAlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Unable to load subscription data.</h3>
              <p className="text-xs text-slate-400">{fetchError}</p>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} /> Retry
            </button>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (loading && !analytics) {
    return (
      <PageContainer>
        <SectionHeader title="SaaS Subscription & Continuation Hub" subtitle="HostelMate Enterprise Unified Owner Plan" />
        <ContentContainer>
          <LoadingState message="Loading Subscription Engine & Requests..." />
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <SectionHeader
            title="SaaS Subscription & Continuation Hub"
            subtitle="Unified Owner Plan, 30-Day Trials, Prorated Resident Billing (₹10/head), & Continuation Workflow"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      <ContentContainer>
        {/* Dynamic Summary Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5 mb-6">
            {/* Card 1: Pending Requests */}
            <div
              onClick={() => {
                setActiveTab("requests");
                setRequestStatusFilter("pending");
              }}
              className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending Requests</span>
                <FiClock className="text-amber-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-amber-300 mt-2">{analytics.pendingRequests || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">Awaiting admin review</span>
            </div>

            {/* Card 2: Active Hostels */}
            <div
              onClick={() => {
                setActiveTab("subscriptions");
                setStatusFilter("active");
              }}
              className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Active Hostels</span>
                <FiCheck className="text-emerald-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-emerald-300 mt-2">{analytics.activeSubscribers || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">Paid subscribers</span>
            </div>

            {/* Card 3: Trial Hostels */}
            <div
              onClick={() => {
                setActiveTab("subscriptions");
                setStatusFilter("trial");
              }}
              className="bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-500/20 hover:border-sky-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Trial Hostels</span>
                <FiShield className="text-sky-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-sky-300 mt-2">{analytics.trialHostels || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">{analytics.expiringSoon7 || 0} expire in 7d</span>
            </div>

            {/* Card 4: Expiring Soon */}
            <div
              onClick={() => {
                setActiveTab("subscriptions");
                setStatusFilter("expiring");
              }}
              className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Expiring Soon</span>
                <FiCalendar className="text-orange-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-orange-300 mt-2">{analytics.expiringSoon30 || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">Expires within 30d</span>
            </div>

            {/* Card 5: Expired Hostels */}
            <div
              onClick={() => {
                setActiveTab("subscriptions");
                setStatusFilter("expired");
              }}
              className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Expired</span>
                <FiAlertCircle className="text-rose-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-rose-300 mt-2">{analytics.expiredHostels || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">Requires continuation</span>
            </div>

            {/* Card 6: Active Residents */}
            <div
              onClick={() => {
                setActiveTab("calculator");
              }}
              className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Active Residents</span>
                <FiUsers className="text-indigo-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-indigo-300 mt-2">{analytics.totalActiveResidents || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">₹10/resident/mo</span>
            </div>

            {/* Card 7: Monthly Revenue */}
            <div
              onClick={() => {
                setActiveTab("subscriptions");
              }}
              className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 hover:border-teal-500/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition shadow-lg group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Monthly Revenue</span>
                <FiTrendingUp className="text-teal-400 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <span className="text-2xl font-black text-teal-300 mt-2">₹{analytics.monthlyRevenue || 0}</span>
              <span className="text-[10px] text-slate-400 mt-1">Pending: ₹{analytics.pendingCollections || 0}</span>
            </div>
          </div>
        )}

        {/* Subscription Overview Status Bar */}
        {analytics && (
          <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <FiFilter className="text-emerald-400" /> Subscription Overview:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setActiveTab("subscriptions");
                  setStatusFilter("all");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  statusFilter === "all" ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                All ({analytics.totalHostels || hostels.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("subscriptions");
                  setStatusFilter("active");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  statusFilter === "active" ? "bg-emerald-500/30 border-emerald-400 text-emerald-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Active ({analytics.activeSubscribers || 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab("subscriptions");
                  setStatusFilter("trial");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  statusFilter === "trial" ? "bg-sky-500/30 border-sky-400 text-sky-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Trial ({analytics.trialHostels || 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab("subscriptions");
                  setStatusFilter("expiring");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  statusFilter === "expiring" ? "bg-orange-500/30 border-orange-400 text-orange-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Expiring Soon ({analytics.expiringSoon30 || 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab("subscriptions");
                  setStatusFilter("expired");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  statusFilter === "expired" ? "bg-rose-500/30 border-rose-400 text-rose-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Expired ({analytics.expiredHostels || 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab("requests");
                  setRequestStatusFilter("pending");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  activeTab === "requests" ? "bg-amber-500/30 border-amber-400 text-amber-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Pending Continuations ({analytics.pendingRequests || 0})
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-6 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === "subscriptions" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Hostel Subscriptions Directory ({filteredHostels.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === "requests" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Continuation Requests Queue ({requests.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("calculator");
              if (calcHostelId) handleRunCalculator(calcHostelId);
            }}
            className={`pb-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === "calculator" ? "border-blue-400 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Resident Billing Calculator
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === "logs" ? "border-purple-400 text-purple-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Reminder Logs ({reminderLogs.length})
          </button>
        </div>

        {/* TAB 1: Subscriptions Directory */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Status:</span>
                {["all", "trial", "active", "expiring", "expired"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      statusFilter === st
                        ? "bg-emerald-500 text-slate-950 shadow-md"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-1.5 bg-[#0B1120] border border-white/10 rounded-xl px-3 py-1.5">
                  <span className="text-[11px] text-slate-400 font-bold">Payment:</span>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Payments</option>
                    <option value="Paid" className="bg-slate-900 text-white">Paid</option>
                    <option value="Pending" className="bg-slate-900 text-white">Pending</option>
                  </select>
                </div>

                <div className="relative flex-1 sm:w-64">
                  <FiSearch className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hostel, owner, phone, email..."
                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {filteredHostels.length === 0 ? (
              <EmptyState title="No Subscriptions Found" subtitle="No hostels match your active filters or search query." />
            ) : (
              <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Hostel & Owner</th>
                        <th className="p-3.5">Plan</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Active Residents</th>
                        <th className="p-3.5">Days Left</th>
                        <th className="p-3.5">Expiry Date</th>
                        <th className="p-3.5">Monthly Amount</th>
                        <th className="p-3.5">Payment</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {filteredHostels.map((h) => (
                        <tr key={h.subscriptionId || h.hostelId} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm">{h.hostelName}</div>
                            <div className="text-[11px] text-slate-400">
                              {h.ownerName} • {h.phone}
                            </div>
                            <div className="text-[10px] text-slate-500">{h.city}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-300">{h.plan}</td>
                          <td className="p-3.5">
                            <StatusBadge status={h.status} />
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400">{h.activeResidents} residents</td>
                          <td className="p-3.5 font-bold text-white">
                            {h.daysRemaining !== null ? (
                              <span className={h.daysRemaining <= 7 ? "text-rose-400" : h.daysRemaining <= 30 ? "text-amber-400" : "text-emerald-400"}>
                                {h.daysRemaining}d
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {h.expiryDate ? new Date(h.expiryDate).toLocaleDateString("en-GB") : "N/A"}
                          </td>
                          <td className="p-3.5 font-black text-amber-400">₹{h.estimatedAmount || h.amount}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                String(h.paymentStatus || "").toLowerCase() === "paid"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {h.paymentStatus || "Pending"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => openDetailsModal(h)}
                                title="View Details"
                                className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1"
                              >
                                <FiEye /> Details
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedHostel(h);
                                  setExtendForm({
                                    extensionDays: 30,
                                    amount: h.estimatedAmount || h.activeResidents * 10,
                                    paymentStatus: "Paid",
                                    reason: "Manual Admin Extension",
                                  });
                                  setShowExtendModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold"
                              >
                                Extend
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedHostel(h);
                                  setAdjustForm({ daysAdjustment: 0, reason: "" });
                                  setShowAdjustModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[11px] font-bold"
                              >
                                +/- Days
                              </button>
                              <button
                                onClick={() => openHistoryModal(h)}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-blue-300 rounded-lg text-[11px] font-bold"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Continuation Requests Queue */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2">
                {["pending", "approved", "rejected", "all"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setRequestStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      requestStatusFilter === st
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} /> Refresh Requests
              </button>
            </div>

            {requests.length === 0 ? (
              <EmptyState title="No Continuation Requests" subtitle="There are currently no requests matching your filter." />
            ) : (
              <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Hostel & Owner</th>
                        <th className="p-3.5">Active Residents</th>
                        <th className="p-3.5">Requested Duration</th>
                        <th className="p-3.5">Calculated Bill</th>
                        <th className="p-3.5">Request Date</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {requests.map((r) => (
                        <tr key={r._id} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{r.hostelId?.hostelName || r.hostelId?.name || "Hostel"}</div>
                            <div className="text-[11px] text-slate-400">
                              {r.ownerId?.ownerName} • {r.ownerId?.phone}
                            </div>
                            {r.ownerNote && (
                              <div className="text-[10px] text-amber-300 italic mt-1 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 max-w-xs">
                                "{r.ownerNote}"
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400">{r.residentCount} residents</td>
                          <td className="p-3.5 font-bold text-white">{r.requestedDays} Days</td>
                          <td className="p-3.5 font-black text-amber-400">₹{r.calculatedAmount}</td>
                          <td className="p-3.5 text-slate-400">{new Date(r.requestedAt || r.createdAt).toLocaleDateString("en-GB")}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                r.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : r.status === "rejected"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {r.status === "pending" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedRequest(r);
                                    setApproveForm({
                                      extensionDays: r.requestedDays || 30,
                                      approvedAmount: r.calculatedAmount || r.residentCount * 10,
                                      paymentStatus: "Paid",
                                      paidAmount: r.calculatedAmount || r.residentCount * 10,
                                      adminNote: "",
                                    });
                                    setShowApproveModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                                >
                                  <FiCheck /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(r);
                                    setShowRejectModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs border border-rose-500/30 flex items-center gap-1"
                                >
                                  <FiX /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Resident Billing Calculator */}
        {activeTab === "calculator" && (
          <div className="space-y-6">
            <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-2">Live Resident-Based Billing Engine</h3>
              <p className="text-xs text-slate-400 mb-4">
                Calculate real-time monthly billing with prorated active days (₹10 / active resident / 30-day period).
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <select
                  value={calcHostelId}
                  onChange={(e) => {
                    setCalcHostelId(e.target.value);
                    handleRunCalculator(e.target.value);
                  }}
                  className="flex-1 bg-[#0B1120] border border-white/10 rounded-xl p-3 text-xs text-white"
                >
                  {hostels.map((h) => (
                    <option key={h.hostelId} value={h.hostelId}>
                      {h.hostelName} ({h.ownerName})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleRunCalculator(calcHostelId)}
                  disabled={calcLoading}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className={calcLoading ? "animate-spin" : ""} />
                  {calcLoading ? "Calculating..." : "Compute Billing"}
                </button>
              </div>
            </div>

            {calcData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Total Active Residents</span>
                    <div className="text-xl font-bold text-white mt-1">{calcData.activeResidentsCount || 0}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Base Monthly Rate</span>
                    <div className="text-xl font-bold text-emerald-400 mt-1">₹{calcData.monthlyRatePerResident || 10}/head</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Full Period Charge</span>
                    <div className="text-xl font-bold text-amber-400 mt-1">₹{calcData.fullPeriodCharge || 0}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Total Calculated Bill</span>
                    <div className="text-xl font-bold text-teal-300 mt-1">₹{calcData.totalAmount || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Reminder Logs */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Automated Subscription Reminder Audit Trail</h3>
              <button
                onClick={() => fetchDashboardData(true)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} /> Refresh Logs
              </button>
            </div>

            {reminderLogs.length === 0 ? (
              <EmptyState title="No Reminder Logs" subtitle="No automated subscription reminders sent yet." />
            ) : (
              <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Hostel</th>
                        <th className="p-3.5">Reminder Type</th>
                        <th className="p-3.5">Channel</th>
                        <th className="p-3.5">Sent Timestamp</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {reminderLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-white/[0.02]">
                          <td className="p-3.5 font-bold text-white">{log.hostelId?.hostelName || log.hostelId?.name || "Hostel"}</td>
                          <td className="p-3.5 text-slate-300">{log.reminderType || "Subscription Due"}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-bold">
                              {log.channel || "In-App / WhatsApp"}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">{new Date(log.sentAt || log.createdAt).toLocaleString()}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">
                              {log.status || "Sent"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </ContentContainer>

      {/* RICH SUBSCRIPTION DETAILS MODAL */}
      {showDetailsModal && selectedHostel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0b1739] border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5"
            >
              <FiX size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
                {selectedHostel.hostelName?.slice(0, 2).toUpperCase() || "HM"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedHostel.hostelName}</h3>
                <p className="text-xs text-slate-400">
                  {selectedHostel.ownerName} • {selectedHostel.phone} • {selectedHostel.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Current Plan</span>
                <div className="text-xs font-bold text-white mt-1">{selectedHostel.plan}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Subscription Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedHostel.status} />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Days Remaining</span>
                <div className="text-xs font-bold text-white mt-1">{selectedHostel.daysRemaining} days</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Residents</span>
                <div className="text-xs font-bold text-emerald-400 mt-1">{selectedHostel.activeResidents} residents</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly Bill</span>
                <div className="text-xs font-bold text-amber-400 mt-1">₹{selectedHostel.estimatedAmount || selectedHostel.amount}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Status</span>
                <div className="text-xs font-bold text-teal-300 mt-1">{selectedHostel.paymentStatus || "Pending"}</div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Subscription Dates & Period</h4>
              <div className="grid grid-cols-2 text-xs text-slate-300 gap-2">
                <div>
                  <span className="text-slate-500">Start Date:</span>{" "}
                  {selectedHostel.startDate ? new Date(selectedHostel.startDate).toLocaleDateString("en-GB") : "N/A"}
                </div>
                <div>
                  <span className="text-slate-500">Expiry Date:</span>{" "}
                  {selectedHostel.expiryDate ? new Date(selectedHostel.expiryDate).toLocaleDateString("en-GB") : "N/A"}
                </div>
                <div>
                  <span className="text-slate-500">Hostel Location:</span> {selectedHostel.city || "-"}
                </div>
                <div>
                  <span className="text-slate-500">Hostel ID:</span> <code className="text-[10px] text-slate-400">{selectedHostel.hostelId}</code>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openHistoryModal(selectedHostel);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
              >
                View Audit History
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setExtendForm({
                    extensionDays: 30,
                    amount: selectedHostel.estimatedAmount || selectedHostel.activeResidents * 10,
                    paymentStatus: "Paid",
                    reason: "Admin Extension",
                  });
                  setShowExtendModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                Extend Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONTINUATION MODAL */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleApproveSubmit} className="bg-[#0b1739] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Approve Continuation Request</h3>
            <p className="text-xs text-slate-400">
              Hostel: <strong className="text-white">{selectedRequest.hostelId?.hostelName}</strong> ({selectedRequest.residentCount} active residents)
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Extension Duration (Days)</label>
                <input
                  type="number"
                  value={approveForm.extensionDays}
                  onChange={(e) => setApproveForm({ ...approveForm, extensionDays: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Approved Bill Amount (₹)</label>
                <input
                  type="number"
                  value={approveForm.approvedAmount}
                  onChange={(e) => setApproveForm({ ...approveForm, approvedAmount: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Payment Status</label>
                <select
                  value={approveForm.paymentStatus}
                  onChange={(e) => setApproveForm({ ...approveForm, paymentStatus: e.target.value })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Admin Internal Note</label>
                <textarea
                  value={approveForm.adminNote}
                  onChange={(e) => setApproveForm({ ...approveForm, adminNote: e.target.value })}
                  placeholder="Optional approval note..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl">
                Confirm Approval
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRejectSubmit} className="bg-[#0b1739] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reject Continuation Request</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to reject the request for <strong className="text-white">{selectedRequest.hostelId?.hostelName}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl">
                Reject Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL EXTEND MODAL */}
      {showExtendModal && selectedHostel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleExtendSubmit} className="bg-[#0b1739] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Extend Hostel Subscription</h3>
            <p className="text-xs text-slate-400">
              Hostel: <strong className="text-white">{selectedHostel.hostelName}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Extension Duration (Days)</label>
                <input
                  type="number"
                  value={extendForm.extensionDays}
                  onChange={(e) => setExtendForm({ ...extendForm, extensionDays: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Amount (₹)</label>
                <input
                  type="number"
                  value={extendForm.amount}
                  onChange={(e) => setExtendForm({ ...extendForm, amount: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Reason / Note</label>
                <input
                  type="text"
                  value={extendForm.reason}
                  onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                  placeholder="Reason for manual extension..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl">
                Apply Extension
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADJUST DAYS (+/-) MODAL */}
      {showAdjustModal && selectedHostel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdjustSubmit} className="bg-[#0b1739] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Adjust Subscription Days (+/-)</h3>
            <p className="text-xs text-slate-400">
              Hostel: <strong className="text-white">{selectedHostel.hostelName}</strong> (Current days left: {selectedHostel.daysRemaining}d)
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Days Adjustment (+ positive / - negative)</label>
                <input
                  type="number"
                  value={adjustForm.daysAdjustment}
                  onChange={(e) => setAdjustForm({ ...adjustForm, daysAdjustment: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                  placeholder="e.g. +15 or -5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Reason</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="Reason for adjustment..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl">
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORY AUDIT MODAL */}
      {showHistoryModal && selectedHostel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1739] border border-white/15 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Subscription Audit History</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white p-1">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Hostel: <strong className="text-white">{selectedHostel.hostelName}</strong>
            </p>

            {historyLoading ? (
              <LoadingState message="Fetching history audit trail..." />
            ) : historyRecords.length === 0 ? (
              <EmptyState title="No History Records" subtitle="No previous subscription events found for this hostel." />
            ) : (
              <div className="space-y-2">
                {historyRecords.map((rec) => (
                  <div key={rec._id} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{rec.action || "Subscription Update"}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(rec.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{rec.reason || "No reason specified"}</p>
                    <div className="text-[10px] text-slate-500">
                      By: {rec.changedBy || "System"} • Amount: ₹{rec.newAmount || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
});

export default SubscriptionCenter;
