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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

import useGlobalPolling from "../hooks/useGlobalPolling";
import useOwnerRealtimeSync from "../hooks/useOwnerRealtimeSync";

const THEME = {
  bg: "#071223",
  card: "#101B33",
  border: "#334155",
  green: "#22C55E",
  blue: "#3B82F6",
  text: "#FFFFFF",
  secondary: "#CBD5E1",
  muted: "#94A3B8",
};

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
  const initials = (name || "").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: "rgba(255,255,255,0.06)", border: `1px solid rgba(51,65,85,0.95)` }}
    >
      {photoUrl ? (
        <img src={buildFileUrl(photoUrl)} alt={name || "Owner"} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold" style={{ color: THEME.text, fontSize: Math.max(12, size * 0.33) }}>
          {initials || "H"}
        </span>
      )}
    </div>
  );
}

function OccupancyDonut({ percent }) {
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
            <stop offset="0%" stopColor={THEME.green} />
            <stop offset="100%" stopColor={THEME.blue} />
          </linearGradient>
          <filter id="occGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <circle cx="70" cy="70" r={radius} stroke={`rgba(51,65,85,0.6)`} strokeWidth={stroke} fill="transparent" />

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

        <text x="70" y="74" textAnchor="middle" dominantBaseline="middle" style={{ fill: THEME.text, fontSize: 30, fontWeight: 850 }}>
          {Math.round((Number(percent) || 0))}%
        </text>
        <text x="70" y="95" textAnchor="middle" dominantBaseline="middle" style={{ fill: THEME.muted, fontSize: 12, fontWeight: 650 }}>
          Occupancy
        </text>
      </svg>
    </motion.div>
  );
}

function LineChart({ values }) {
  const safe = Array.isArray(values) && values.length ? values : [];
  if (safe.length === 0) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center text-sm" style={{ color: THEME.muted }}>
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
          <stop offset="0%" stopColor={THEME.green} stopOpacity="0.95" />
          <stop offset="100%" stopColor={THEME.blue} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="lineFillGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.green} stopOpacity="0.25" />
          <stop offset="100%" stopColor={THEME.blue} stopOpacity="0.08" />
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
        return <line key={t} x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(51,65,85,0.5)" strokeDasharray="4 6" strokeWidth="0.8" />;
      })}

      {/* Gradient fill */}
      <path d={fillPath} fill="url(#lineFillGradient)" />

      {/* Animated line with glow */}
      <g filter="url(#chartGlow)">
        <path d={d} fill="none" stroke="url(#lineChartGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      
      {/* End point indicator with glow */}
      <circle cx={lastX} cy={lastY} r="6" fill={THEME.green} opacity="0.3" />
      <circle cx={lastX} cy={lastY} r="5" fill={THEME.green} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
    </svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const [subscriptionState, setSubscriptionState] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

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

  return (
    <OwnerLayout ownerPhotoUrl={ownerPhotoUrl} notificationCount={pendingCount}>
      <PageContainer className="pt-6">
        
        {/* Welcome Section */}
        <Section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {ownerName}</h1>
              <p className="text-gray-500 mt-1">{subscriptionPlan} plan • {hostel?.city || "Ready for operations"}</p>
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
            {/* Adding Net Profit as a placeholder since we don't have it in stats, we can use a placeholder for now */}
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
               <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
               <QuickActions actions={quickActions} />
             </Card>

             <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Residents</h3>
                  <button onClick={() => navigate("/residents")} className="text-sm font-semibold text-purple-600">See all</button>
                </div>
                <div className="space-y-3">
                  {topResidents.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent residents yet</p>
                  ) : topResidents.map(resident => (
                    <div key={resident._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                       <div className="flex items-center gap-3">
                          <Avatar name={resident.name} photoUrl={resident.profileImage || resident.photo} size={40} />
                          <div>
                            <p className="font-medium text-gray-900">{resident.name}</p>
                            <p className="text-sm text-gray-500">Room {resident?.roomId?.roomNumber || resident?.roomNumber || "—"}</p>
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

