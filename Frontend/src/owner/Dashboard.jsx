import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BedDouble,
  Users,
  Wallet,
  FileText,
  Sparkles,
  IndianRupee,
  Plus,
  Building,
  AlertTriangle,
  Receipt,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  HardDrive
} from "lucide-react";

import api from "../utils/apiClient";
import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentHostel } from "../contexts/HostelContext";
import { useFeatureGate } from "../hooks/useFeatureGate";
import {
  Card,
  DashboardCard,
  MetricCard,
  Button,
  Badge,
  ProgressBar,
  SectionHeader,
  Modal,
  Input
} from "../design-system/components";

import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";

export default function Dashboard() {
  const { colors, typography } = useTheme();
  const navigate = useNavigate();
  const { hostel, switchHostel } = useCurrentHostel();
  const { gates } = useFeatureGate();

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
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [submittingHostel, setSubmittingHostel] = useState(false);
  const [ownerName, setOwnerName] = useState("Hostel Owner");
  const [recentPayments, setRecentPayments] = useState([]);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  const [newHostelData, setNewHostelData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    hostelType: "Co-Living",
  });

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
        setRecentPayments(response.data.recentPayments || []);
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
      setWorkspaceLoading(true);
      const response = await api.get("/api/v2/workspaces/overview");
      if (response.data && response.data.success) {
        setWorkspaceData(response.data);
      }
    } catch (err) {
      console.warn("Failed to load workspace overview.", err);
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWorkspaceOverview();
    fetchPendingAdmissionsCount();
  }, [activeHostelId, fetchStats, fetchWorkspaceOverview, fetchPendingAdmissionsCount]);

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    if (!newHostelData.name) {
      return toast.error("Hostel name is required");
    }

    try {
      setSubmittingHostel(true);
      const response = await api.post("/api/v2/workspaces/hostels", newHostelData);
      if (response.data && response.data.success) {
        toast.success("New hostel added successfully!");
        setShowAddHostelModal(false);
        setNewHostelData({
          name: "",
          address: "",
          city: "",
          state: "",
          district: "",
          pincode: "",
          hostelType: "Co-Living",
        });
        fetchWorkspaceOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create hostel.");
    } finally {
      setSubmittingHostel(false);
    }
  };

  const vacantRoomsCount = Math.max(0, (stats.rooms || 0) - Math.ceil(((stats.occupancyRate || 0) / 100) * (stats.rooms || 1)));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-3xl border p-4" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(15,23,42,0.9))", borderColor: colors.border.default || "#202B45" }}>
        <div>
          <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.24em", color: colors.text.secondary || "#94A3B8", margin: 0 }}>
            Daily command center
          </p>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: "4px 0 2px" }}>
            Good day, {ownerName} 👋
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: 0 }}>
            {hostel?.name || hostel?.hostelName || "Primary Workspace"} • Real-time operations and cash flow
          </p>
        </div>
        <Badge variant="success">Hostel Active</Badge>
      </div>

      {/* ABOVE THE FOLD SECTION 1: How is my hostel today? (Only 4 KPI cards) */}
      <div>
        <SectionHeader title="How is my hostel today?" subtitle="Only the essentials, above the fold" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="Today's Revenue"
            value={`₹${(stats.todayCollection || 0).toLocaleString()}`}
            icon={IndianRupee}
            trend="Collected Today"
            trendDirection="up"
          />
          <MetricCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate || 0}%`}
            icon={BedDouble}
            trend="Occupied"
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

      {/* ABOVE THE FOLD SECTION 2: What needs attention? (1 Compact Attention Card) */}
      <div>
        <SectionHeader title="What needs attention?" subtitle="Priority items that need action" />
        <DashboardCard padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <div 
              onClick={() => navigate("/payments?tab=pending")} 
              className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer hover:bg-white/[0.02] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>Overdue Payments</div>
                  <div style={{ fontSize: "15px", fontWeight: typography.weights.bold, color: "#FFFFFF" }}>
                    ₹{(stats.pendingRent || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <Badge variant="danger" size="sm">Action</Badge>
            </div>

            <div 
              onClick={() => navigate("/complaints")} 
              className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer hover:bg-white/[0.02] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>Active Complaints</div>
                  <div style={{ fontSize: "15px", fontWeight: typography.weights.bold, color: "#FFFFFF" }}>0 Complaints</div>
                </div>
              </div>
              <Badge variant="warning" size="sm">Resolved</Badge>
            </div>

            <div 
              onClick={() => navigate("/rooms?filter=vacant")} 
              className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer hover:bg-white/[0.02] transition"
              style={{ borderColor: colors.border.default || "#202B45", background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <BedDouble size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>Vacant Rooms</div>
                  <div style={{ fontSize: "15px", fontWeight: typography.weights.bold, color: "#FFFFFF" }}>
                    {vacantRoomsCount} Vacant
                  </div>
                </div>
              </div>
              <Badge variant="success" size="sm">Available</Badge>
            </div>

          </div>
        </DashboardCard>
      </div>

      {/* ABOVE THE FOLD SECTION 3: What should I do next? (Only 4 Primary Actions) */}
      <div>
        <SectionHeader title="What should I do next?" subtitle="Fast actions to keep operations moving" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            View Reports
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BELOW THE FOLD SECTIONS (Secondary Information)                           */}
      {/* ========================================================================= */}

      {/* Below Fold: Collapsible AI Suggestions (Collapsed by default) */}
      <DashboardCard padding="md">
        <div 
          onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
          className="flex justify-between items-center cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: colors.accent.primary || "#22C55E" }} />
            <h3 style={{ fontSize: typography.sizes.md || "16px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
              AI Insights & Smart Recommendations
            </h3>
          </div>
          {aiSuggestionsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {aiSuggestionsOpen && (
          <div className="pt-4 mt-3 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
            <WorkspaceInsights />
          </div>
        )}
      </DashboardCard>

      {/* Below Fold: Recent Activity & Storage Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recent Workspace Activity (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader title="Recent Activity Ledger" />
          <WorkspaceActivity />
        </div>

        {/* Storage Usage Status Bar (1 col) */}
        <div className="space-y-3">
          <SectionHeader title="Storage Status" />
          <DashboardCard padding="md">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={16} style={{ color: colors.accent.primary || "#22C55E" }} />
                <span style={{ fontSize: "14px", fontWeight: typography.weights.bold, color: "#FFFFFF" }}>Cloud Storage</span>
              </div>
              <Badge variant="success" size="sm">Pro Tier</Badge>
            </div>
            <ProgressBar value={15.6} max={100} showLabel label="15.6 MB / 100 MB Used" color="primary" height="8px" />
            <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: colors.border.default || "#202B45" }}>
              <span style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>Google Drive Sync</span>
              <button 
                onClick={() => navigate("/owner/storage-center")} 
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                style={{ minHeight: "44px" }}
              >
                Manage <ArrowRight size={12} />
              </button>
            </div>
          </DashboardCard>
        </div>

      </div>

      {/* Below Fold: Workspace Hostels & Add Hostel Modal */}
      {workspaceData && (
        <div className="pt-4">
          <SectionHeader title="Active Hostels Overview" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      <Building size={18} style={{ color: colors.accent.primary || "#22C55E" }} />
                      <h4 style={{ fontSize: "15px", fontWeight: typography.weights.bold, color: "#FFFFFF", margin: 0 }}>
                        {h.name}
                      </h4>
                    </div>
                    {isActive && <Badge variant="success" size="sm">Active</Badge>}
                  </div>
                  <p style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", margin: 0 }}>
                    {h.address?.city || h.city || "Location set"} • {h.capacity || 20} Beds Total
                  </p>
                </Card>
              );
            })}

            {/* Add Hostel Card Button */}
            <Card 
              hover 
              onClick={() => setShowAddHostelModal(true)} 
              padding="md"
              className="flex items-center justify-center border-dashed"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Plus size={18} /> Add New Hostel
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Hostel Creation Modal */}
      <Modal
        isOpen={showAddHostelModal}
        onClose={() => setShowAddHostelModal(false)}
        title="Add New Hostel to Workspace"
      >
        <form onSubmit={handleCreateHostel} className="space-y-4">
          <Input
            label="Hostel Name"
            required
            placeholder="e.g. Sunrise Executive Hostel"
            value={newHostelData.name}
            onChange={(e) => setNewHostelData({ ...newHostelData, name: e.target.value })}
          />

          <Input
            label="Street Address"
            placeholder="e.g. 123 Tech Park Road"
            value={newHostelData.address}
            onChange={(e) => setNewHostelData({ ...newHostelData, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="e.g. Bangalore"
              value={newHostelData.city}
              onChange={(e) => setNewHostelData({ ...newHostelData, city: e.target.value })}
            />
            <Input
              label="Pincode"
              placeholder="e.g. 560001"
              value={newHostelData.pincode}
              onChange={(e) => setNewHostelData({ ...newHostelData, pincode: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
            <Button variant="secondary" fullWidth onClick={() => setShowAddHostelModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth disabled={submittingHostel}>
              {submittingHostel ? "Creating..." : "Create Hostel"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
