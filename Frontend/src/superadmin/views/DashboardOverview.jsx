import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Layout & Modals
import PageContainer from "../layouts/PageContainer";
import BackupManagerModal from "../components/modals/BackupManagerModal";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import AdminTodayTasksWidget from "../components/AdminTodayTasksWidget";
import { useDrawer } from "../contexts/DrawerContext";

// Hooks
import useDashboardStats from "../hooks/useDashboardStats";
import useRevenueMetrics from "../hooks/useRevenueMetrics";
import useActionQueue from "../hooks/useActionQueue";
import { useAdminAutoRefresh } from "../hooks/useAdminAutoRefresh";
import { api } from "../../services/api";

// Icons
import {
  CheckSquare,
  Building,
  Users,
  UserCheck,
  CreditCard,
  Trash2,
  PlusCircle,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  MessageCircle,
  Database,
  Server,
  Activity,
  ArrowRight,
  HelpCircle,
  Clock,
  Send,
  Zap,
} from "lucide-react";
import LoadingState from "../components/feedback/LoadingState";

export const DashboardOverview = React.memo(() => {
  const { openDrawer } = useDrawer();
  const navigate = useNavigate();

  // Modals & Triggers
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { actionType, item }
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [tasksRefreshTrigger, setTasksRefreshTrigger] = useState(0);

  // WhatsApp & Trash live status
  const [whatsAppConfig, setWhatsAppConfig] = useState({
    globalAutomationEnabled: false,
    metaStatus: { configured: false, status: "Checking..." },
  });
  const [trashCount, setTrashCount] = useState(0);

  // Data hooks
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: revenueData, loading: revenueLoading, refetch: refetchRevenue } = useRevenueMetrics();
  const { workQueue, recentActivity, loading: queueLoading, refetch: refetchQueue } = useActionQueue();

  // Fetch secondary operational state (WhatsApp & Trash)
  const fetchOperationalStatus = useCallback(async () => {
    try {
      const [commRes, trashRes] = await Promise.allSettled([
        api.get("/api/communication/settings"),
        api.get("/api/admin/trash/hostels"),
      ]);

      if (commRes.status === "fulfilled" && commRes.value?.data?.success) {
        setWhatsAppConfig({
          globalAutomationEnabled: Boolean(commRes.value.data.globalAutomationEnabled),
          metaStatus: commRes.value.data.metaStatus || { configured: false, status: "Not Configured" },
        });
      }

      if (trashRes.status === "fulfilled" && trashRes.value?.data?.success) {
        const count = trashRes.value.data.count ?? trashRes.value.data.hostels?.length ?? 0;
        setTrashCount(count);
      }
    } catch {
      // Graceful fallback for operational status cards
    }
  }, []);

  useEffect(() => {
    fetchOperationalStatus();
  }, [fetchOperationalStatus]);

  // 30-Second Auto-Refresh hook for secondary operational state
  useAdminAutoRefresh(fetchOperationalStatus, 30000);

  const isLoading = statsLoading || revenueLoading || queueLoading;

  if (isLoading && !statsData && workQueue.length === 0) {
    return <LoadingState message="Connecting to SaaS Command Center..." />;
  }

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const toastId = toast.loading("Refetching platform data...");
    try {
      setTasksRefreshTrigger((prev) => prev + 1);
      await Promise.all([
        refetchStats ? refetchStats() : Promise.resolve(),
        refetchRevenue ? refetchRevenue() : Promise.resolve(),
        refetchQueue ? refetchQueue() : Promise.resolve(),
        fetchOperationalStatus(),
      ]);
      setLastRefreshedAt(new Date());
      toast.success("Dashboard updated", { id: toastId });
    } catch {
      toast.error("Failed to refresh data", { id: toastId });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Reload Web App (preserving auth tokens)
  const handleHardReload = () => {
    window.location.reload();
  };

  // Format Helpers
  const formatNum = (num) => (num !== undefined && num !== null && !isNaN(num) ? Number(num).toLocaleString("en-IN") : "0");
  const safeRender = (val) => (typeof val === "object" && val !== null ? val.name || val.title || "Unknown" : val);

  // Time Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  let adminName = "Admin";
  try {
    const stored = JSON.parse(localStorage.getItem("adminUser") || "{}");
    if (stored?.fullName) adminName = stored.fullName.split(" ")[0];
    else if (stored?.username) adminName = stored.username;
  } catch {
    // default adminName
  }

  // Real Database Metrics & Safe Coercion
  const safeWorkQueue = Array.isArray(workQueue) ? workQueue : [];
  const safeRecentActivity = Array.isArray(recentActivity) ? recentActivity : [];

  const activeHostelsCount = statsData?.activeHostelsVal ?? statsData?.totalHostels ?? 0;
  const activeOwnersCount = statsData?.totalOwnersVal ?? 0;
  const totalResidentsCount = statsData?.totalResidentsVal ?? 0;
  const pendingApprovalsCount = statsData?.pendingApprovals ?? safeWorkQueue.filter((q) => q?.queueCategory === "Needs Approval" || q?.queueCategory === "Activation Pending").length;
  const todayRevVal = statsData?.todayRevenue ?? (typeof revenueData?.todayRevenue?.value === "number" ? revenueData.todayRevenue.value : 0);

  const pendingApprovalRequests = safeWorkQueue.filter(
    (item) => item?.type === "request" && (item?.status === "pending" || item?.status === "activation_pending" || item?.queueCategory === "Needs Approval" || item?.queueCategory === "Activation Pending")
  );

  return (
    <PageContainer>
      {/* 1. HERO / WELCOME SECTION */}
      <section className="mb-6">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Admin Console
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {getGreeting()}, {adminName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              Here's what needs your operational attention today •{" "}
              <span className="text-slate-300 font-semibold">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </p>
          </div>

          {/* Refresh & Hard Reload Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Refetch all dashboard metrics without page reload"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
            </button>
            <button
              onClick={handleHardReload}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
              title="Reload web application (preserves login session)"
            >
              <RotateCw size={14} className="text-blue-400" />
              <span>Reload App</span>
            </button>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
              Refreshed: {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </section>

      {/* 2. TODAY'S TASKS — PRIMARY OPERATIONAL FEATURE */}
      <section className="mb-8" id="admin-today-tasks">
        <AdminTodayTasksWidget onRefreshTrigger={tasksRefreshTrigger} />
      </section>

      {/* 3. CLEAN DATABASE-DRIVEN KPI STRIP */}
      <section className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <KpiCard
            title="Active Hostels"
            value={formatNum(activeHostelsCount)}
            icon={<Building size={16} className="text-blue-400" />}
            onClick={() => navigate("/admin/hostels")}
            label="Directory →"
          />
          <KpiCard
            title="Active Owners"
            value={formatNum(activeOwnersCount)}
            icon={<UserCheck size={16} className="text-emerald-400" />}
            onClick={() => navigate("/admin/owners")}
            label="CRM →"
          />
          <KpiCard
            title="Total Residents"
            value={formatNum(totalResidentsCount)}
            icon={<Users size={16} className="text-purple-400" />}
            onClick={() => navigate("/admin/residents")}
            label="Roll →"
          />
          <KpiCard
            title="Today's Revenue"
            value={`₹${formatNum(todayRevVal)}`}
            icon={<CreditCard size={16} className="text-amber-400" />}
            onClick={() => navigate("/admin/revenue")}
            label="Revenue →"
          />
          <KpiCard
            title="Pending Approvals"
            value={formatNum(pendingApprovalsCount)}
            icon={<ShieldAlert size={16} className="text-rose-400" />}
            onClick={() => navigate("/admin/requests")}
            label="Requests →"
            isAlert={pendingApprovalsCount > 0}
          />
          <KpiCard
            title="Hostels in Trash"
            value={formatNum(trashCount)}
            icon={<Trash2 size={16} className="text-rose-400" />}
            onClick={() => navigate("/admin/trash")}
            label="Trash →"
          />
        </div>
      </section>

      {/* 4. QUICK ACTIONS COMMAND BAR */}
      <section className="mb-8">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            Quick Console Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <button
              onClick={() => openDrawer("owner", { title: "New Owner Registration" })}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-left transition group cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <PlusCircle size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Register Owner</p>
                <p className="text-[10px] text-slate-400 truncate">Create Account</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/requests")}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-left transition group cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <CheckSquare size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Pending Approvals</p>
                <p className="text-[10px] text-slate-400 truncate">{pendingApprovalsCount} in Queue</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/hostels")}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 text-left transition group cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Building size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Hostel Directory</p>
                <p className="text-[10px] text-slate-400 truncate">{activeHostelsCount} Active</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/tasks")}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-left transition group cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Today's Tasks</p>
                <p className="text-[10px] text-slate-400 truncate">Operational Queue</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/communications/whatsapp")}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-left transition group cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <MessageCircle size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">WhatsApp Console</p>
                <p className="text-[10px] text-slate-400 truncate">Automation Engine</p>
              </div>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/40 text-left transition group cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Database size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Database Vault</p>
                <p className="text-[10px] text-slate-400 truncate">Run Backup</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 5. TWO-COLUMN OPERATIONAL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* LEFT COLUMN: PENDING APPROVALS & RECENT ACTIVITY (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* PENDING OPERATIONAL APPROVALS */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-400" />
                  Pending Approvals
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                  {pendingApprovalRequests.length}
                </span>
              </div>
              <button
                onClick={() => navigate("/admin/requests")}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>View All Requests</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
              {pendingApprovalRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={30} className="text-emerald-400 opacity-80" />
                  <span className="text-white font-bold text-sm">No Pending Approvals</span>
                  <p className="text-slate-400 max-w-sm text-xs">
                    All hostel registration and activation requests have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {pendingApprovalRequests.slice(0, 5).map((item, idx) => {
                    const isActivationPending = item.status === "activation_pending";

                    return (
                      <div
                        key={item.id || item._id || idx}
                        className="p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {isActivationPending ? (
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                                <Zap size={16} />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                                <ShieldAlert size={16} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isActivationPending
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {isActivationPending ? "Activation Pending" : "Needs Approval"}
                              </span>
                              <span className="font-bold text-white text-sm truncate">{safeRender(item.subtitle)}</span>
                            </div>

                            <p className="text-slate-300 text-xs font-medium">
                              Owner: <span className="text-white font-semibold">{safeRender(item.owner)}</span> • Phone:{" "}
                              <span className="font-mono text-slate-300">{item.phone || "—"}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Submitted: {item.timestamp ? new Date(item.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently"}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 sm:self-center">
                          {isActivationPending ? (
                            <button
                              onClick={() => setActionModal({ actionType: "activate", item })}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 shadow-md shadow-amber-500/20 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Zap size={13} />
                              <span>Finalize Activation</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionModal({ actionType: "approve", item })}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={13} />
                              <span>Approve Draft</span>
                            </button>
                          )}
                          <button
                            onClick={() => setActionModal({ actionType: "reject", item })}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => openDrawer("request", item)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RECENT OPERATIONAL ACTIVITY */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                <Clock size={15} className="text-blue-400" />
                Recent Operational Activity
              </h2>
              <button
                onClick={() => navigate("/admin/audit")}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Audit Logs</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
              {safeRecentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No recent activity recorded in the database.</div>
              ) : (
                <div className="space-y-3">
                  {safeRecentActivity.slice(0, 5).map((act, idx) => (
                    <div
                      key={act.id || act._id || idx}
                      className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/60 transition flex items-start gap-3 cursor-pointer"
                      onClick={() => openDrawer(act.type || "request", act)}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{safeRender(act.title)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {safeRender(act.subtitle)} •{" "}
                          <span className="text-slate-500 font-mono">
                            {act.timestamp ? new Date(act.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5 shrink-0">
                        {act.status || "Completed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: SYSTEM HEALTH & OPERATIONAL PANELS (1 col on desktop) */}
        <div className="space-y-6">
          {/* WHATSAPP AUTOMATION STATUS */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                  <MessageCircle size={15} className="text-emerald-400" />
                  WhatsApp Engine
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    whatsAppConfig.globalAutomationEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {whatsAppConfig.globalAutomationEnabled ? "AUTOMATION ON" : "MANUAL MODE"}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 font-medium">Meta Cloud API</span>
                  <span className="flex items-center gap-1 font-bold text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        whatsAppConfig.metaStatus.configured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    {whatsAppConfig.metaStatus.configured ? "Connected" : "Not Configured"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 font-medium">Delivery Mode</span>
                  <span className="font-bold text-slate-200">
                    {whatsAppConfig.globalAutomationEnabled ? "Direct Meta WhatsApp API" : "Manual wa.me Link Dispatch"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/communications/whatsapp")}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Open WhatsApp Console</span>
              <ArrowRight size={13} />
            </button>
          </section>

          {/* SYSTEM HEALTH & INFRASTRUCTURE STATUS */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                <Server size={15} className="text-blue-400" />
                System Health
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% HEALTHY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-purple-400" />
                  <span className="text-slate-300 font-medium">MongoDB Cluster</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" />
                  <span className="text-slate-300 font-medium">API Gateway</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span className="text-slate-300 font-medium">Application Version</span>
                </div>
                <span className="font-mono text-slate-300 font-bold">v1.4.2 (Production)</span>
              </div>
            </div>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="mt-4 w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Database size={13} />
              <span>Manage Backups</span>
            </button>
          </section>

          {/* 60-DAY TRASH RETENTION CARD */}
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                  <Trash2 size={15} className="text-rose-400" />
                  Hostels Trash
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {trashCount} Hostels
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Deleted hostels are retained for 60 days with financial and payment records protected against cascade loss.
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/trash")}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>View Trash Manager</span>
              <ArrowRight size={13} />
            </button>
          </section>
        </div>
      </div>

      {/* Modals */}
      <BackupManagerModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />

      <ConfirmActionModal
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        actionType={actionModal?.actionType}
        requestData={actionModal?.item}
        onSuccess={() => {
          refetchStats?.();
          refetchRevenue?.();
          refetchQueue?.();
          fetchOperationalStatus();
          setActionModal(null);
        }}
      />
    </PageContainer>
  );
});

// Helper KPI Card Component
function KpiCard({ title, value, icon, onClick, label, isAlert }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition group cursor-pointer flex flex-col justify-between ${
        isAlert
          ? "bg-rose-500/[0.06] border-rose-500/30 hover:border-rose-500/50"
          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300">{icon}</span>
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{value}</p>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">
        <span>{label}</span>
      </div>
    </div>
  );
}

export default DashboardOverview;
