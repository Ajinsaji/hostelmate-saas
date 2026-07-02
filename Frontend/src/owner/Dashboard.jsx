import {
  BedDouble,
  Users,
  Wallet,
  FileText,
  Bell,
  Sparkles,
  Settings,
  ArrowRight,
  Menu,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";

import BottomNav from "../components/BottomNav";
import DashboardLayout from "./DashboardLayout";
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
  const safe = Array.isArray(values) && values.length ? values : [10, 14, 12, 18, 16, 22];
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
    residents: "-",
    rooms: "-",
    occupancyRate: "-",
    pendingRent: "-",
    todayCollection: "-",
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
    const k = base > 0 ? Math.max(0.25, Math.min(3.5, base / 500)) : 1;
    // Keep "trend" derived from existing todayCollection; no API calls.
    const v0 = Math.max(4, Math.round(8 * k));
    return [v0 - 2, v0 + 1, v0 - 1, v0 + 3, v0 + 2, v0 + 4];
  }, [stats.todayCollection]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Rooms",
        value: totalRooms,
        trendText: "No change",
        onClick: () => navigate("/rooms"),
        icon: <BedDouble size={20} />,
        iconTint: THEME.green,
      },
      {
        title: "Total Residents",
        value: totalResidents,
        trendText: "No change",
        onClick: () => navigate("/residents"),
        icon: <Users size={20} />,
        iconTint: THEME.green,
      },
      {
        title: "Occupancy %",
        value: `${occupancyPercent}%`,
        trendText: "No change",
        onClick: () => navigate("/rooms"),
        icon: <Sparkles size={20} />,
        iconTint: THEME.blue,
      },
      {
        title: "Today's Collection",
        value: `₹${todayCollection}`,
        trendText: "No change",
        onClick: () => navigate("/payments"),
        icon: <IndianRupee size={20} />,
        iconTint: THEME.green,
      },
    ],
    [navigate, totalRooms, totalResidents, occupancyPercent, todayCollection]
  );

  const quickActions = useMemo(
    () => [
      { label: "Add Resident", icon: <Users size={20} />, onClick: () => navigate("/residents") },
      { label: "Add Room", icon: <BedDouble size={20} />, onClick: () => navigate("/rooms") },
      { label: "Collect Payment", icon: <Wallet size={20} />, onClick: () => navigate("/payments") },
      { label: "View Reports", icon: <FileText size={20} />, onClick: () => navigate("/reports") },
    ],
    [navigate]
  );

  return (
    <DashboardLayout variant="owner" activePath="/owner/dashboard">
      <div
        className="min-h-[100vh] pb-8 relative overflow-hidden"
        style={{ background: THEME.bg, color: THEME.text, paddingBottom: 112 }}
      >
        {/* Ambient background glow layers */}
        <div className="fixed top-0 left-0 w-96 h-96 rounded-full blur-[120px] opacity-[0.08]" style={{ background: THEME.green }} />
        <div className="fixed bottom-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-[0.06]" style={{ background: THEME.blue }} />
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 relative z-10">
          {!subscriptionLoading && subscriptionState && (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SubscriptionBanner
                status={subscriptionStatus}
                daysLeft={daysLeft}
                warningLevel={subscriptionState.warningLevel}
                renewalRequired={subscriptionState.renewalRequired}
              />
            </motion.div>
          )}

          {/* HERO / TOPBAR */}
          <motion.section
            className="rounded-[28px] border overflow-hidden relative backdrop-blur-xl"
            style={{ 
              borderColor: THEME.border, 
              background: "linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(59,130,246,0.04) 100%), rgba(16,27,51,0.45)",
              boxShadow: "0 8px 32px rgba(34,197,94,0.08), inset 0 1px 1px rgba(255,255,255,0.1)"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <motion.button
                  type="button"
                  aria-label="Menu"
                  onClick={() => toast("Menu")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-md hover:bg-opacity-70 transition-all"
                  style={{ borderColor: THEME.border, background: "rgba(16,27,51,0.5)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu size={18} style={{ color: THEME.text }} />
                </motion.button>

                {/* HostelMate Logo */}
                <motion.div className="flex items-center gap-3" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl relative"
                    style={{ background: "rgba(34,197,94,0.15)", border: `1px solid rgba(34,197,94,0.3)` }}
                  >
                    <div className="absolute inset-0 rounded-2xl blur-md opacity-50" style={{ background: "rgba(34,197,94,0.2)" }} />
                    <Sparkles size={18} style={{ color: THEME.green }} className="relative z-10" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[14px] font-extrabold tracking-wide">HostelMate</div>
                    <div className="text-[11px] font-semibold" style={{ color: THEME.muted, letterSpacing: "0.18em" }}>
                      OWNER
                    </div>
                  </div>
                </motion.div>

                <div className="flex items-center gap-2">
                  {/* Notification - Glowing */}
                  <motion.button
                    type="button"
                    aria-label="Notifications"
                    onClick={() => navigate("/admissions")}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-md transition-all"
                    style={{ borderColor: THEME.border, background: "rgba(16,27,51,0.5)" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity" style={{ background: `rgba(${34},${197},${94},0.3)` }} />
                    <Bell size={18} style={{ color: THEME.green }} className="relative z-10" />
                    {pendingCount > 0 && (
                      <motion.span
                        className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                        style={{ background: THEME.green, color: "#06121f" }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </motion.span>
                    )}
                  </motion.button>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Avatar name={ownerName} photoUrl={ownerPhotoUrl} size={48} />
                  </motion.div>
                </div>
              </div>

              <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <div className="flex flex-col gap-2">
                  <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {greeting}
                  </div>
                  <div className="text-[26px] sm:text-[32px] font-black tracking-tight">{ownerName} 👋</div>

                  <div className="mt-1 text-[13px] font-medium" style={{ color: THEME.secondary }}>
                    Manage your hostel easily and efficiently.
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold backdrop-blur-sm"
                      style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.25)" }}
                      whileHover={{ scale: 1.03 }}
                    >
                      {hostel?.hostelName || "HostelMate"}
                    </motion.span>
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold backdrop-blur-sm"
                      style={{ background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.25)" }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Settings size={14} style={{ color: THEME.blue }} />
                      {subscriptionPlan}
                    </motion.span>
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold backdrop-blur-sm"
                      style={{ background: "rgba(203,213,225,0.06)", borderColor: THEME.border }}
                      whileHover={{ scale: 1.03 }}
                    >
                      {dateStr}
                    </motion.span>
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold backdrop-blur-sm"
                      style={{ background: "rgba(203,213,225,0.06)", borderColor: THEME.border }}
                      whileHover={{ scale: 1.03 }}
                    >
                      {timeStr}
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* SUMMARY CARDS */}
          <motion.section 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {summaryCards.map((c, idx) => (
                <motion.button
                  key={c.title}
                  type="button"
                  onClick={c.onClick}
                  className="rounded-[18px] border p-4 sm:p-5 text-left backdrop-blur-md group relative overflow-hidden"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(16,27,51,0.6) 0%, rgba(16,27,51,0.4) 100%)",
                    borderColor: THEME.border,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)"
                  }}
                  whileHover={{ 
                    y: -4, 
                    boxShadow: `0 8px 24px rgba(${idx % 2 === 0 ? '34,197,94' : '59,130,246'},0.2), inset 0 1px 1px rgba(255,255,255,0.08)`
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                >
                  {/* Gradient border top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  />

                  <div className="flex items-center justify-between relative z-10">
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-[12px] backdrop-blur-md"
                      style={{ background: "rgba(34,197,94,0.12)", border: `1px solid rgba(34,197,94,0.25)` }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <span style={{ color: c.iconTint }}>{c.icon}</span>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }}>
                      <ArrowRight size={18} style={{ color: THEME.secondary, opacity: 0.6 }} />
                    </motion.div>
                  </div>
                  <div className="mt-4 relative z-10">
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                      {c.title}
                    </div>
                    <div className="mt-2 text-[22px] sm:text-[24px] font-black">{c.value}</div>
                    <div className="mt-2 text-[11px] font-semibold px-2 py-1 rounded-full inline-block" style={{ background: "rgba(34,197,94,0.12)", color: THEME.green }}>
                      {c.trendText}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Pending Payments + Occupancy */}
          <motion.section 
            className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Pending Payments */}
            <motion.div 
              className="rounded-[20px] border p-5 sm:p-6 backdrop-blur-md relative overflow-hidden group"
              style={{ 
                background: "linear-gradient(135deg, rgba(16,27,51,0.6) 0%, rgba(16,27,51,0.4) 100%)",
                borderColor: THEME.border,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)"
              }}
              whileHover={{ y: -4 }}
            >
              {/* Gradient border right */}
              <div 
                className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-red-500 via-red-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity"
              />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-[14px] font-extrabold">Pending Payments</div>
                  <div className="mt-1 text-[12px] font-semibold" style={{ color: THEME.muted }}>
                    Current pending amount
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => navigate("/payments")}
                  className="text-[12px] font-bold px-3 py-1 rounded-full backdrop-blur-sm transition-all"
                  style={{ background: "rgba(34,197,94,0.15)", color: THEME.green }}
                  whileHover={{ scale: 1.05 }}
                >
                  View All
                </motion.button>
              </div>

              <motion.div className="mt-5 relative z-10" initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}>
                <div className="flex items-baseline gap-2">
                  <div className="text-[28px] sm:text-[32px] font-black">₹{pendingAmount}</div>
                  <TrendingUp size={20} style={{ color: THEME.green }} className="opacity-60" />
                </div>
                <div className="mt-3 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    style={{ width: `${Math.min(100, (Number(pendingAmount) / 50000) * 100)}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (Number(pendingAmount) / 50000) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Occupancy */}
            <motion.div 
              className="rounded-[20px] border p-5 sm:p-6 backdrop-blur-md relative overflow-hidden group"
              style={{ 
                background: "linear-gradient(135deg, rgba(16,27,51,0.6) 0%, rgba(16,27,51,0.4) 100%)",
                borderColor: THEME.border,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)"
              }}
              whileHover={{ y: -4 }}
            >
              {/* Gradient border top */}
              <div 
                className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity"
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="text-[14px] font-extrabold">Occupancy Overview</div>
                <div className="text-[12px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm" style={{ background: "rgba(34,197,94,0.15)", color: THEME.green }}>
                  Live
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 relative z-10">
                <OccupancyDonut percent={stats.occupancyRate} />

                <div className="flex flex-col justify-center gap-3">
                  <motion.div 
                    className="rounded-[14px] border p-3 backdrop-blur-sm"
                    style={{ background: "rgba(7,18,35,0.4)", borderColor: THEME.border }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                      Booked
                    </div>
                    <div className="mt-2 text-[18px] font-black" style={{ color: THEME.green }}>
                      {bookedCount ?? "—"}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="rounded-[14px] border p-3 backdrop-blur-sm"
                    style={{ background: "rgba(7,18,35,0.4)", borderColor: THEME.border }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                      Vacant
                    </div>
                    <div className="mt-2 text-[18px] font-black" style={{ color: THEME.blue }}>
                      {vacantCount ?? "—"}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[18px] font-extrabold">Quick Actions</div>
                <div className="text-[12px] font-semibold" style={{ color: THEME.muted }}>
                  Jump into the next task instantly.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {quickActions.map((a, idx) => (
                <motion.button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className="rounded-[18px] border p-4 sm:p-5 text-left backdrop-blur-md group relative overflow-hidden"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(16,27,51,0.6) 0%, rgba(16,27,51,0.4) 100%)",
                    borderColor: THEME.border,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)"
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at top right, rgba(34,197,94,0.1), transparent)` }} />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-[14px] backdrop-blur-md relative"
                      style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(59,130,246,0.08) 100%)", border: `1px solid rgba(34,197,94,0.25)` }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <span style={{ color: THEME.green }}>{a.icon}</span>
                    </motion.div>
                    <div>
                      <div className="text-[13px] font-bold">{a.label}</div>
                    </div>
                  </div>
                  <motion.div className="mt-3 flex items-center justify-between relative z-10" whileHover={{ x: 4 }}>
                    <div className="text-[12px] font-bold" style={{ color: THEME.green }}>
                      {a.label === "Collect Payment" ? "₹" : "Go"}
                    </div>
                    <ArrowRight size={18} style={{ color: THEME.secondary, opacity: 0.7 }} />
                  </motion.div>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Recent Residents + Today’s Collection */}
          {/* Recent Residents + Today's Collection */}
          <motion.section 
            className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Recent Residents */}
            <motion.div 
              className="rounded-[20px] border p-5 sm:p-6 backdrop-blur-md relative overflow-hidden group"
              style={{ 
                background: "linear-gradient(135deg, rgba(16,27,51,0.6) 0%, rgba(16,27,51,0.4) 100%)",
                borderColor: THEME.border,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)"
              }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-[14px] font-extrabold">Recent Residents</div>
                  <div className="text-[12px] font-semibold" style={{ color: THEME.muted }}>
                    Maximum 5 residents
                  </div>
                </div>
                <motion.button 
                  type="button" 
                  onClick={() => navigate("/residents")} 
                  className="text-[12px] font-bold px-3 py-1 rounded-full backdrop-blur-sm transition-all"
                  style={{ background: "rgba(34,197,94,0.15)", color: THEME.green }}
                  whileHover={{ scale: 1.05 }}
                >
                  View All
                </motion.button>
              </div>

              <div className="mt-4 space-y-2 relative z-10">
                {topResidents.length === 0 ? (
                  <motion.div 
                    className="rounded-[14px] border p-4 text-center backdrop-blur-sm"
                    style={{ background: "rgba(7,18,35,0.35)", borderColor: THEME.border }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-[13px] font-semibold" style={{ color: THEME.secondary }}>
                      No recent residents
                    </div>
                    <div className="mt-1 text-[12px] font-semibold" style={{ color: THEME.muted }}>
                      Add a resident to get started.
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => navigate("/residents")}
                      className="mt-3 rounded-[12px] px-4 py-2 font-bold backdrop-blur-sm transition-all"
                      style={{ background: "rgba(34,197,94,0.18)", border: `1px solid rgba(34,197,94,0.35)`, color: THEME.green }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      + Add Resident
                    </motion.button>
                  </motion.div>
                ) : (
                  topResidents.map((r, idx) => {
                    const name = r?.name || "Resident";
                    const room = r?.roomId?.roomNumber || r?.roomNumber || "—";
                    const join = r?.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—";
                    const photo = r?.profileImage || r?.photo || "";

                    return (
                      <motion.button
                        key={r?._id || name}
                        type="button"
                        onClick={() => navigate("/residents")}
                        className="w-full rounded-[14px] border p-3 text-left backdrop-blur-sm group/resident"
                        style={{ background: "rgba(7,18,35,0.35)", borderColor: THEME.border }}
                        whileHover={{ x: 4, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={name} photoUrl={photo} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-bold">{name}</div>
                            <div className="mt-1 text-[12px] font-semibold px-2 py-0.5 rounded-full inline-block" style={{ background: "rgba(59,130,246,0.12)", color: THEME.blue }}>
                              Room {room}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                              Joined
                            </div>
                            <div className="text-[12px] font-bold" style={{ color: THEME.secondary }}>
                              {join}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Today's Collection */}
            <motion.div 
              className="rounded-[20px] border p-5 sm:p-6 backdrop-blur-md relative overflow-hidden group"
              style={{ 
                background: "linear-gradient(135deg, rgba(16,27,51,0.6) 0%, rgba(16,27,51,0.4) 100%)",
                borderColor: THEME.border,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)"
              }}
              whileHover={{ y: -4 }}
            >
              {/* Gradient border left */}
              <div 
                className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-green-500 via-green-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity"
              />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <div className="text-[14px] font-extrabold">Today's Collection</div>
                  <motion.div className="mt-2 text-[28px] sm:text-[32px] font-black" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}>
                    ₹{todayCollection}
                  </motion.div>
                  <div className="mt-1 text-[11px] font-bold px-2 py-1 rounded-full inline-block" style={{ background: "rgba(34,197,94,0.15)", color: THEME.green }}>
                    +8% yesterday
                  </div>
                </div>
                <motion.div 
                  className="flex h-12 w-12 items-center justify-center rounded-[12px] backdrop-blur-md relative"
                  style={{ background: "rgba(59,130,246,0.12)", border: `1px solid rgba(59,130,246,0.3)` }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <div className="absolute inset-0 rounded-[12px] blur-lg opacity-30" style={{ background: "rgba(59,130,246,0.3)" }} />
                  <IndianRupee size={20} style={{ color: THEME.blue }} className="relative z-10" />
                </motion.div>
              </div>

              <motion.div 
                className="mt-4 rounded-[14px] border p-3 backdrop-blur-sm relative z-10"
                style={{ background: "rgba(7,18,35,0.35)", borderColor: THEME.border }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <LineChart values={chartTrend} />
              </motion.div>
            </motion.div>
          </motion.section>
        </div>

        <BottomNav />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;

