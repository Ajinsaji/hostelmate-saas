import { BedDouble, Users, Wallet, FileText, Bell, ArrowRight, IndianRupee, ShieldCheck, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";
import BottomNav from "../components/BottomNav";
import DashboardLayout from "./DashboardLayout";

import useGlobalPolling from "../hooks/useGlobalPolling";
import useOwnerRealtimeSync from "../hooks/useOwnerRealtimeSync";
import SubscriptionBanner from "../components/SubscriptionBanner";
import SubscriptionStatusBadge from "../components/SubscriptionStatusBadge";
import SubscriptionProgressCard from "../components/SubscriptionProgressCard";


function Dashboard() {
  const navigate = useNavigate();


  // STEP 1: subscription state
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

  const subscriptionStatus =
    subscriptionState?.status || hostel?.subscriptionStatus || "inactive";

  const subscriptionStartDate =
    hostel?.subscriptionStartDate || subscriptionState?.subscriptionStartDate || "";
  const subscriptionEndDate =
    hostel?.subscriptionEndDate || subscriptionState?.subscriptionEndDate || "";

  const subscriptionAmount = subscriptionState?.subscriptionAmount ?? hostel?.amount ?? null;
  const daysLeft = subscriptionState?.daysLeft ?? null;
  const renewalRequired = subscriptionState?.renewalRequired || false;
  const freeAccess = hostel?.isFreeAccess || subscriptionState?.status === "freeAccess";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ownerUser") || "null");
    if (user?.ownerName) setOwnerName(user.ownerName);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/owner/dashboard");
      if (response.data.success) {
        setStats(response.data.stats);
        setHostel(response.data.hostel || null);
        if (response.data.hostel?.hostelName) {
          setHostel(response.data.hostel);
        }
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

  // STEP 2: fetch lifecycle data
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
        console.error("Subscription status fetch failed", err);
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

  // Fetch pending admission count with auto-refresh every 25 seconds
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

  return (
    <DashboardLayout variant="owner" activePath="/owner/dashboard">
      <div className="mb-6">
        {!subscriptionLoading && subscriptionState && (
          <div className="space-y-4">
            <SubscriptionBanner
              status={subscriptionState.status}
              daysLeft={subscriptionState.daysLeft}
              warningLevel={subscriptionState.warningLevel}
              renewalRequired={subscriptionState.renewalRequired}
            />
          </div>
        )}
      </div>

      <div className="gradient-header mb-6 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <p className="text-sm text-white/75">Welcome Back, {ownerName} 👋</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{hostel?.hostelName || "HostelMate Premium"}</h1>
            <p className="text-sm text-white/70">Small improvements every day create big success.</p>
          </div>


          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
              {ownerPhotoUrl ? (
                <img
                  src={buildFileUrl(ownerPhotoUrl)}
                  alt="Owner"
                  className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-xl font-semibold text-white/90">
                  {ownerName?.charAt(0)?.toUpperCase() || "H"}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Hostel Owner</p>
                <p className="text-sm font-semibold text-white">{ownerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                onClick={() => navigate("/admissions")}
              >
                <Bell size={20} className="mr-2" />
                Admissions {pendingCount > 0 ? `(${pendingCount})` : ""}
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                onClick={() => navigate("/profile")}
              >
                <Settings size={20} className="mr-2" />
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Subscription */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-[3fr_1fr]">
        {/* Left: Welcome + Stats */}
        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard title="Residents" value={stats.residents} icon={<Users size={24} color="var(--primary)" />} />
            <StatCard title="Rooms" value={stats.rooms} icon={<BedDouble size={24} color="var(--primary)" />} />
            <StatCard title="Occupancy" value={`${stats.occupancyRate}%`} icon={<Users size={24} color="var(--primary)" />} />
            <StatCard
              title="Today's Collection"
              value={`₹${stats.todayCollection}`}
              icon={<IndianRupee size={24} color="var(--primary)" />}
            />
            <StatCard
              title="Pending Rent"
              value={`₹${stats.pendingRent}`}
              icon={<Wallet size={24} color="var(--primary)" />}
              full
            />
          </div>
        </div>

        {/* Right: Compact Subscription Summary */}
        <div className="max-w-sm rounded-3xl border border-white/10 bg-slate-950/90 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Subscription</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{subscriptionPlan}</h2>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${
                subscriptionStatus === "expired"
                  ? "bg-rose-500/15 text-rose-200"
                  : subscriptionStatus === "trial"
                    ? "bg-sky-500/15 text-sky-200"
                    : subscriptionStatus === "expiringSoon"
                      ? "bg-amber-500/15 text-amber-200"
                      : "bg-emerald-500/15 text-emerald-200"
              }`}
            >
              {subscriptionStatus === "trial"
                ? "Trial"
                : subscriptionStatus === "expired"
                  ? "Expired"
                  : subscriptionStatus === "expiringSoon"
                    ? "Expiring Soon"
                    : subscriptionStatus === "active"
                      ? "Active"
                      : subscriptionStatus}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">Days Left</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {typeof daysLeft === "number" ? `${daysLeft} days` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">Expiry Date</p>
              <p className="mt-2 text-sm font-semibold text-white">{subscriptionEndDate || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <ActionButton

          title="Add Room"
          subtitle="Create a new room"
          icon={<BedDouble size={22} color="var(--primary-dark)" />}
          onClick={() => navigate("/rooms")}
        />
        <ActionButton
          title="Add Resident"
          subtitle="Register a new resident"
          icon={<Users size={22} color="var(--primary-dark)" />}
          onClick={() => navigate("/admissions")}
        />
        <ActionButton
          title="Collect Payment"
          subtitle="Review and collect rent"
          icon={<Wallet size={22} color="var(--primary-dark)" />}
          onClick={() => navigate("/payments")}
        />
        <ActionButton
          title="View Reports"
          subtitle="Download reports and analytics"
          icon={<FileText size={22} color="var(--primary-dark)" />}
          onClick={() => navigate("/reports")}
        />
        <ActionButton
          title="Profile"
          subtitle="Manage owner profile"
          icon={<Users size={22} color="var(--primary-dark)" />}
          onClick={() => navigate("/owner/profile")}
        />
      </div>

      {/* Quick actions */}

      <BottomNav />
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, full }) {
  return (
    <div
      className="card"
      style={{
        gridColumn: full ? "span 2" : "span 1",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "rgba(37, 211, 102, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <p className="text-small">{title}</p>
      <h2 className="text-h1" style={{ fontSize: "28px", color: "var(--text-main)" }}>
        {value}
      </h2>
    </div>
  );
}

function ActionButton({ title, subtitle, icon, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      style={{
        background: "var(--bg-color)",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        border: "1px solid transparent",
        touchAction: "manipulation",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(20, 241, 217, 0.35)";
        e.currentTarget.style.boxShadow = "0 18px 60px rgba(0,0,0,0.35)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(0px) scale(0.99)";
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "translateY(0px) scale(0.99)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
    >
      <div className="flex items-center gap-4">
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "var(--accent)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-h3" style={{ marginBottom: "4px" }}>
            {title}
          </h3>
          <p className="text-small">{subtitle}</p>
        </div>
      </div>
      <ArrowRight size={20} color="var(--text-muted)" />
    </div>
  );
}

function QrIcon() {
  // QR icon source was missing/undefined (QrCode was not defined).
  // Use a safe placeholder icon to prevent runtime crashes.
  return <FileText size={22} color="var(--primary-dark)" />;
}


export default Dashboard;

