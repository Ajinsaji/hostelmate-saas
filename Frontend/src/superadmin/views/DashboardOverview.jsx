import React, { useState } from "react";
import PageContainer from "../layouts/PageContainer";
import BackupManagerModal from "../components/modals/BackupManagerModal";
import { useDrawer } from "../contexts/DrawerContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Hooks
import useExecutiveSummary from "../hooks/useExecutiveSummary";
import useDashboardStats from "../hooks/useDashboardStats";
import useRevenueMetrics from "../hooks/useRevenueMetrics";
import usePlatformMonitoring from "../hooks/usePlatformMonitoring";
import useActionQueue from "../hooks/useActionQueue";
import useHostels from "../hooks/useHostels";
import useOwners from "../hooks/useOwners";

// Icons
import { 
  CheckSquare, Zap, ArrowRight, ShieldCheck, Database, Server,
  AlertTriangle, CheckCircle, FileText, User, Building,
  PlusCircle, ShieldAlert, DollarSign, Users, RefreshCw, RotateCw
} from "lucide-react";
import LoadingState from "../components/feedback/LoadingState";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";

export const DashboardOverview = React.memo(() => {
  const { openDrawer } = useDrawer();
  const navigate = useNavigate();
  
  const { data: hostelsData } = useHostels({ page: 1, pageSize: 3 });
  const { data: ownersData } = useOwners();
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { actionType, item }
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hooks
  const { data: summaryData, loading: summaryLoading, refetch: refetchSummary } = useExecutiveSummary();
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: revenueData, loading: revenueLoading, refetch: refetchRevenue } = useRevenueMetrics();
  const { loading: telemetryLoading } = usePlatformMonitoring();
  const { workQueue, improvements, recentActivity, loading: queueLoading, refetch: refetchQueue } = useActionQueue();

  const isLoading = summaryLoading || statsLoading || revenueLoading || telemetryLoading || queueLoading;

  if (isLoading) {
    return <LoadingState message="Initializing Executive Command Center..." />;
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const toastId = toast.loading("Refetching dashboard metrics...");
    try {
      await Promise.all([
        refetchSummary ? refetchSummary() : Promise.resolve(),
        refetchStats ? refetchStats() : Promise.resolve(),
        refetchRevenue ? refetchRevenue() : Promise.resolve(),
        refetchQueue ? refetchQueue() : Promise.resolve(),
      ]);
      toast.success("Dashboard refreshed", { id: toastId });
    } catch {
      toast.error("Failed to refresh dashboard", { id: toastId });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleHardReload = () => {
    window.location.reload();
  };

  // Helper to safely format numbers
  const formatNum = (num) => (num !== undefined && num !== null && !isNaN(num) ? num.toLocaleString('en-IN') : '--');
  const safeRender = (val) => typeof val === 'object' && val !== null ? (val.name || val.title || 'Unknown') : val;

  const activeHostelsCount = statsData?.activeHostelsVal ?? statsData?.activeHostels?.value ?? 0;
  const activeOwnersCount = statsData?.totalOwnersVal ?? statsData?.activeOwners?.value ?? 0;
  const totalResidentsCount = statsData?.totalResidentsVal ?? statsData?.totalResidents?.value ?? 0;
  const pendingApprovalsCount = workQueue.filter(q => q.queueCategory === "Needs Approval").length;
  const todayRevVal = statsData?.todayRevenue ?? (typeof revenueData?.todayRevenue?.value === 'number' ? revenueData.todayRevenue.value : 0);

  return (
    <PageContainer>
      {/* Dashboard Top Header Bar with Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">SaaS Command Center</h1>
          <p className="text-xs text-slate-400 font-medium">Real-time platform operations & aggregated analytics</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-400" : "text-emerald-400"} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>
          <button 
            onClick={handleHardReload}
            className="px-3.5 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer shadow-sm"
            title="Reload web application (preserves login session)"
          >
            <RotateCw size={14} className="text-blue-400" />
            <span>Reload App</span>
          </button>
        </div>
      </div>

      {/* 1. EXECUTIVE AI SUMMARY HERO */}
      <section className="mb-8">
        <div 
          className="relative overflow-hidden rounded-[24px] border p-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center"
          style={{ 
            background: `linear-gradient(135deg, rgba(15, 93, 70, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)`,
            borderColor: "rgba(16, 185, 129, 0.2)"
          }}
        >
          {/* Background glow effect */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 blur-[100px] pointer-events-none" />

          {/* Left: Platform Status & AI */}
          <div className="flex-1 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Platform Operational Status</h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Core API Services Active
                </div>
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">AI Executive Summary</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                {summaryData?.summary || "Platform is operating normally. Core APIs, authentication, and database connections are healthy."}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-medium mb-4">
                <div className="flex items-center gap-2">• {activeHostelsCount} active hostels</div>
                <div className="flex items-center gap-2">• {pendingApprovalsCount} approvals pending</div>
                <div className="flex items-center gap-2">• Revenue today: ₹{formatNum(todayRevVal)}</div>
                <div className="flex items-center gap-2">• Database healthy</div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-emerald-100 flex-1">
                  Recommended Action: Review {pendingApprovalsCount} pending onboarding requests.
                </p>
                <button 
                  onClick={() => openDrawer("request", { title: "Review Queue" })}
                  className="px-3 py-1.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold tracking-wider hover:bg-emerald-600 transition cursor-pointer"
                >
                  START REVIEW
                </button>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3 z-10">
            <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">Quick Console</h3>
            <button 
              onClick={() => navigate("/admin/hostels")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <Building size={16} className="text-blue-400" /> Open Directory
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
            <button 
              onClick={() => openDrawer("owner", { title: "New Owner" })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <PlusCircle size={16} className="text-emerald-400" /> Create Owner
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
            <button 
              onClick={() => setIsBackupModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <Database size={16} className="text-purple-400" /> Run Backup
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
            <button 
              onClick={() => navigate("/admin/reports")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <FileText size={16} className="text-amber-400" /> View Reports
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE KPI CARDS */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Active Hostels" 
            value={formatNum(statsData?.totalHostels)} 
            trend={statsData?.newHostelsToday ? `+${statsData.newHostelsToday} today` : "—"} 
            icon={<Building size={18} className="text-blue-400" />}
            actions={[
              { label: "Directory", onClick: () => navigate("/admin/hostels") },
              { label: "Create", onClick: () => navigate("/admin/hostels") }
            ]}
          />
          <KpiCard 
            title="Active Owners" 
            value={formatNum(activeOwnersCount)} 
            trend={statsData?.newOwnersToday ? `+${statsData.newOwnersToday} today` : "—"} 
            icon={<User size={18} className="text-emerald-400" />}
            actions={[
              { label: "CRM", onClick: () => navigate("/admin/owners") },
              { label: "View All", onClick: () => navigate("/admin/owners") }
            ]}
          />
          <KpiCard 
            title="Total Residents" 
            value={formatNum(totalResidentsCount)} 
            trend={statsData?.newResidentsThisWeek ? `+${statsData.newResidentsThisWeek} this week` : "—"} 
            icon={<Users size={18} className="text-purple-400" />}
            actions={[
              { label: "View Roll", onClick: () => navigate("/admin/residents") }
            ]}
          />
          <KpiCard 
            title="Monthly Revenue" 
            value={`₹${formatNum(statsData?.monthlyRevenue)}`} 
            trend={revenueData?.mrr?.trend || "—"} 
            icon={<DollarSign size={18} className="text-amber-400" />}
            actions={[
              { label: "Analytics", onClick: () => navigate("/admin/revenue") }
            ]}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* 3. TODAY'S WORK QUEUE (Action Queue / Action Required) */}
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Today's Work Queue</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold">
                {workQueue.length} Action Required
              </span>
            </div>
            <button onClick={() => navigate("/admin/requests")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">View All Tasks</button>
          </div>
          
          <div className="bg-slate-900/60 border border-[#202B45] rounded-2xl overflow-hidden flex flex-col shadow-xl">
            {workQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <CheckCircle size={28} className="text-emerald-400 opacity-60" />
                <span>No pending tasks in queue! All actions completed. 🎉</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#202B45]">
                {workQueue.slice(0, 5).map((item, idx) => {
                  const isPendingRequest = item.type === "request" && item.queueCategory === "Needs Approval";
                  return (
                    <div 
                      key={item.id || item._id || idx} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 transition ${
                        isPendingRequest 
                          ? "bg-[#EF4444]/[0.03] border-l-4 border-l-[#EF4444] hover:bg-[#EF4444]/[0.06]" 
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 shrink-0">
                          {isPendingRequest ? (
                            <div className="w-9 h-9 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] flex items-center justify-center">
                              <ShieldAlert size={18} />
                            </div>
                          ) : item.type === "request" ? (
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                              <CheckSquare size={18} />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                              <AlertTriangle size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span 
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isPendingRequest 
                                  ? "bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444]" 
                                  : "bg-white/10 text-white"
                              }`}
                            >
                              🔴 {item.queueCategory || "ACTION REQUIRED"}
                            </span>
                            <span className="text-xs font-bold text-white">{item.title}</span>
                            <span className="text-[10px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.2 rounded">
                              Priority: HIGH
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">
                            {safeRender(item.subtitle)} • <span className="text-slate-300 font-medium">{safeRender(item.owner)}</span>
                          </h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Submitted: {new Date(item.timestamp || 0).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • Status: <span className="text-slate-300 capitalize">{item.status || "Pending"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        {item.type === "request" && (
                          <>
                            {item.status === "activation_pending" ? (
                              <button 
                                onClick={() => setActionModal({ actionType: "activate", item })}
                                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                              >
                                <CheckCircle size={14} /> Finalize Activation
                              </button>
                            ) : (
                              <button 
                                onClick={() => setActionModal({ actionType: "approve", item })}
                                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                              >
                                <CheckCircle size={14} /> Approve Draft
                              </button>
                            )}
                            <button 
                              onClick={() => setActionModal({ actionType: "reject", item })}
                              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                              <ShieldAlert size={14} /> Reject
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => openDrawer("request", item)}
                          className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center active:scale-[0.98]"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4. PLATFORM MONITORING MINI */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Infrastructure</h3>
            <button onClick={() => navigate("/admin/monitoring")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">View Dash</button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* CPU / Server Status */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => openDrawer("ticket", { title: "Server Status Details" })}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-slate-300">Server Nodes</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">▼ Healthy</div>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-lg font-bold text-white">All API Cluster Nodes Online</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition cursor-pointer">View Logs</button>
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition cursor-pointer">System Status</button>
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => openDrawer("ticket", { title: "Database Connection Details" })}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-purple-400" />
                  <span className="text-xs font-bold text-slate-300">MongoDB Connection</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">▲ Connected</div>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-lg font-bold text-white">Primary Replica Pool Active</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition cursor-pointer">Health Check</button>
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition cursor-pointer">Details</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 5. BUSINESS INTELLIGENCE (Verified Only) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Verified Business Metrics</h3>
            <button onClick={() => navigate("/admin/analytics")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer">Full BI</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 h-[240px] flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <BiMetric label="MRR" value={`₹${formatNum(statsData?.monthlyRevenue ?? revenueData?.mrr?.value)}`} trend={revenueData?.mrr?.trend} direction={revenueData?.mrr?.direction} />
              <BiMetric label="ARR" value={`₹${formatNum((statsData?.monthlyRevenue ?? 0) * 12)}`} trend={revenueData?.arr?.trend} direction={revenueData?.arr?.direction} />
              <BiMetric label="Active Subscriptions" value={formatNum(activeHostelsCount)} />
              <BiMetric label="Trial Hostels" value={formatNum(statsData?.trialHostelsVal ?? statsData?.trialHostels?.value)} />
            </div>
          </div>
        </section>

        {/* 6. IMPROVEMENT CENTER */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Improvement Center</h3>
            <button onClick={() => navigate("/admin/support")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">All Improvements</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden h-[240px] overflow-y-auto custom-scrollbar">
            {improvements.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                <CheckCircle size={24} className="mb-2 opacity-50" />
                No improvement suggestions logged.
              </div>
            ) : (
              <div className="flex flex-col">
                {improvements.map((imp, idx) => (
                  <div key={imp.id || idx} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => openDrawer("ticket", imp)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-white">{imp.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${imp.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-300'}`}>
                        {imp.priority}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                      <span>{safeRender(imp.owner)}</span>
                      <span className="text-emerald-400">View Progress →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 7. QUICK ENTITIES: HOSTELS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Active Hostels</h3>
            <button onClick={() => navigate("/admin/hostels")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Directory</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            {hostelsData?.slice(0, 3).map((hostel, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition group cursor-pointer" onClick={() => openDrawer("hostel", { name: hostel.name })}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center"><Building size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-white">{hostel.name}</p>
                    <p className="text-[10px] text-slate-400">{hostel.city} • {hostel.plan || 'Basic'}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold hover:bg-white/20 text-white" onClick={(e) => { e.stopPropagation(); navigate(`/admin/hostels/${hostel.id || hostel._id}`); }}>Open</button>
                </div>
              </div>
            ))}
            {(!hostelsData || hostelsData.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-2">No active hostels found.</p>
            )}
          </div>
        </section>

        {/* 8. QUICK ENTITIES: OWNERS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Recent Owners</h3>
            <button onClick={() => navigate("/admin/owners")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">CRM</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            {ownersData?.slice(0, 3).map((owner, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition group cursor-pointer" onClick={() => openDrawer("owner", { name: owner.ownerName })}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center"><User size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-white">{owner.ownerName}</p>
                    <p className="text-[10px] text-slate-400">{owner.hostelName}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold hover:bg-white/20 text-white" onClick={(e) => { e.stopPropagation(); navigate("/admin/owners"); }}>CRM</button>
                </div>
              </div>
            ))}
            {(!ownersData || ownersData.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-2">No active owners found.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 9. NOTIFICATIONS CENTER */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Command Alerts</h3>
            <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300">View All</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 h-[320px] overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-100">Critical: Payment Gateway Latency</p>
                  <p className="text-[10px] text-red-200/60 mt-1">Stripe webhooks are experiencing 2s delays. Auto-retries enabled.</p>
                  <div className="flex gap-2 mt-2">
                    <button className="px-2 py-1 rounded bg-red-500/20 text-[9px] font-bold text-red-300">Resolve</button>
                    <button className="px-2 py-1 rounded bg-black/20 text-[9px] font-bold text-red-300">Dismiss</button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-100">Warning: High CPU Usage</p>
                  <p className="text-[10px] text-amber-200/60 mt-1">Node-1 is at 85% utilization.</p>
                  <div className="flex gap-2 mt-2">
                    <button className="px-2 py-1 rounded bg-amber-500/20 text-[9px] font-bold text-amber-300">Investigate</button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Zap size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-100">AI Recommendation</p>
                  <p className="text-[10px] text-blue-200/60 mt-1">3 hostels have dropping occupancy. Recommend sending promotional email.</p>
                  <div className="flex gap-2 mt-2">
                    <button className="px-2 py-1 rounded bg-blue-500/20 text-[9px] font-bold text-blue-300">Execute</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. RECENT ACTIVITY TIMELINE */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Activity Timeline</h3>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 h-[320px] overflow-y-auto custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="text-center text-slate-500 text-sm h-full flex items-center justify-center">No recent activity found.</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 6).map((act, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
                      {idx !== 5 && <div className="w-px h-full bg-white/10 mt-1" />}
                    </div>
                    <div className="pb-4 flex-1 cursor-pointer hover:bg-white/[0.02] p-2 -mt-2 rounded-lg transition" onClick={() => openDrawer(act.type, act)}>
                      <p className="text-xs font-bold text-white">{safeRender(act.title)}</p>
                      <p className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleString()} • {safeRender(act.subtitle)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <BackupManagerModal 
        isOpen={isBackupModalOpen} 
        onClose={() => setIsBackupModalOpen(false)} 
      />

      <ConfirmActionModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        actionType={actionModal?.actionType}
        requestData={actionModal?.item}
        onSuccess={() => {
          refetchSummary?.();
          refetchStats?.();
          refetchRevenue?.();
          refetchQueue?.();
          setActionModal(null);
        }}
      />
    </PageContainer>
  );
});

// Helper Components

function KpiCard({ title, value, trend, icon, actions }) {
  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-white/10 transition group">
      <div className="p-5 flex-1 cursor-pointer" onClick={actions[0]?.onClick}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition">{icon}</div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{trend}</span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
      </div>
      <div className="border-t border-white/5 bg-black/20 flex p-1.5 gap-1.5">
        {actions.map((act, idx) => (
          <button 
            key={idx} 
            onClick={(e) => { e.stopPropagation(); act.onClick(); }}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BiMetric({ label, value, trend, direction }) {
  return (
    <div className="flex flex-col border-b border-white/5 pb-2">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{label}</span>
      <div className="flex items-end justify-between">
        <span className="text-lg font-black text-white">{value}</span>
        {trend && (
          <span className={`text-[10px] font-bold ${direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
            {direction === 'up' ? '▲' : direction === 'down' ? '▼' : ''} {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default DashboardOverview;
