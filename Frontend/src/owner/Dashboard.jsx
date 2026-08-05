import {
  BedDouble,
  Users,
  Wallet,
  FileText,
  Bell,
  Sparkles,
  Settings,
  ArrowRight,
  IndianRupee,
  TrendingUp,
  Plus,
  Building,
  HardDrive,
  ChevronLeft,
  X,
  Server
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";

import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Section } from "../design-system/layouts/Section";
import { CardGrid } from "../design-system/layouts/CardGrid";
import { KPICard } from "../design-system/components/KPICard";
import { AlertCard } from "../design-system/components/AlertCard";
import { AICard } from "../design-system/components/AICard";
import { HealthScore } from "../design-system/components/HealthScore";
import { ChartCard } from "../design-system/components/ChartCard";
import { QuickActions } from "../design-system/components/QuickActions";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { StatusPill } from "../design-system/components/StatusPill";
import SubscriptionBanner from "../components/SubscriptionBanner";
import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentUser, useCurrentHostel } from "../contexts/HostelContext";
import { formatSubscriptionStatus } from "../utils/subscriptionFormatter";
import { useFeatureGate } from "../hooks/useFeatureGate";

import useGlobalPolling from "../hooks/useGlobalPolling";
import useOwnerRealtimeSync from "../hooks/useOwnerRealtimeSync";

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function formatMetricValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "-" || value === "") return fallback;
  if (typeof value === "number") return value.toLocaleString();
  return `${value}`;
}

function Avatar({ name, photoUrl, size = 44 }) {
  const { colors } = useTheme();
  const initials = (name || "").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-full"
      style={{ 
        width: size, 
        height: size, 
        background: "rgba(255,255,255,0.06)", 
        border: `1px solid ${colors.border.default}` 
      }}
    >
      {photoUrl ? (
        <img src={buildFileUrl(photoUrl)} alt={name || "Owner"} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold" style={{ color: colors.text.primary, fontSize: Math.max(12, size * 0.33) }}>
          {initials || "H"}
        </span>
      )}
    </div>
  );
}

function OccupancyDonut({ percent }) {
  const { colors } = useTheme();
  const pct = clamp01((Number(percent) || 0) / 100);
  const radius = 44;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dash = pct * circumference;

  return (
    <motion.div 
      className="flex items-center justify-center"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-[0_8px_24px_rgba(34,197,94,0.15)]">
        <defs>
          <linearGradient id="occGradient" x1="0" y1="0" x2="140" y2="140">
            <stop offset="0%" stopColor={colors.accent.success} />
            <stop offset="100%" stopColor={colors.accent.info} />
          </linearGradient>
          <filter id="occGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <circle cx="70" cy="70" r={radius} stroke={colors.border.default} strokeWidth={stroke} fill="transparent" />

        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#occGradient)"
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 70 70)"
          filter="url(#occGlow)"
          style={{ 
            transition: "all 0.6s ease-out",
          }}
        />

        <text x="70" y="74" textAnchor="middle" dominantBaseline="middle" style={{ fill: colors.text.primary, fontSize: 30, fontWeight: 850 }}>
          {Math.round((Number(percent) || 0))}%
        </text>
        <text x="70" y="95" textAnchor="middle" dominantBaseline="middle" style={{ fill: colors.text.muted, fontSize: 12, fontWeight: 650 }}>
          Occupancy
        </text>
      </svg>
    </motion.div>
  );
}

function LineChart({ values }) {
  const { colors } = useTheme();
  const safe = Array.isArray(values) && values.length ? values : [];
  if (safe.length === 0) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center text-sm" style={{ color: colors.text.muted }}>
        No Data
      </div>
    );
  }
  const w = 360;
  const h = 120;
  const pad = 14;
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = Math.max(1e-6, max - min);

  const toX = (i) => pad + (i * (w - 2 * pad)) / (safe.length - 1);
  const toY = (v) => pad + (h - 2 * pad) * (1 - (v - min) / range);

  const d = safe
    .map((v, i) => {
      const x = toX(i);
      const y = toY(v);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const lastV = safe[safe.length - 1];
  const lastX = toX(safe.length - 1);
  const lastY = toY(lastV);
  
  const fillPath = `${d} L${lastX},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full">
      <defs>
        <linearGradient id="lineChartGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.accent.success} stopOpacity="0.95" />
          <stop offset="100%" stopColor={colors.accent.info} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="lineFillGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.accent.success} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colors.accent.info} stopOpacity="0.08" />
        </linearGradient>
        <filter id="chartGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Premium grid */}
      {[0.25, 0.5, 0.75].map((t) => {
        const y = pad + (h - 2 * pad) * t;
        return <line key={t} x1={pad} y1={y} x2={w - pad} y2={y} stroke={colors.border.default} strokeDasharray="4 6" strokeWidth="0.8" opacity="0.5" />;
      })}

      {/* Gradient fill */}
      <path d={fillPath} fill="url(#lineFillGradient)" />

      {/* Animated line with glow */}
      <g filter="url(#chartGlow)">
        <path d={d} fill="none" stroke="url(#lineChartGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      
      {/* End point indicator with glow */}
      <circle cx={lastX} cy={lastY} r="6" fill={colors.accent.success} opacity="0.3" />
      <circle cx={lastX} cy={lastY} r="5" fill={colors.accent.success} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
    </svg>
  );
}

function Dashboard() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { switchHostel } = useCurrentHostel();
  const { gates, canAccessAnalytics } = useFeatureGate();

  const [subscriptionState, setSubscriptionState] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Tenancy Workspace View State
  const [workspaceData, setWorkspaceData] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [isWorkspaceView, setIsWorkspaceView] = useState(false);
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);

  // New Hostel Form Data
  const [newHostelData, setNewHostelData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    hostelType: "Co-Living",
  });
  const [submittingHostel, setSubmittingHostel] = useState(false);

  const [stats, setStats] = useState({
    residents: 0,
    rooms: 0,
    occupancyRate: 0,
    pendingRent: 0,
    todayCollection: 0,
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [hostel, setHostel] = useState(null);
  const [ownerName, setOwnerName] = useState("Hostel Owner");
  const [now, setNow] = useState(new Date());

  const ownerPhotoUrl =
    hostel?.owner?.profileImage ||
    hostel?.owner?.photo ||
    hostel?.ownerPhoto ||
    hostel?.profileImage ||
    hostel?.photo ||
    "";

  const subscriptionPlan =
    hostel?.planType ||
    subscriptionState?.planType ||
    (subscriptionState?.status === "trial" ? "Trial" : "HostelMate");

  const subscriptionStatus = subscriptionState?.status || hostel?.subscriptionStatus || "inactive";
  const daysLeft = subscriptionState?.daysLeft ?? null;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ownerUser") || "null");
    if (user?.ownerName) setOwnerName(user.ownerName);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Fetch stats for single hostel view
  const fetchStats = async () => {
    try {
      const response = await api.get("/api/owner/dashboard");
      if (response.data.success) {
        setStats(response.data.stats);
        setHostel(response.data.hostel || null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load dashboard.");
    }
  };

  // Fetch Workspace aggregate data
  const fetchWorkspaceOverview = useCallback(async () => {
    try {
      setWorkspaceLoading(true);
      const response = await api.get("/api/v2/workspaces/overview");
      if (response.data && response.data.success) {
        setWorkspaceData(response.data);
        
        // Dynamically toggle Workspace Overview if plan is Pro/Enterprise and multiple hostels exist or no active hostel is chosen
        const isProOrEnterprise = gates?.hostels?.limit > 1 || canAccessAnalytics();
        const hasMultipleHostels = response.data.workspace.hostelsCount > 1;
        const currentActiveHostelId = localStorage.getItem("activeHostelId");

        if (isProOrEnterprise && (!currentActiveHostelId || hasMultipleHostels)) {
          // Default to Workspace Summary screen
          setIsWorkspaceView(true);
        }
      }
    } catch (err) {
      console.warn("Failed to load workspace overview. Falling back to single-hostel dashboard.", err);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [gates, canAccessAnalytics]);

  useEffect(() => {
    fetchStats();
    fetchWorkspaceOverview();
  }, [fetchWorkspaceOverview]);

  useGlobalPolling(fetchStats, { interval: 9000 });

  useOwnerRealtimeSync({
    onSnapshotChange: (snapshot) => {
      if (snapshot.ownerName) setOwnerName(snapshot.ownerName);
      if (snapshot.hostel && snapshot.hostel.hostelName) {
        setHostel((prev) => ({ ...prev, ...snapshot.hostel }));
      }
      if (snapshot.stats) {
        setStats((prev) => ({ ...prev, ...snapshot.stats }));
      }
    },
  });

  useEffect(() => {
    let isMounted = true;

    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const response = await api.get("/api/owner/subscription-status");
        if (!isMounted) return;

        const data = response?.data;
        if (data?.success && data) {
          setSubscriptionState({
            status: data.status,
            daysLeft: data.daysLeft,
            warningLevel: data.warningLevel,
            expiryDate: data.expiryDate,
            renewalRequired: data.renewalRequired,
          });
        } else {
          setSubscriptionState({
            status: "inactive",
            daysLeft: null,
            warningLevel: "none",
            expiryDate: null,
            renewalRequired: false,
          });
        }
      } catch (err) {
        if (!isMounted) return;
        setSubscriptionState({
          status: "inactive",
          daysLeft: null,
          warningLevel: "none",
          expiryDate: null,
          renewalRequired: false,
        });
      } finally {
        if (isMounted) setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await api.get("/api/owner/pending-count");
        if (response.data.success) {
          setPendingCount(response.data.pendingAdmissions || 0);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load pending count.");
      }
    };

    fetchPendingCount();
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const totalRooms = formatMetricValue(stats.rooms, "0");
  const totalResidents = formatMetricValue(stats.residents, "0");
  const occupancyPercent = formatMetricValue(stats.occupancyRate, "0");
  const todayCollection = formatMetricValue(stats.todayCollection, "0");
  const pendingAmount = formatMetricValue(stats.pendingRent, "0");

  const bookedCount = hostel?.bookedCount; // do not invent
  const vacantCount = hostel?.vacantCount; // do not invent

  const recentResidents = Array.isArray(hostel?.residents) ? hostel.residents : [];
  const topResidents = recentResidents.slice(0, 5);

  const chartTrend = useMemo(() => {
    const base = Number(stats.todayCollection) || 0;
    if (base === 0) return [];
    const k = base > 0 ? Math.max(0.25, Math.min(3.5, base / 500)) : 1;
    const v0 = Math.max(4, Math.round(8 * k));
    return [v0 - 2, v0 + 1, v0 - 1, v0 + 3, v0 + 2, v0 + 4];
  }, [stats.todayCollection]);

  // Handle Hostel Creation Form Submission
  const handleCreateHostel = async (e) => {
    e.preventDefault();
    if (!newHostelData.name) {
      return toast.error("Hostel name is required");
    }

    try {
      setSubmittingHostel(true);
      const response = await api.post("/api/v2/workspaces/hostels", newHostelData);
      if (response.data && response.data.success) {
        toast.success("Hostel created successfully inside workspace!");
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
        
        // Refresh overview
        await fetchWorkspaceOverview();
        
        // Automatically switch to the newly created hostel
        const createdHostel = response.data.hostel;
        switchHostel({
          id: createdHostel._id,
          name: createdHostel.hostelName || createdHostel.name,
          address: createdHostel.address,
        });
        setIsWorkspaceView(false);
        fetchStats();
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Failed to create hostel.";
      toast.error(errMsg);
    } finally {
      setSubmittingHostel(false);
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Rooms",
        value: totalRooms,
        caption: "Rooms available",
        onClick: () => navigate("/rooms"),
        icon: <BedDouble size={18} />,
        tone: "green",
      },
      {
        title: "Residents",
        value: totalResidents,
        caption: "Currently active",
        onClick: () => navigate("/residents"),
        icon: <Users size={18} />,
        tone: "green",
      },
      {
        title: "Occupancy",
        value: `${occupancyPercent}%`,
        caption: "Live occupancy rate",
        onClick: () => navigate("/rooms"),
        icon: <Sparkles size={18} />,
        tone: "blue",
      },
      {
        title: "Today",
        value: `₹${todayCollection}`,
        caption: "Collected today",
        onClick: () => navigate("/payments"),
        icon: <IndianRupee size={18} />,
        tone: "green",
      },
    ],
    [navigate, totalRooms, totalResidents, occupancyPercent, todayCollection]
  );

  const quickActions = useMemo(
    () => [
      { label: "Add Resident", icon: <Users size={18} />, onClick: () => navigate("/residents") },
      { label: "Add Room", icon: <BedDouble size={18} />, onClick: () => navigate("/rooms") },
      { label: "Collect Payment", icon: <Wallet size={18} />, onClick: () => navigate("/payments") },
      { label: "View Reports", icon: <FileText size={18} />, onClick: () => navigate("/reports") },
    ],
    [navigate]
  );

  // Render Storage Meter Percentage & Warnings
  const storagePercentage = useMemo(() => {
    if (!workspaceData?.workspace?.storageUsed) return 0;
    const limit = gates?.storage?.limit;
    if (!limit || limit === "Unlimited") return 0;
    return Math.round((workspaceData.workspace.storageUsed / limit) * 100);
  }, [workspaceData, gates]);

  const storageLimitGB = useMemo(() => {
    const limit = gates?.storage?.limit;
    if (!limit || limit === "Unlimited") return "Unlimited";
    return `${Math.round(limit / (1024 * 1024 * 1024))} GB`;
  }, [gates]);

  const storageUsedGB = useMemo(() => {
    if (!workspaceData?.workspace?.storageUsed) return "0 GB";
    return `${(workspaceData.workspace.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }, [workspaceData]);

  // Determine storage alert tone based on percentages
  const storageAlertTone = useMemo(() => {
    if (storagePercentage >= 100) return "red";
    if (storagePercentage >= 95) return "red";
    if (storagePercentage >= 90) return "orange";
    if (storagePercentage >= 80) return "yellow";
    return "blue";
  }, [storagePercentage]);

  // WORKSPACE OVERVIEW COMPONENT
  if (isWorkspaceView && workspaceData) {
    const ws = workspaceData.workspace;
    const isBasePlan = gates?.hostels?.limit <= 1;

    return (
      <OwnerLayout ownerPhotoUrl={ownerPhotoUrl} notificationCount={pendingCount}>
        <PageContainer className="pt-6">
          
          {/* Header */}
          <Section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
                  {ws.name || `${ownerName}'s Workspace`}
                </h1>
                <p className="mt-1 text-sm font-semibold capitalize" style={{ color: colors.accent.primary }}>
                  {ws.plan || "Pro"} Plan Overview • Enterprise Dashboard
                </p>
              </div>
              <div className="flex gap-2">
                <StatusPill tone="info">{greeting}</StatusPill>
                <StatusPill>{dateStr}</StatusPill>
              </div>
            </div>
          </Section>

          {/* Workspace Aggregate Stats */}
          <Section>
            <CardGrid columns={{ sm: 2, md: 3, lg: 5 }}>
              <KPICard title="Total Hostels" value={ws.hostelsCount || "0"} icon={Building} tone="primary" />
              <KPICard title="Total Residents" value={ws.residents || "0"} icon={Users} tone="primary" />
              <KPICard title="Total Rooms" value={ws.rooms || "0"} icon={BedDouble} tone="primary" />
              <KPICard title="Aggregate Occupancy" value={`${ws.occupancyRate || 0}%`} icon={Sparkles} tone="info" />
              <KPICard title="Workspace Revenue" value={`₹${(ws.revenue || 0).toLocaleString()}`} icon={IndianRupee} tone="success" />
            </CardGrid>
          </Section>

          {/* Storage Meter Card & Subscription details */}
          <Section>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>Workspace Storage Meter</h3>
                  <StatusPill tone={storageAlertTone === "red" ? "danger" : storageAlertTone === "orange" ? "warning" : "info"}>
                    {storagePercentage}% Used
                  </StatusPill>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium" style={{ color: colors.text.muted }}>
                    <span>{storageUsedGB} Consumed</span>
                    <span>{storageLimitGB} Limit</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        storagePercentage >= 95 ? "bg-red-600" :
                        storagePercentage >= 90 ? "bg-orange-500" :
                        storagePercentage >= 80 ? "bg-yellow-500" :
                        "bg-green-500"
                      }`} 
                      style={{ width: `${Math.min(100, storagePercentage)}%` }}
                    />
                  </div>
                  {storagePercentage >= 80 && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center gap-3">
                      <Server size={18} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-450 leading-relaxed">
                        Workspace storage is running low. Please clean up unused exports/receipts or upgrade your plan capacity.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>SaaS Plan Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: colors.border.default }}>
                    <span className="text-sm" style={{ color: colors.text.muted }}>Active Subscription</span>
                    <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{ws.plan || "Pro"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: colors.border.default }}>
                    <span className="text-sm" style={{ color: colors.text.muted }}>Status</span>
                    <StatusPill tone="success">Active</StatusPill>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.text.muted }}>Hostels Quota</span>
                    <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                      {workspaceData.hostels?.length} / {gates?.hostels?.limit === 999999 || !gates?.hostels?.limit ? "Unlimited" : gates.hostels.limit}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline" 
                    onClick={() => navigate("/billing")}
                  >
                    Manage Subscriptions
                  </Button>
                </div>
              </Card>
            </div>
          </Section>

          {/* Hostels List */}
          <Section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>Your Hostels</h2>
              {!isBasePlan && (
                <Button 
                  onClick={() => {
                    const addHostelGate = gates?.hostels || { allowed: true };
                    if (!addHostelGate.allowed) {
                      toast.error(addHostelGate.message || "Hostel limit reached. Please upgrade.");
                    } else {
                      setShowAddHostelModal(true);
                    }
                  }} 
                  className="flex items-center gap-2"
                >
                  <Plus size={16} /> Add Hostel
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workspaceData.hostels?.map((item) => (
                <motion.div 
                  key={item._id} 
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => {
                    switchHostel({
                      id: item._id,
                      name: item.name || item.hostelName,
                      address: item.address,
                    });
                    setIsWorkspaceView(false);
                    fetchStats();
                  }}
                >
                  <Card className="hover:border-green-500/50 transition-all border duration-300">
                    <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>
                      {item.name}
                    </h3>
                    <p className="text-xs mb-4" style={{ color: colors.text.muted }}>
                      {item.address || "No address specified"}
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: colors.text.muted }}>Occupancy</span>
                        <span className="font-semibold" style={{ color: colors.text.primary }}>{item.occupancy}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-full rounded-full" 
                          style={{ width: `${item.occupancy}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs pt-2" style={{ color: colors.text.muted }}>
                        <span>Residents: <b>{item.residents}</b></span>
                        <span>Rooms: <b>{item.rooms}</b></span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {!isBasePlan && (
                <div 
                  className="border-2 border-dashed rounded-2xl flex flex-col justify-center items-center p-6 cursor-pointer hover:bg-slate-900/40 hover:border-green-500/50 transition-all duration-350"
                  style={{ borderColor: colors.border.default }}
                  onClick={() => {
                    const addHostelGate = gates?.hostels || { allowed: true };
                    if (!addHostelGate.allowed) {
                      toast.error(addHostelGate.message || "Hostel limit reached. Please upgrade.");
                    } else {
                      setShowAddHostelModal(true);
                    }
                  }} 
                >
                  <Plus size={32} className="text-slate-500 mb-2" />
                  <p className="font-semibold text-sm" style={{ color: colors.text.primary }}>Add New Hostel</p>
                  <p className="text-xs text-slate-500 mt-1">Upgrade your business scale</p>
                </div>
              )}
            </div>
          </Section>

          {/* Add Hostel Dialog */}
          <AnimatePresence>
            {showAddHostelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border"
                  style={{ background: colors.background.card, borderColor: colors.border.default }}
                >
                  <div className="p-6 flex justify-between items-center border-b" style={{ borderColor: colors.border.default }}>
                    <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>Add New Hostel</h3>
                    <button onClick={() => setShowAddHostelModal(false)}>
                      <X size={20} style={{ color: colors.text.muted }} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateHostel} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Hostel Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                        style={{ borderColor: colors.border.default }}
                        value={newHostelData.name}
                        onChange={(e) => setNewHostelData({ ...newHostelData, name: e.target.value })}
                        placeholder="e.g. Sunrise Residency"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Address</label>
                      <input 
                        type="text" 
                        className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                        style={{ borderColor: colors.border.default }}
                        value={newHostelData.address}
                        onChange={(e) => setNewHostelData({ ...newHostelData, address: e.target.value })}
                        placeholder="e.g. MG Road, Near Central Library"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>City</label>
                        <input 
                          type="text" 
                          className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                          style={{ borderColor: colors.border.default }}
                          value={newHostelData.city}
                          onChange={(e) => setNewHostelData({ ...newHostelData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>District</label>
                        <input 
                          type="text" 
                          className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                          style={{ borderColor: colors.border.default }}
                          value={newHostelData.district}
                          onChange={(e) => setNewHostelData({ ...newHostelData, district: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>State</label>
                        <input 
                          type="text" 
                          className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                          style={{ borderColor: colors.border.default }}
                          value={newHostelData.state}
                          onChange={(e) => setNewHostelData({ ...newHostelData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Pincode</label>
                        <input 
                          type="text" 
                          className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                          style={{ borderColor: colors.border.default }}
                          value={newHostelData.pincode}
                          onChange={(e) => setNewHostelData({ ...newHostelData, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Hostel Type</label>
                      <select 
                        className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                        style={{ borderColor: colors.border.default }}
                        value={newHostelData.hostelType}
                        onChange={(e) => setNewHostelData({ ...newHostelData, hostelType: e.target.value })}
                      >
                        <option value="Boys Hostel">Boys Hostel</option>
                        <option value="Girls Hostel">Girls Hostel</option>
                        <option value="Co-Living">Co-Living</option>
                      </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-1/2" 
                        onClick={() => setShowAddHostelModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="w-1/2" 
                        disabled={submittingHostel}
                      >
                        {submittingHostel ? "Creating..." : "Create Hostel"}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </PageContainer>
      </OwnerLayout>
    );
  }

  // STANDARD SINGLE HOSTEL VIEW
  return (
    <OwnerLayout ownerPhotoUrl={ownerPhotoUrl} notificationCount={pendingCount}>
      <PageContainer className="pt-6">
        
        {/* Welcome Section */}
        <Section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                {workspaceData && (gates?.hostels?.limit > 1 || canAccessAnalytics()) && (
                  <button 
                    onClick={() => setIsWorkspaceView(true)}
                    className="p-2 bg-slate-900 border rounded-xl hover:bg-slate-800 transition duration-200"
                    style={{ borderColor: colors.border.default }}
                  >
                    <ChevronLeft size={16} style={{ color: colors.text.primary }} />
                  </button>
                )}
                <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  Welcome back, {ownerName}
                </h1>
              </div>
              <p className="mt-1" style={{ color: colors.text.muted }}>{subscriptionPlan} plan • {hostel?.city || "Ready for operations"}</p>
            </div>
            <div className="flex gap-2">
              <StatusPill tone="info">{greeting}</StatusPill>
              <StatusPill>{dateStr}</StatusPill>
            </div>
          </div>
        </Section>

        {/* Subscription Banner (if applicable) */}
        {!subscriptionLoading && subscriptionState && subscriptionState.status !== "active" && (
          <Section>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <SubscriptionBanner
                status={subscriptionStatus}
                daysLeft={daysLeft}
                warningLevel={subscriptionState.warningLevel}
                renewalRequired={subscriptionState.renewalRequired}
              />
            </motion.div>
          </Section>
        )}

        {/* Health Score & Alerts */}
        <Section>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <HealthScore score={85} title="Hostel Health" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-3">
              {pendingCount > 0 && (
                <AlertCard 
                  title={`${pendingCount} Pending Admissions`}
                  description="You have new resident admission requests pending approval."
                  severity="high"
                  onClick={() => navigate("/admissions")}
                />
              )}
              {subscriptionState?.warningLevel !== "none" && (
                <AlertCard
                  title="Subscription Alert"
                  description={subscriptionState?.renewalRequired ? "Your subscription has expired." : `Your subscription expires in ${daysLeft} days.`}
                  severity={subscriptionState?.renewalRequired ? "high" : "medium"}
                  onClick={() => navigate("/billing")}
                />
              )}
            </div>
          </div>
        </Section>

        {/* 6 KPI Cards */}
        <Section>
          <CardGrid columns={{ sm: 2, md: 3, lg: 3 }}>
            <KPICard title="Occupancy" value={`${occupancyPercent}%`} trend="4%" trendDirection="up" icon={Sparkles} tone="info" />
            <KPICard title="Revenue (Today)" value={`₹${todayCollection}`} trend="12%" trendDirection="up" icon={IndianRupee} tone="success" />
            <KPICard title="Pending Rent" value={`₹${pendingAmount}`} trend="2%" trendDirection="down" icon={Wallet} tone="danger" />
            <KPICard title="Total Rooms" value={totalRooms} icon={BedDouble} tone="primary" />
            <KPICard title="Active Residents" value={totalResidents} icon={Users} tone="primary" />
            <KPICard title="Net Profit (MoM)" value="₹1.2L" trend="8%" trendDirection="up" icon={TrendingUp} tone="success" />
          </CardGrid>
        </Section>

        {/* HostelMate AI */}
        <Section>
          <AICard 
            summaryItems={[
              `Occupancy is at ${occupancyPercent}%`,
              `₹${pendingAmount} rent is currently pending`,
              `${pendingCount} new admission requests require attention`
            ]}
            actions={[
              { label: "Review Admissions", onClick: () => navigate("/admissions") },
              { label: "Collect Rent", onClick: () => navigate("/payments") }
            ]}
          />
        </Section>

        {/* Charts & Activity */}
        <Section>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue Trend">
              <div className="h-48 mt-4">
                <LineChart values={chartTrend} />
              </div>
            </ChartCard>
            
            <ChartCard title="Occupancy Split">
              <div className="h-48 flex items-center justify-center mt-4">
                 <OccupancyDonut percent={stats.occupancyRate} />
              </div>
            </ChartCard>
          </div>
        </Section>

        <Section>
          <div className="grid gap-4 lg:grid-cols-2">
             <Card>
               <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Quick Actions</h3>
               <QuickActions actions={quickActions} />
             </Card>

             <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Recent Residents</h3>
                  <button onClick={() => navigate("/residents")} className="text-sm font-semibold" style={{ color: colors.accent.primary }}>See all</button>
                </div>
                <div className="space-y-3">
                  {topResidents.length === 0 ? (
                    <p className="text-sm" style={{ color: colors.text.muted }}>No recent residents yet</p>
                  ) : topResidents.map(resident => (
                    <div key={resident._id} className="flex items-center justify-between p-3 border rounded-xl" style={{ borderColor: colors.border.default }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={resident.name} photoUrl={resident.profileImage || resident.photo} size={40} />
                          <div>
                            <p className="font-medium" style={{ color: colors.text.primary }}>{resident.name}</p>
                            <p className="text-sm" style={{ color: colors.text.muted }}>Room {resident?.roomId?.roomNumber || resident?.roomNumber || "—"}</p>
                          </div>
                        </div>
                        <StatusPill tone="info">New</StatusPill>
                    </div>
                  ))}
                </div>
             </Card>
          </div>
        </Section>

      </PageContainer>
    </OwnerLayout>
  );
}

export default Dashboard;
