import { memo } from "react";
import {
  BedDouble,
  Wallet,
  FileText,
  IndianRupee,
  Building,
  AlertTriangle,
  Receipt,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HardDrive,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  Card,
  DashboardCard,
  MetricCard,
  Button,
  Badge,
  ProgressBar,
  SectionHeader,
} from "../design-system/components";
import { useCurrentStorage } from "../contexts/HostelContext";
import SubscriptionBanner from "../components/SubscriptionBanner";
import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";
import TodayTasksWidget from "../components/TodayTasksWidget";

export const DashboardDesktop = memo(function DashboardDesktop({
  stats,
  pendingCount,
  workspaceData,
  subscriptionData,
  activeHostelId,
  switchHostel,
  vacantRoomsCount,
  ownerName,
  hostel,
  navigate,
  aiSuggestionsOpen,
  setAiSuggestionsOpen,
}) {
  const { colors } = useTheme();
  const { storage } = useCurrentStorage();

  const activeHostelName = hostel?.name || hostel?.hostelName || "";
  const totalBeds = stats?.totalBeds || 0;
  const occupiedBeds = stats?.occupiedBeds || 0;
  const occupancyRate = stats?.occupancyRate || (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);
  const pendingRentAmount = stats?.pendingRent || 0;
  const todayAdmissionsCount = stats?.newAdmissionsToday || 0;
  const effectivePendingCount = stats?.pendingAdmissions ?? pendingCount ?? 0;

  // Storage calculation
  const usedMB = workspaceData?.storage?.usedMB || storage?.used || 0;
  const limitMB = workspaceData?.storage?.limitMB || (storage?.limit ? (storage.limit * 1024) : 5120);
  const usedFormatted = typeof usedMB === "number" ? (usedMB < 1024 ? `${usedMB.toFixed(1)} MB` : `${(usedMB / 1024).toFixed(1)} GB`) : `${usedMB}`;
  const limitFormatted = typeof limitMB === "number" ? (limitMB < 1024 ? `${limitMB} MB` : `${(limitMB / 1024).toFixed(0)} GB`) : `${limitMB}`;
  const storagePercent = limitMB > 0 ? Math.min(100, Math.round((usedMB / limitMB) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Subscription / Free Trial / Expiry Banner */}
      {subscriptionData && (
        <SubscriptionBanner
          status={subscriptionData.status}
          daysLeft={subscriptionData.daysRemaining}
          trialEndDate={subscriptionData.trialEndDate}
          expiryDate={subscriptionData.endDate}
          warningLevel={subscriptionData.warningLevel}
          isTrial={subscriptionData.isTrial}
        />
      )}
      
      {/* 1. Page Header & Dynamic Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xl border p-4" style={{ background: "rgba(19, 28, 46, 0.8)", borderColor: colors.border.default || "#202B45" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Good day, {ownerName || "Hostel Owner"}{activeHostelName ? ` • ${activeHostelName}` : ""}
          </p>
        </div>
        <Badge variant="success">Active Workspace</Badge>
      </div>

      {/* 2. PRIMARY KPI CARDS */}
      <div>
        <SectionHeader title="How is my hostel today?" subtitle="Key metrics at a glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          <MetricCard
            title="Today's Revenue"
            value={`₹${(stats.todayCollection || 0).toLocaleString()}`}
            icon={IndianRupee}
            trend="Collected Today"
            trendDirection="up"
          />
          <MetricCard
            title="Occupancy"
            value={`${occupancyRate}%`}
            icon={BedDouble}
            trend={`${occupiedBeds} / ${totalBeds} Beds Occupied`}
            trendDirection="up"
          />
          <MetricCard
            title="Pending Rent"
            value={`₹${pendingRentAmount.toLocaleString()}`}
            icon={Wallet}
            trend={pendingRentAmount > 0 ? "Overdue payments" : "No overdue payments"}
            trendDirection={pendingRentAmount > 0 ? "down" : "neutral"}
          />
          <MetricCard
            title="Today's Admissions"
            value={todayAdmissionsCount.toString()}
            icon={UserPlus}
            trend={todayAdmissionsCount > 0 ? `${todayAdmissionsCount} New Today` : "Admissions Today"}
            trendDirection="neutral"
          />
        </div>
      </div>

      {/* 3. UNIFIED ADMISSIONS SUMMARY SECTION */}
      <div>
        <SectionHeader title="Admissions & Applicants" subtitle="Review incoming requests and approvals" />
        <DashboardCard padding="md" className="mt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Admissions</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {effectivePendingCount} Awaiting Approval
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {todayAdmissionsCount} New Today
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant={effectivePendingCount > 0 ? "primary" : "secondary"}
              icon={ArrowRight}
              onClick={() => navigate("/admissions")}
              className="self-start sm:self-auto"
            >
              View Admissions
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* 4. WHAT NEEDS ATTENTION? (DATA-DRIVEN BADGES) */}
      <div>
        <SectionHeader title="What needs attention?" subtitle="Operational alerts requiring action" />
        <DashboardCard padding="md" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div 
              onClick={() => navigate("/payments?tab=pending")} 
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-white/[0.03] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.02)", minHeight: "44px" }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${pendingRentAmount > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"} flex-shrink-0`}>
                  <AlertTriangle size={22} />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Overdue Payments</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
                    ₹{pendingRentAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              <Badge variant={pendingRentAmount > 0 ? "danger" : "success"} size="sm">
                {pendingRentAmount > 0 ? "Action" : "All caught up"}
              </Badge>
            </div>

            <div 
              onClick={() => navigate("/owner/dashboard")} 
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-white/[0.03] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.02)", minHeight: "44px" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400 flex-shrink-0">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Active Complaints</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>0 Active</div>
                </div>
              </div>
              <Badge variant="neutral" size="sm">No complaints</Badge>
            </div>

            <div 
              onClick={() => navigate("/rooms?filter=vacant")} 
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-white/[0.03] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.02)", minHeight: "44px" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                  <BedDouble size={22} />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Vacant Rooms</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
                    {vacantRoomsCount} Vacant
                  </div>
                </div>
              </div>
              <Badge variant={vacantRoomsCount > 0 ? "success" : "neutral"} size="sm">
                {vacantRoomsCount > 0 ? "Available" : "Fully occupied"}
              </Badge>
            </div>

          </div>
        </DashboardCard>

        {/* TODAY'S OPERATIONAL ACTION TASKS WIDGET */}
        <div className="mt-4">
          <TodayTasksWidget />
        </div>
      </div>

      {/* 5. QUICK ACTIONS */}
      <div>
        <SectionHeader title="What should I do next?" subtitle="Common operational tasks" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-3">
          <Button 
            variant="primary" 
            fullWidth 
            icon={UserPlus} 
            onClick={() => navigate("/residents")}
          >
            Add Resident
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            icon={PlusCircle} 
            onClick={() => navigate("/rooms")}
          >
            Add Room
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            icon={UserPlus} 
            onClick={() => navigate("/admissions")}
          >
            New Admission
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            icon={Wallet} 
            onClick={() => navigate("/payments")}
          >
            Collect Payment
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            icon={FileText} 
            onClick={() => navigate("/reports")}
          >
            Reports
          </Button>
        </div>
      </div>

      {/* 6. BELOW THE FOLD */}
      <div className="pt-6 border-t space-y-6" style={{ borderColor: colors.border.default || "#202B45" }}>
        
        {/* Collapsible AI Insights */}
        <DashboardCard padding="md">
          <div 
            onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
            className="flex justify-between items-center cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                AI Insights & Recommendations
              </h3>
            </div>
            {aiSuggestionsOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </div>

          {aiSuggestionsOpen && (
            <div className="pt-4 mt-3 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
              <WorkspaceInsights />
            </div>
          )}
        </DashboardCard>

        {/* Workspace Activity Ledger & Storage Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <SectionHeader title="Recent Activity" />
            <WorkspaceActivity />
          </div>

          <div className="space-y-3">
            <SectionHeader title="Cloud Storage" />
            <DashboardCard padding="md">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive size={22} style={{ color: colors.accent.primary || "#22C55E" }} />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Drive Storage</span>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <ProgressBar value={storagePercent} max={100} showLabel label={`${usedFormatted} / ${limitFormatted} Used`} color="primary" height="8px" />
              <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border.default || "#202B45" }}>
                <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Cloud Sync</span>
                <button 
                  onClick={() => navigate("/owner/storage-center")} 
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  style={{ minHeight: "44px" }}
                >
                  Manage <ArrowRight size={14} />
                </button>
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Active Hostels Overview */}
        {workspaceData && (
          <div>
            <SectionHeader title="Workspace Hostels" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
              {workspaceData.hostels?.map((h) => {
                const isActive = (h.id || h._id) === activeHostelId;
                return (
                  <Card 
                    key={h.id || h._id}
                    hover
                    onClick={() => switchHostel(h.id || h._id)}
                    padding="md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Building size={22} style={{ color: colors.accent.primary || "#22C55E" }} />
                        <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                          {h.name}
                        </h4>
                      </div>
                      {isActive && <Badge variant="success" size="sm">Active</Badge>}
                    </div>
                    <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: 0 }}>
                      {h.city || h.address || "Hostel Location"}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

export default DashboardDesktop;
