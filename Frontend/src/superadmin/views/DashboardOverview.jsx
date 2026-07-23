import React, { useMemo, useState } from "react";
import PageContainer from "../layouts/PageContainer";
import { COLORS } from "../constants/theme";
import BackupManagerModal from "../components/modals/BackupManagerModal";
import { useDrawer } from "../contexts/DrawerContext";
import { useNavigate } from "react-router-dom";

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
  Activity, CheckSquare, Zap, ArrowRight, ShieldCheck, Database, Server,
  AlertTriangle, CheckCircle, Clock, Search, FileText, User, Building,
  PlusCircle, RefreshCcw, Send, Settings, ShieldAlert, BarChart3, LineChart,
  DollarSign, Users, ChevronRight, Download
} from "lucide-react";
import LoadingState from "../components/feedback/LoadingState";

export const DashboardOverview = React.memo(() => {
  const { openDrawer } = useDrawer();
  const navigate = useNavigate();
  
  const { data: hostelsData } = useHostels({ page: 1, pageSize: 3 });
  const { data: ownersData } = useOwners();
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Data hooks
  const { data: summaryData, loading: summaryLoading } = useExecutiveSummary();
  const { data: statsData, loading: statsLoading } = useDashboardStats();
  const { data: revenueData, loading: revenueLoading } = useRevenueMetrics();
  const { data: telemetryData, loading: telemetryLoading } = usePlatformMonitoring();
  const { workQueue, requests, improvements, recentActivity, loading: queueLoading } = useActionQueue();

  const isLoading = summaryLoading || statsLoading || revenueLoading || telemetryLoading || queueLoading;

  if (isLoading) {
    return <LoadingState message="Initializing Executive Command Center..." />;
  }

  // Helper to safely format numbers
  const formatNum = (num) => (num !== undefined && num !== null ? num.toLocaleString('en-IN') : '--');
  const safeRender = (val) => typeof val === 'object' && val !== null ? (val.name || val.title || 'Unknown') : val;

  return (
    <PageContainer>
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
                <h2 className="text-xl font-bold text-white">Platform Health: 98%</h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational
                </div>
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">AI Executive Summary</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                {summaryData?.summary || "Platform is operating optimally. Traffic is normal and database latency is stable."}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-medium mb-4">
                <div className="flex items-center gap-2">• {statsData?.activeHostels?.value || 0} active hostels</div>
                <div className="flex items-center gap-2">• {workQueue.filter(q => q.queueCategory === "Needs Approval").length} approvals pending</div>
                <div className="flex items-center gap-2">• Revenue today: ₹{formatNum(revenueData?.todayRevenue?.value)}</div>
                <div className="flex items-center gap-2">• Database healthy</div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-emerald-100 flex-1">
                  Recommended Action: Review {workQueue.filter(q => q.queueCategory === "Needs Approval").length} pending registrations.
                </p>
                <button 
                  onClick={() => openDrawer("request", { title: "Review Queue" })}
                  className="px-3 py-1.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold tracking-wider hover:bg-emerald-600 transition"
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
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <Building size={16} className="text-blue-400" /> Open Directory
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
            <button 
              onClick={() => openDrawer("owner", { title: "New Owner" })}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <PlusCircle size={16} className="text-emerald-400" /> Create Owner
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
            <button 
              onClick={() => setIsBackupModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <Database size={16} className="text-purple-400" /> Run Backup
              </div>
              <ArrowRight size={14} className="text-white/30 group-hover:text-white/80" />
            </button>
            <button 
              onClick={() => navigate("/admin/reports")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition group"
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
            title="Total Hostels" 
            value={formatNum(statsData?.totalHostels)} 
            trend="+3 today" 
            icon={<Building size={18} className="text-blue-400" />}
            actions={[
              { label: "Directory", onClick: () => navigate("/admin/hostels") },
              { label: "Create", onClick: () => navigate("/admin/hostels") }
            ]}
          />
          <KpiCard 
            title="Active Owners" 
            value={formatNum(statsData?.activeOwners?.value)} 
            trend="+1 today" 
            icon={<User size={18} className="text-emerald-400" />}
            actions={[
              { label: "CRM", onClick: () => navigate("/admin/owners") },
              { label: "Export", onClick: () => {} }
            ]}
          />
          <KpiCard 
            title="Total Residents" 
            value={formatNum(statsData?.totalResidents?.value)} 
            trend="+12 this week" 
            icon={<Users size={18} className="text-purple-400" />}
            actions={[
              { label: "View Roll", onClick: () => navigate("/admin/residents") }
            ]}
          />
          <KpiCard 
            title="Monthly Revenue" 
            value={`₹${formatNum(statsData?.monthlyRevenue)}`} 
            trend="+5.2% vs last" 
            icon={<DollarSign size={18} className="text-amber-400" />}
            actions={[
              { label: "Analytics", onClick: () => navigate("/admin/revenue") }
            ]}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* 3. TODAY'S WORK QUEUE (Action Queue) */}
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Today's Work Queue</h3>
            <button onClick={() => navigate("/admin/requests")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">View All Tasks</button>
          </div>
          
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            {workQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No pending tasks in queue! 🎉</div>
            ) : (
              <div className="flex flex-col">
                {workQueue.slice(0, 5).map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02] transition">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {item.type === "request" ? (
                          <div className="p-1.5 rounded bg-blue-500/10 text-blue-400"><CheckSquare size={16} /></div>
                        ) : (
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-400"><AlertTriangle size={16} /></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                            {item.queueCategory}
                          </span>
                          <span className="text-xs font-bold text-white">{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {safeRender(item.subtitle)} • {safeRender(item.owner)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.type === "request" && (
                        <>
                          <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition">Approve</button>
                          <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition">Reject</button>
                        </>
                      )}
                      <button 
                        onClick={() => openDrawer(item.type, item)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
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
            {/* CPU */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => openDrawer("ticket", { title: "Server CPU Details" })}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-slate-300">CPU Usage</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">▼ Normal</div>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl font-black text-white">42%</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition">View Logs</button>
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition">Restart</button>
              </div>
            </div>

            {/* RAM */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => openDrawer("ticket", { title: "Server RAM Details" })}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-purple-400" />
                  <span className="text-xs font-bold text-slate-300">Memory</span>
                </div>
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1">▲ 72%</div>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-4 border border-white/5">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: "72%" }} />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition">Clear Cache</button>
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition">Details</button>
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
            <button onClick={() => navigate("/admin/analytics")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Full BI</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 h-[240px] flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <BiMetric label="MRR" value={`₹${formatNum(revenueData?.mrr?.value)}`} trend={revenueData?.mrr?.trend} direction={revenueData?.mrr?.direction} />
              <BiMetric label="ARR" value={`₹${formatNum(revenueData?.arr?.value)}`} trend={revenueData?.arr?.trend} direction={revenueData?.arr?.direction} />
              <BiMetric label="Active Subscriptions" value={formatNum(statsData?.activeHostels?.value)} />
              <BiMetric label="Trial Conversion" value="64%" trend="+2%" direction="up" />
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
