import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble,
  Wallet,
  FileText,
  Sparkles,
  IndianRupee,
  Building,
  AlertTriangle,
  Receipt,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HardDrive
} from "lucide-react";

import api from "../utils/apiClient";
import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentHostel } from "../contexts/HostelContext";
import {
  Card,
  DashboardCard,
  MetricCard,
  Button,
  Badge,
  ProgressBar,
  SectionHeader,
} from "../design-system/components";

import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";

export const Dashboard = memo(function Dashboard() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { hostel, switchHostel } = useCurrentHostel();

  // Local state variables
  const [stats, setStats] = useState({
    residents: 0,
    rooms: 0,
    occupancyRate: 0,
    pendingRent: 0,
    todayCollection: 0,
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [ownerName, setOwnerName] = useState("Hostel Owner");
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  const activeHostelId = hostel?.id || hostel?._id;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ownerUser") || "null");
    if (user?.ownerName) setOwnerName(user.ownerName);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/dashboard");
      if (response.data.success) {
        setStats(response.data.stats || {});
      }
    } catch (error) {
      console.warn("Unable to load dashboard stats.", error);
    }
  }, []);

  const fetchPendingAdmissionsCount = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/admissions/pending");
      if (response.data && response.data.success) {
        setPendingCount(response.data.admissions?.length || 0);
      }
    } catch (err) {
      console.warn("Could not retrieve pending admissions count", err);
    }
  }, []);

  const fetchWorkspaceOverview = useCallback(async () => {
    try {
      const response = await api.get("/api/v2/workspaces/overview");
      if (response.data && response.data.success) {
        setWorkspaceData(response.data);
      }
    } catch (err) {
      console.warn("Failed to load workspace overview.", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWorkspaceOverview();
    fetchPendingAdmissionsCount();
  }, [activeHostelId, fetchStats, fetchWorkspaceOverview, fetchPendingAdmissionsCount]);

  const vacantRoomsCount = Math.max(0, (stats.rooms || 0) - Math.ceil(((stats.occupancyRate || 0) / 100) * (stats.rooms || 1)));

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header & Compact Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xl border p-4" style={{ background: "rgba(19, 28, 46, 0.8)", borderColor: colors.border.default || "#202B45" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Good day, {ownerName} • {hostel?.name || hostel?.hostelName || "Green Valley Hostel"}
          </p>
        </div>
        <Badge variant="success">Active Workspace</Badge>
      </div>

      {/* ========================================================================= */}
      {/* ABOVE THE FOLD — ONLY 3 PRIMARY QUESTIONS                                  */}
      {/* ========================================================================= */}

      {/* QUESTION 1: How is my hostel today? (Max 4 KPI Cards Only) */}
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
            value={`${stats.occupancyRate || 0}%`}
            icon={BedDouble}
            trend="Occupied Bunk"
            trendDirection="up"
          />
          <MetricCard
            title="Pending Rent"
            value={`₹${(stats.pendingRent || 0).toLocaleString()}`}
            icon={Wallet}
            trend="Overdue"
            trendDirection="down"
          />
          <MetricCard
            title="Today's Admissions"
            value={(pendingCount || 0).toString()}
            icon={UserPlus}
            trend="Pending Review"
            trendDirection="neutral"
          />
        </div>
      </div>

      {/* QUESTION 2: What needs attention? (Exactly ONE Compact Card) */}
      <div>
        <SectionHeader title="What needs attention?" subtitle="Operational alerts requiring immediate action" />
        <DashboardCard padding="md" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Alert 1: Overdue Payments */}
            <div 
              onClick={() => navigate("/payments?tab=pending")} 
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-white/[0.03] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.02)", minHeight: "44px" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 flex-shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Overdue Payments</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
                    ₹{(stats.pendingRent || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <Badge variant="danger" size="sm">Action</Badge>
            </div>

            {/* Alert 2: Active Complaints */}
            <div 
              onClick={() => navigate("/owner/dashboard")} 
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-white/[0.03] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.02)", minHeight: "44px" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Active Complaints</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>0 Active</div>
                </div>
              </div>
              <Badge variant="warning" size="sm">Normal</Badge>
            </div>

            {/* Alert 3: Vacant Rooms */}
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
              <Badge variant="success" size="sm">Available</Badge>
            </div>

          </div>
        </DashboardCard>
      </div>

      {/* QUESTION 3: What should I do next? (Exactly 4 Primary Actions) */}
      <div>
        <SectionHeader title="What should I do next?" subtitle="Common operational tasks" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
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
            icon={Wallet} 
            onClick={() => navigate("/payments")}
          >
            Collect Payment
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            icon={Receipt} 
            onClick={() => navigate("/owner/expense-dashboard")}
          >
            Add Expense
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

      {/* ========================================================================= */}
      {/* BELOW THE FOLD — PROGRESSIVE DISCLOSURE (Secondary Information)           */}
      {/* ========================================================================= */}

      <div className="pt-6 border-t space-y-6" style={{ borderColor: colors.border.default || "#202B45" }}>
        
        {/* Collapsible AI Insights */}
        <DashboardCard padding="md">
          <div 
            onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
            className="flex justify-between items-center cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={22} style={{ color: colors.accent.primary || "#22C55E" }} />
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
              <ProgressBar value={15.6} max={100} showLabel label="15.6 MB / 100 MB Used" color="primary" height="8px" />
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

export default Dashboard;
