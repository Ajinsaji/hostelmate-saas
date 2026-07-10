import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import StatCard from "../components/cards/StatCard";
import SectionCard from "../components/cards/SectionCard";
import GlassWidget from "../components/widgets/GlassWidget";
import MetricRow from "../components/widgets/MetricRow";
import Timeline from "../components/widgets/Timeline";
import QuickActionButton from "../components/widgets/QuickActionButton";
import StatusBadge from "../components/feedback/StatusBadge";
import LoadingState from "../components/feedback/LoadingState";

// Hooks
import useExecutiveSummary from "../hooks/useExecutiveSummary";
import useDashboardStats from "../hooks/useDashboardStats";
import useRevenueMetrics from "../hooks/useRevenueMetrics";
import useCustomerHealth from "../hooks/useCustomerHealth";
import usePlatformMonitoring from "../hooks/usePlatformMonitoring";

// Theme & Icons
import { COLORS } from "../constants/theme";
import { 
  Building, 
  Users, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  CheckSquare, 
  AlertTriangle,
  ArrowRight,
  Zap,
  DollarSign,
  HeartHandshake,
  MessageSquare,
  Settings,
  ShieldCheck,
  TrendingDown,
  Sparkles
} from "lucide-react";

export const DashboardOverview = React.memo(() => {
  // Consume data hooks
  const { data: summaryData, loading: summaryLoading } = useExecutiveSummary();
  const { data: statsData, loading: statsLoading } = useDashboardStats();
  const { data: revenueData, loading: revenueLoading } = useRevenueMetrics();
  const { data: healthData, loading: healthLoading } = useCustomerHealth();
  const { data: telemetryData, loading: telemetryLoading } = usePlatformMonitoring();

  const isMainLoading = 
    summaryLoading || statsLoading || revenueLoading || healthLoading || telemetryLoading;

  if (isMainLoading) {
    return <LoadingState message="Loading platform executive statistics..." />;
  }

  // Visual layout helpers
  const platformKpiCards = [
    { title: "Active Hostels", ...statsData?.activeHostels, icon: <Building size={16} color={COLORS.primaryLight} />, status: "active" },
    { title: "Trial Hostels", ...statsData?.trialHostels, icon: <Sparkles size={16} color={COLORS.accentGold} />, status: "trial" },
    { title: "Expired Hostels", ...statsData?.expiredHostels, icon: <AlertTriangle size={16} color={COLORS.error} />, status: "expired" },
    { title: "Pending Requests", ...statsData?.pendingRequests, icon: <CheckSquare size={16} color={COLORS.warning} />, status: "pending" },
    { title: "Active Owners", ...statsData?.activeOwners, icon: <UserCheckIcon />, status: "active" },
    { title: "Total Residents", ...statsData?.totalResidents, icon: <Users size={16} color={COLORS.primaryLight} />, status: "active" },
    { title: "Daily Active Owners", ...statsData?.dailyActiveOwners, icon: <Activity size={16} color={COLORS.primaryLight} />, status: "active" },
    { title: "Platform Health", ...statsData?.platformHealthScore, icon: <ShieldCheck size={16} color={COLORS.primaryLight} />, status: "success" }
  ];

  const businessHealthMetrics = [
    { label: "MRR Growth", ...revenueData?.mrr },
    { label: "ARR Forecast", ...revenueData?.arr },
    { label: "Today's Ledger", ...revenueData?.todayRevenue },
    { label: "Net Monthly Profit", ...revenueData?.monthlyProfit },
    { label: "Platform Expenses", ...revenueData?.platformExpenses },
    { label: "Expected Revenue", ...revenueData?.expectedRevenue },
    { label: "Billing Renewals Due", ...revenueData?.pendingRenewals },
    { label: "Subscription Growth", ...revenueData?.subscriptionGrowth }
  ];

  return (
    <PageContainer>
      {/* Page Header */}
      <SectionHeader 
        title="Executive Command"
        subtitle="HostelMate Enterprise SaaS Commanding Center"
        actions={
          <div className="flex gap-2">
            <QuickActionButton label="Requests Wizard" icon={<CheckSquare size={14} />} variant="primary" onClick={() => {}} />
            <QuickActionButton label="Billing Finance" icon={<DollarSign size={14} />} variant="secondary" onClick={() => {}} />
          </div>
        }
      />

      {/* AI-Ready Executive Summary Banner */}
      <div 
        className="p-6 rounded-[26px] border mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(15, 93, 70, 0.25) 0%, rgba(11, 17, 32, 0.6) 100%)`,
          borderColor: COLORS.borderGlow
        }}
      >
        <div className="flex gap-4 items-center min-w-0">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{ borderColor: "rgba(20, 241, 217, 0.25)", background: "rgba(15, 122, 94, 0.15)", color: "#10B981" }}
          >
            <Zap size={22} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">AI Executive Analysis</h3>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              {summaryData?.summary || "Fulfilling platform telemetry analysis..."}
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition hover:bg-white/5 border border-white/10 shrink-0">
          Dispatch Logs
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 1. Platform Health Grid (8-card KPI group) */}
      <div className="mb-8 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-3 px-1">
          Platform Health & Operations
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {platformKpiCards.map((card, idx) => (
            <StatCard
              key={idx}
              title={card.title}
              value={card.value}
              trend={card.trend}
              trendDirection={card.direction}
              trendLabel="vs yesterday"
              sparkline={card.sparkline}
              icon={card.icon}
              statusBadge={<StatusBadge status={card.status} />}
            />
          ))}
        </div>
      </div>

      {/* 2. Business Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Metric widgets block */}
        <SectionCard 
          title="Business Health Ledger" 
          subtitle="Corporate SaaS financial ledger"
          bodyClassName="px-6 pb-6 flex flex-col justify-between h-[360px]"
        >
          <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
            {businessHealthMetrics.map((item, idx) => (
              <div key={idx} className="border-b border-white/5 pb-2 py-1">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{item.value}</p>
                <span className="text-[9px] font-bold" style={{ color: item.direction === "up" ? COLORS.success : item.direction === "down" ? COLORS.error : COLORS.textMuted }}>
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Revenue Trend Area Chart */}
        <GlassWidget className="lg:col-span-2 flex flex-col justify-between h-[360px]">
          <div className="flex justify-between items-start mb-4 select-none">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: COLORS.primaryLight }}>
                Revenue Centre
              </p>
              <h4 className="text-sm font-bold text-white mt-1">Platform Revenue Trend (MRR)</h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-white/50">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.primaryLight }} />MRR Curve</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.accentGold }} />Paid Target</span>
            </div>
          </div>

          <div className="flex-1 flex items-end relative overflow-hidden">
            <svg className="w-full h-full min-h-[180px]" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F7A5E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0B1120" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="37" x2="500" y2="37" stroke="rgba(255,255,255,0.03)" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" />
              <line x1="0" y1="112" x2="500" y2="112" stroke="rgba(255,255,255,0.03)" />
              
              <path d="M0,130 L80,110 L165,95 L250,75 L335,50 L420,38 L500,25 L500,150 L0,150 Z" fill="url(#areaGlow)" />
              <path d="M0,130 L80,110 L165,95 L250,75 L335,50 L420,38 L500,25" fill="none" stroke="#0F7A5E" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-between pt-2 text-[8px] font-bold text-white/20 select-none">
              <span>₹2.5L</span>
              <span>₹2.0L</span>
              <span>₹1.5L</span>
            </div>
          </div>

          <div className="flex justify-between text-[9px] font-bold text-white/40 pt-3 border-t border-white/5 select-none">
            {revenueData?.revenueTrend.map((t, idx) => (
              <span key={idx}>{t.month}</span>
            ))}
          </div>
        </GlassWidget>
      </div>

      {/* 3. Customer Health & Funnels Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Trial Conversion Funnel */}
        <SectionCard title="Trial Conversion Funnel" subtitle="Platform signup conversion flows">
          <div className="space-y-3.5">
            {healthData?.funnel.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-white/80">
                  <span>{step.step}</span>
                  <span>{step.count} ({step.percent}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${step.percent}%`, background: COLORS.primaryLight }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Churn Risk list */}
        <SectionCard title="Customer Churn Risk" subtitle="Hostels requiring urgent oversight">
          <div className="space-y-3">
            {healthData?.churnRisk.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start border-b border-white/5 pb-2 last:border-b-0">
                <div>
                  <p className="text-xs font-bold text-white">{item.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{item.reason}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: COLORS.error, background: COLORS.errorBg }}>
                  {item.riskLevel} Churn
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Performance High/Low lists */}
        <SectionCard title="Customer Success Score" subtitle="NPS & customer success telemetry" className="md:col-span-2 lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <p className="text-xs font-bold text-white">NPS Support Satisfaction</p>
                <p className="text-[10px] text-white/40 mt-0.5">Average ticket ratings</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-400">{healthData?.supportSatisfaction}</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Top Performing Customers</p>
              {healthData?.topPerforming.map((top, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[150px]">{top.name}</span>
                  <span className="font-bold text-emerald-400">{top.healthScore}/100</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 4. Operations Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <SectionCard 
          title="Operations Timeline" 
          subtitle="Recent platform activity logs"
          className="lg:col-span-2"
        >
          <Timeline items={statsData?.actionCenter} />
        </SectionCard>

        {/* Telemetry Telemetry */}
        <SectionCard title="Platform Monitoring" subtitle="Live infrastructure diagnostics">
          <div className="space-y-4">
            {/* DB widget */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Database Storage</span>
                <span className="font-bold text-white">{telemetryData?.databaseUsage.label}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${telemetryData?.databaseUsage.percent}%` }} />
              </div>
            </div>

            {/* RAM widget */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Server Memory</span>
                <span className="font-bold text-white">{telemetryData?.serverMemory.label}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-yellow-500" style={{ width: `${telemetryData?.serverMemory.percent}%` }} />
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-2 select-none">
              <div className="flex justify-between text-[11px] font-semibold text-white/50">
                <span>Active WebSocket Sockets</span>
                <span className="text-white font-bold">{telemetryData?.activeSockets}</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-white/50">
                <span>API Gateway Latency</span>
                <span className="text-emerald-400 font-bold">{telemetryData?.apiLatency}</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-white/50">
                <span>Cron Job Queue</span>
                <span className="text-emerald-400 font-bold">{telemetryData?.cronJobs}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
});

// Custom Icon helper for Owner check
function UserCheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={COLORS.primaryLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

export default DashboardOverview;
