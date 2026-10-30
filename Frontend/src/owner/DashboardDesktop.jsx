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
  Calendar,
  Wrench,
  Percent,
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
  attentionMetrics,
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
  const availableBeds = Math.max(0, stats?.vacancy ?? (totalBeds - occupiedBeds));
  const occupancyRate = stats?.occupancyRate || (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);
  const pendingRentAmount = stats?.pendingRent || 0;
  const effectivePendingCount = attentionMetrics?.pendingAdmissionsCount ?? stats?.pendingAdmissions ?? pendingCount ?? 0;

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
          status={subscriptionData.status || subscriptionData.subscription?.status}
          daysLeft={subscriptionData.daysRemaining ?? subscriptionData.subscription?.daysRemaining ?? subscriptionData.daysLeft}
          trialEndDate={subscriptionData.trialEndDate ?? subscriptionData.subscription?.trialEndDate ?? subscriptionData.subscription?.expiresAt}
          expiryDate={subscriptionData.endDate ?? subscriptionData.subscription?.endDate ?? subscriptionData.subscription?.expiresAt}
          warningLevel={subscriptionData.warningLevel}
          isTrial={subscriptionData.isTrial ?? subscriptionData.subscription?.isTrial}
        />
      )}
      
      {/* 1. Page Header & Dynamic Summary */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xl border p-5"
        style={{ background: colors.background.card || "#131C2E", borderColor: colors.border.default || "#202B45" }}
      >
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#FFFFFF", margin: 0, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Good day, {ownerName || "Hostel Owner"}{activeHostelName ? ` • ${activeHostelName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">Active Workspace</Badge>
        </div>
      </div>

      {/* 2. PRIMARY KPI CARDS (4 Columns) */}
      <div>
        <SectionHeader title="How is my hostel today?" subtitle="Key operational and financial metrics" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          <MetricCard
            title="Today's Revenue"
            value={`₹${(stats.todayCollection || 0).toLocaleString()}`}
            icon={IndianRupee}
            trend="Collected Today"
            trendDirection="up"
          />
          <MetricCard
            title="Available Beds"
            value={availableBeds.toString()}
            icon={BedDouble}
            trend={`${availableBeds} Ready for Check-in`}
            trendDirection="neutral"
          />
          <MetricCard
            title="Occupancy"
            value={`${occupancyRate}%`}
            icon={Percent}
            trend={`${occupiedBeds} / ${totalBeds} Beds Occupied`}
            trendDirection="up"
          />
          <MetricCard
            title="Pending Requests"
            value={effectivePendingCount.toString()}
            icon={UserPlus}
            trend={effectivePendingCount > 0 ? `${effectivePendingCount} Awaiting Review` : "All Caught Up"}
            trendDirection={effectivePendingCount > 0 ? "down" : "neutral"}
          />
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div>
        <SectionHeader title="Quick Actions" subtitle="Frequently used administrative workflows" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mt-3">
          <Button
            variant="secondary"
            fullWidth
            icon={UserPlus}
            onClick={() => navigate("/admissions")}
          >
            New Admission
          </Button>

          <Button
            variant="primary"
            fullWidth
            icon={UserPlus}
            onClick={() => navigate("/residents?action=add")}
          >
            Add Resident
          </Button>

          <Button
            variant="secondary"
            fullWidth
            icon={Wallet}
            onClick={() => navigate("/payments?action=collect")}
          >
            Collect Rent
          </Button>

          <Button
            variant="secondary"
            fullWidth
            icon={Receipt}
            onClick={() => navigate("/owner/expense-dashboard?action=add")}
          >
            Add Expense
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
            icon={FileText}
            onClick={() => navigate("/reports")}
          >
            Reports
          </Button>
        </div>
      </div>

      {/* 4. 2-COLUMN OPERATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Needs Attention */}
        <div className="space-y-4">
          <SectionHeader title="Needs Attention" subtitle="Items requiring immediate owner review" />
          <DashboardCard padding="md">
            <div className="divide-y" style={{ borderColor: colors.border.default || "#202B45" }}>
              {/* Row 1: Pay Today */}
              <div
                onClick={() => navigate("/payments")}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] rounded-xl transition"
                style={{ minHeight: "52px" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 flex-shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Pay Today</div>
                    <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>
                      {attentionMetrics?.payTodayCount || 0} residents with rent due today
                      {attentionMetrics?.payTodayAmount > 0 && ` (₹${attentionMetrics.payTodayAmount.toLocaleString()})`}
                    </div>
                  </div>
                </div>
                <Badge variant={attentionMetrics?.payTodayCount > 0 ? "warning" : "neutral"} size="sm">
                  {attentionMetrics?.payTodayCount > 0 ? `${attentionMetrics.payTodayCount} Due` : "None"}
                </Badge>
              </div>

              {/* Row 2: Overdue Payments */}
              <div
                onClick={() => navigate("/payments?tab=pending")}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] rounded-xl transition"
                style={{ minHeight: "52px" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${(attentionMetrics?.overdueCount > 0 || pendingRentAmount > 0) ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"} flex-shrink-0`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Overdue Payments</div>
                    <div style={{ fontSize: "12px", color: (attentionMetrics?.overdueCount > 0 || pendingRentAmount > 0) ? "#F87171" : colors.text.secondary || "#94A3B8" }}>
                      {attentionMetrics?.overdueCount > 0
                        ? `${attentionMetrics.overdueCount} residents overdue`
                        : pendingRentAmount > 0
                        ? "Pending overdue"
                        : "0 residents overdue"}
                      {(attentionMetrics?.overdueAmount > 0 || pendingRentAmount > 0) &&
                        ` (₹${(attentionMetrics?.overdueAmount || pendingRentAmount).toLocaleString()})`}
                    </div>
                  </div>
                </div>
                <Badge variant={(attentionMetrics?.overdueCount > 0 || pendingRentAmount > 0) ? "danger" : "success"} size="sm">
                  {(attentionMetrics?.overdueCount > 0 || pendingRentAmount > 0) ? "Action" : "Clear"}
                </Badge>
              </div>

              {/* Row 3: Pending Admissions */}
              <div
                onClick={() => navigate("/admissions")}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] rounded-xl transition"
                style={{ minHeight: "52px" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Pending Admissions</div>
                    <div style={{ fontSize: "12px", color: effectivePendingCount > 0 ? "#FBBF24" : colors.text.secondary || "#94A3B8" }}>
                      {effectivePendingCount} pending applicant{effectivePendingCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <Badge variant={effectivePendingCount > 0 ? "warning" : "neutral"} size="sm">
                  {effectivePendingCount > 0 ? `${effectivePendingCount} Pending` : "None"}
                </Badge>
              </div>

              {/* Row 4: Maintenance Requests */}
              <div
                onClick={() => navigate("/owner/dashboard")}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] rounded-xl transition"
                style={{ minHeight: "52px" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Maintenance Requests</div>
                    <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>
                      {attentionMetrics?.maintenanceCount || 0} open maintenance ticket{attentionMetrics?.maintenanceCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <Badge variant={attentionMetrics?.maintenanceCount > 0 ? "warning" : "success"} size="sm">
                  {attentionMetrics?.maintenanceCount > 0 ? `${attentionMetrics.maintenanceCount} Open` : "All Good"}
                </Badge>
              </div>
            </div>
          </DashboardCard>

          {/* Today's Tasks Widget */}
          <TodayTasksWidget />
        </div>

        {/* Right Column: Occupancy & Storage Status */}
        <div className="space-y-4">
          <SectionHeader title="Occupancy & Capacity" subtitle="Current resident distribution and bed availability" />
          <DashboardCard padding="md">
            <div className="flex items-start justify-between">
              <div>
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
                  {occupancyRate}%
                </div>
                <div style={{ fontSize: "14px", color: colors.text.secondary || "#94A3B8", marginTop: "4px" }}>
                  {occupiedBeds} / {totalBeds} beds occupied
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {occupiedBeds} Occupied
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  {availableBeds} Available
                </span>
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar
                value={occupancyRate}
                max={100}
                color="primary"
                height="10px"
              />
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border.default || "#202B45" }}>
              <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                {vacantRoomsCount} room{vacantRoomsCount !== 1 ? "s" : ""} currently have vacancies
              </span>
              <button
                onClick={() => navigate("/rooms?filter=vacant")}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                style={{ minHeight: "44px" }}
              >
                View Rooms <ArrowRight size={14} />
              </button>
            </div>
          </DashboardCard>

          {/* Cloud Storage Widget */}
          <SectionHeader title="Cloud Storage" />
          <DashboardCard padding="md">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={20} style={{ color: "#22C55E" }} />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Drive Storage</span>
              </div>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
            <ProgressBar value={storagePercent} max={100} showLabel label={`${usedFormatted} / ${limitFormatted} Used`} color="primary" height="8px" />
            <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border.default || "#202B45" }}>
              <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Encrypted sync</span>
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

      {/* 5. BELOW THE FOLD (AI Insights & Activity) */}
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
            {aiSuggestionsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {aiSuggestionsOpen && (
            <div className="pt-4 mt-3 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
              <WorkspaceInsights />
            </div>
          )}
        </DashboardCard>

        {/* Workspace Activity Ledger */}
        <div className="space-y-3">
          <SectionHeader title="Recent Activity" subtitle="Real-time log of administrative and operational updates" />
          <WorkspaceActivity />
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
                        <Building size={20} style={{ color: "#22C55E" }} />
                        <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
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
