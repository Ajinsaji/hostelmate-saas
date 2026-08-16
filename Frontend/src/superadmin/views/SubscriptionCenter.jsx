import React, { useState, useEffect, useCallback } from "react";
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
} from "react-icons/fi";

export const SubscriptionCenter = React.memo(() => {
  const [activeTab, setActiveTab] = useState("requests"); // requests | subscriptions | calculator | logs
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Search and filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestStatusFilter, setRequestStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const [dashRes, requestsRes, hostelsRes, logsRes] = await Promise.all([
        api.get("/api/admin/subscriptions/dashboard"),
        api.get("/api/admin/subscriptions/requests", {
          params: { status: requestStatusFilter },
        }),
        api.get("/api/admin/subscriptions/hostels", {
          params: { status: statusFilter, search: searchQuery },
        }),
        api.get("/api/admin/subscriptions/reminder-logs"),
      ]);

      const dashData = dashRes?.data || {};
      const requestsData = requestsRes?.data || {};
      const hostelsData = hostelsRes?.data || {};
      const logsData = logsRes?.data || {};

      if (dashData.success) setAnalytics(dashData.analytics);
      if (requestsData.success) setRequests(requestsData.requests || []);
      if (hostelsData.success) {
        const subs = hostelsData.subscriptions || [];
        setHostels(subs);
        if (!calcHostelId && subs.length > 0) {
          setCalcHostelId(subs[0].hostelId);
        }
      }
      if (logsData.success) setReminderLogs(logsData.logs || []);
    } catch (err) {
      console.error("[SubscriptionCenter] Error loading data:", err);
      const friendlyMsg =
        err?.response?.data?.message || err?.message || "Unable to load subscription requests.";
      setFetchError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  }, [requestStatusFilter, statusFilter, searchQuery, calcHostelId]);

  useEffect(() => {
    fetchDashboardData();
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
        fetchDashboardData();
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
        fetchDashboardData();
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
        fetchDashboardData();
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
        fetchDashboardData();
      } else {
        toast.error(data.message || "Adjustment failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adjusting subscription days");
    }
  };

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
              <h3 className="text-base font-bold text-white mb-1">Unable to load subscription requests.</h3>
              <p className="text-xs text-slate-400">{fetchError}</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <FiRefreshCw /> Retry
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
      <SectionHeader
        title="SaaS Subscription & Continuation Hub"
        subtitle="Unified Owner Plan, 30-Day Trials, Prorated Resident Billing (₹10/head), & Continuation Workflow"
      />

      <ContentContainer>
        {/* Dynamic Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</span>
              <span className="text-2xl font-black text-amber-400 mt-2">{analytics.pendingRequests || 0}</span>
              <span className="text-[10px] text-slate-500 mt-1">Awaiting approval</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Hostels</span>
              <span className="text-2xl font-black text-emerald-400 mt-2">{analytics.activeSubscribers || 0}</span>
              <span className="text-[10px] text-slate-500 mt-1">Paid subscribers</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trial Hostels</span>
              <span className="text-2xl font-black text-sky-400 mt-2">{analytics.trialHostels || 0}</span>
              <span className="text-[10px] text-slate-500 mt-1">30-day free trials</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expired Hostels</span>
              <span className="text-2xl font-black text-rose-400 mt-2">{analytics.expiredHostels || 0}</span>
              <span className="text-[10px] text-slate-500 mt-1">Requires continuation</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Residents</span>
              <span className="text-2xl font-black text-indigo-400 mt-2">{analytics.totalActiveResidents || 0}</span>
              <span className="text-[10px] text-slate-500 mt-1">₹10/resident/mo base</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
              <span className="text-2xl font-black text-teal-400 mt-2">₹{analytics.monthlyRevenue || 0}</span>
              <span className="text-[10px] text-slate-500 mt-1">Collected this month</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-6 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === "requests" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Continuation Requests Queue ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === "subscriptions" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Hostel Subscriptions Directory ({hostels.length})
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

        {/* TAB 1: Continuation Requests Queue */}
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
                onClick={fetchDashboardData}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <FiRefreshCw /> Refresh Requests
              </button>
            </div>

            {requests.length === 0 ? (
              <EmptyState title="No Continuation Requests" subtitle="There are currently no requests matching your filter." />
            ) : (
              <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl overflow-hidden">
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

        {/* TAB 2: Subscriptions Directory */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {["all", "trial", "active", "expired", "continuation_requested"].map((st) => (
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

              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hostel, owner, phone..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {hostels.length === 0 ? (
              <EmptyState title="No Subscriptions Found" subtitle="No hostels match your active filter." />
            ) : (
              <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Hostel & Owner</th>
                        <th className="p-3.5">Plan Status</th>
                        <th className="p-3.5">Active Residents</th>
                        <th className="p-3.5">Days Left</th>
                        <th className="p-3.5">Expiry Date</th>
                        <th className="p-3.5">Bill / Month</th>
                        <th className="p-3.5 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {hostels.map((h) => (
                        <tr key={h.subscriptionId || h.hostelId} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{h.hostelName}</div>
                            <div className="text-[11px] text-slate-400">
                              {h.ownerName} • {h.phone}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={h.status} />
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400">{h.activeResidents} residents</td>
                          <td className="p-3.5 font-bold text-white">
                            {h.daysRemaining !== null ? `${h.daysRemaining}d` : "—"}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {h.expiryDate ? new Date(h.expiryDate).toLocaleDateString("en-GB") : "N/A"}
                          </td>
                          <td className="p-3.5 font-black text-amber-400">₹{h.estimatedAmount || h.amount}</td>
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
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
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Resident Count</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">{calcData.residentCount}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Base Rate</span>
                    <span className="text-2xl font-black text-white mt-1 block">₹{calcData.monthlyRate} / head</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Period Charge</span>
                    <span className="text-2xl font-black text-blue-400 mt-1 block">₹{calcData.fullPeriodCharge}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Prorated Bill</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block">₹{calcData.totalAmount}</span>
                  </div>
                </div>

                <div className="bg-[#0b1739]/60 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3">Resident</th>
                        <th className="p-3">Room</th>
                        <th className="p-3">Admission</th>
                        <th className="p-3">Checkout</th>
                        <th className="p-3">Active Days</th>
                        <th className="p-3 text-right">Prorated Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {calcData.lineItems?.map((item) => (
                        <tr key={item.residentId}>
                          <td className="p-3 font-bold text-white">{item.name}</td>
                          <td className="p-3 text-slate-400">{item.roomNo}</td>
                          <td className="p-3 text-slate-400">
                            {item.admissionDate ? new Date(item.admissionDate).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="p-3 text-slate-400">
                            {item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString("en-GB") : "Active"}
                          </td>
                          <td className="p-3 text-slate-300">{item.activeDays} / {item.billingDays} days</td>
                          <td className="p-3 text-right font-black text-emerald-400">₹{item.charge.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Reminder Logs */}
        {activeTab === "logs" && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Automated Reminder Dispatch Logs</h3>
            <div className="overflow-x-auto bg-[#0b1739]/60 border border-white/10 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3">Hostel</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Sent Time</th>
                    <th className="p-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {reminderLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="p-3 font-bold text-white">{log.hostelId?.hostelName || "Hostel"}</td>
                      <td className="p-3 font-bold text-emerald-400">{log.stage}</td>
                      <td className="p-3">{log.channel}</td>
                      <td className="p-3">{new Date(log.sentTime).toLocaleString()}</td>
                      <td className="p-3 text-slate-400">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Approve Request Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-lg font-black text-white">Approve Subscription Extension</h3>
            <div className="text-slate-400">
              Hostel: <span className="text-white font-bold">{selectedRequest.hostelId?.hostelName || "Hostel"}</span>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Extension Days</label>
                <select
                  value={approveForm.extensionDays}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setApproveForm({
                      ...approveForm,
                      extensionDays: days,
                      approvedAmount: selectedRequest.residentCount * 10 * (days / 30),
                      paidAmount: selectedRequest.residentCount * 10 * (days / 30),
                    });
                  }}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={180}>180 Days (6 Months)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Approved Amount (₹)</label>
                <input
                  type="number"
                  value={approveForm.approvedAmount}
                  onChange={(e) => setApproveForm({ ...approveForm, approvedAmount: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Payment Status</label>
                <select
                  value={approveForm.paymentStatus}
                  onChange={(e) => setApproveForm({ ...approveForm, paymentStatus: e.target.value })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Paid">Paid (Payment Received)</option>
                  <option value="Pending">Pending (Invoice Generated)</option>
                  <option value="Partial">Partial Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Admin Approval Note</label>
                <input
                  type="text"
                  value={approveForm.adminNote}
                  onChange={(e) => setApproveForm({ ...approveForm, adminNote: e.target.value })}
                  placeholder="e.g. Paid ₹300 via bank transfer"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  Confirm & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-lg font-black text-rose-400">Reject Continuation Request</h3>
            <p className="text-slate-400">
              Please enter the reason for rejecting this continuation request. The reason will be visible to the hostel owner.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Payment not verified, please contact support..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-400 text-white"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Extend Modal */}
      {showExtendModal && selectedHostel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-lg font-black text-white">Manual Subscription Extension</h3>
            <div className="text-slate-400">
              Hostel: <span className="text-white font-bold">{selectedHostel.hostelName}</span>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Extension Days</label>
                <select
                  value={extendForm.extensionDays}
                  onChange={(e) => setExtendForm({ ...extendForm, extensionDays: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value={30}>+30 Days</option>
                  <option value={60}>+60 Days</option>
                  <option value={90}>+90 Days</option>
                  <option value={180}>+180 Days</option>
                  <option value={365}>+365 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Reason for Extension</label>
                <input
                  type="text"
                  required
                  value={extendForm.reason}
                  onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                  placeholder="e.g. Promotional extension or direct bank transfer"
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Days (+/-) Modal */}
      {showAdjustModal && selectedHostel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-lg font-black text-white">Adjust Subscription Expiry Days</h3>
            <p className="text-slate-400">
              Increase (e.g. +10) or decrease (e.g. -5) remaining subscription days. All adjustments are permanently audited.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Days Adjustment (+ / -)</label>
                <input
                  type="number"
                  required
                  value={adjustForm.daysAdjustment}
                  onChange={(e) => setAdjustForm({ ...adjustForm, daysAdjustment: Number(e.target.value) })}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Adjustment Reason (Required)</label>
                <textarea
                  required
                  rows={2}
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="Reason for changing subscription expiry date..."
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  Apply Days Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription History Modal */}
      {showHistoryModal && selectedHostel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-3xl max-w-2xl w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Subscription Audit History</h3>
                <p className="text-slate-400 text-xs">{selectedHostel.hostelName}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1 bg-white/10 text-white rounded-lg"
              >
                Close
              </button>
            </div>

            {historyLoading ? (
              <div className="p-8 text-center text-slate-400">Loading audit history...</div>
            ) : historyRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No history records found for this hostel.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {historyRecords.map((hist) => (
                  <div key={hist._id} className="p-3 bg-[#0B1120] border border-white/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-400">{hist.action.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-slate-500">{new Date(hist.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{hist.reason || "No reason provided"}</div>
                    <div className="text-[10px] text-slate-500">
                      Changed by: <b className="text-slate-400">{hist.changedBy || "System"}</b>
                      {hist.newEndDate && ` • New Expiry: ${new Date(hist.newEndDate).toLocaleDateString()}`}
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
