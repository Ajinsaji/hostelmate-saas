import {
  BedDouble,
  Users,
  Wallet,
  FileText,
  Bell,
  ArrowRight,
  IndianRupee,
  Settings,
  CalendarDays,
  Clock3,
  Sparkles,
  CheckCircle2,
  Circle,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";
import BottomNav from "../components/BottomNav";
import DashboardLayout from "./DashboardLayout";

import useGlobalPolling from "../hooks/useGlobalPolling";
import useOwnerRealtimeSync from "../hooks/useOwnerRealtimeSync";
import SubscriptionBanner from "../components/SubscriptionBanner";

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

  const subscriptionStatus =
    subscriptionState?.status || hostel?.subscriptionStatus || "inactive";
  const subscriptionEndDate =
    hostel?.subscriptionEndDate || subscriptionState?.subscriptionEndDate || "";
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

  const formatMetricValue = (value, fallback = "—") => {
    if (value === null || value === undefined || value === "-" || value === "") {
      return fallback;
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return `${value}`;
  };

  const metricCards = useMemo(
    () => [
      {
        title: "Residents",
        value: formatMetricValue(stats.residents),
        helper: "Live resident count",
        icon: <Users size={22} className="text-emerald-600" />,
        onClick: () => navigate("/residents"),
      },
      {
        title: "Rooms",
        value: formatMetricValue(stats.rooms),
        helper: "Available room inventory",
        icon: <BedDouble size={22} className="text-emerald-600" />,
        onClick: () => navigate("/rooms"),
      },
      {
        title: "Occupancy",
        value: `${formatMetricValue(stats.occupancyRate, "0")}%`,
        helper: "Capacity in use",
        icon: <ShieldCheck size={22} className="text-emerald-600" />,
        onClick: () => navigate("/rooms"),
      },
      {
        title: "Today's Collection",
        value: `₹${formatMetricValue(stats.todayCollection, "0")}`,
        helper: "Payments received today",
        icon: <IndianRupee size={22} className="text-emerald-600" />,
        onClick: () => navigate("/payments"),
      },
      {
        title: "Pending Rent",
        value: `₹${formatMetricValue(stats.pendingRent, "0")}`,
        helper: "Outstanding dues",
        icon: <Wallet size={22} className="text-emerald-600" />,
        onClick: () => navigate("/payments"),
      },
    ],
    [navigate, stats.pendingRent, stats.residents, stats.rooms, stats.occupancyRate, stats.todayCollection]
  );

  const quickActions = useMemo(
    () => [
      { title: "Add Room", description: "Create a new room", icon: <BedDouble size={22} />, onClick: () => navigate("/rooms") },
      { title: "Add Resident", description: "Register a new resident", icon: <Users size={22} />, onClick: () => navigate("/residents") },
      { title: "Collect Payment", description: "Review and collect rent", icon: <Wallet size={22} />, onClick: () => navigate("/payments") },
      { title: "Admissions", description: "Review new requests", icon: <FileText size={22} />, onClick: () => navigate("/admissions") },
      { title: "Reports", description: "Download reports", icon: <FileText size={22} />, onClick: () => navigate("/reports") },
      { title: "Profile", description: "Manage owner profile", icon: <Users size={22} />, onClick: () => navigate("/owner/profile") },
      { title: "Settings", description: "Hostel preferences", icon: <Settings size={22} />, onClick: () => navigate("/owner/settings") },
    ],
    [navigate]
  );

  const managementItems = useMemo(
    () => [
      { title: "Rooms", description: "Create and update room inventory", count: stats.rooms, href: "/rooms" },
      { title: "Residents", description: "Track roommates and occupancy", count: stats.residents, href: "/residents" },
      { title: "Payments", description: "Monitor collections and dues", count: stats.pendingRent, href: "/payments" },
      { title: "Reports", description: "Review hostel performance", count: "Live", href: "/reports" },
      { title: "Subscriptions", description: "Stay on top of renewals", count: subscriptionPlan, href: "/owner/settings" },
      { title: "Profile", description: "Owner details and preferences", count: "Edit", href: "/owner/profile" },
    ],
    [stats.pendingRent, stats.residents, stats.rooms, subscriptionPlan]
  );

  const activityCards = useMemo(
    () => [
      { title: "Latest Residents", description: "No activity yet. Start by adding your first resident.", href: "/residents" },
      { title: "Recent Payments", description: "No activity yet. Start by adding your first resident.", href: "/payments" },
      { title: "Pending Admissions", description: "No activity yet. Start by adding your first resident.", href: "/admissions" },
      { title: "Recent Notifications", description: "No activity yet. Start by adding your first resident.", href: "/admissions" },
    ],
    []
  );

  const isNewHostel = useMemo(() => {
    const hasNoRooms = Number(stats.rooms) === 0;
    const hasNoResidents = Number(stats.residents) === 0;
    return Boolean(hostel && (hostel?.isNewHostel || hostel?.isNew || hostel?.onboardingCompleted === false || (hasNoRooms && hasNoResidents)));
  }, [hostel, stats.residents, stats.rooms]);

  const formattedDate = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <DashboardLayout variant="owner" activePath="/owner/dashboard">
      <div className="space-y-6 pb-8">
        {!subscriptionLoading && subscriptionState && (
          <SubscriptionBanner
            status={subscriptionState.status}
            daysLeft={subscriptionState.daysLeft}
            warningLevel={subscriptionState.warningLevel}
            renewalRequired={subscriptionState.renewalRequired}
          />
        )}

        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <Sparkles size={16} />
                Daily operations overview
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">Welcome Back, {ownerName} 👋</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {hostel?.hostelName || "HostelMate Premium"}
              </h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Keep your hostel moving smoothly with one clear overview.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  <CalendarDays size={16} />
                  {formattedDate}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  <Clock3 size={16} />
                  {formattedTime}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  {hostel?.hostelStatus || "Active"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">
                  <Sparkles size={16} />
                  {subscriptionPlan}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                {ownerPhotoUrl ? (
                  <img
                    src={buildFileUrl(ownerPhotoUrl)}
                    alt="Owner"
                    className="h-14 w-14 rounded-2xl border border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                    {ownerName?.charAt(0)?.toUpperCase() || "H"}
                  </div>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Hostel owner</p>
                  <p className="text-sm font-semibold text-slate-800">{ownerName}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Open admissions"
                  onClick={() => navigate("/admissions")}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Bell size={18} className="mr-2 text-emerald-600" />
                  Admissions {pendingCount > 0 ? `(${pendingCount})` : ""}
                </button>
                <button
                  type="button"
                  aria-label="Open profile"
                  onClick={() => navigate("/owner/profile")}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Settings size={18} className="mr-2 text-emerald-600" />
                  Profile
                </button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="overview-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="overview-title" className="text-[22px] font-semibold text-slate-900">
                Today&apos;s Overview
              </h2>
              <p className="text-sm text-slate-500">A quick pulse of hostel operations.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="hidden text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 sm:inline-flex"
            >
              View reports
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricCards.map((card) => (
              <button
                key={card.title}
                type="button"
                aria-label={card.title}
                onClick={card.onClick}
                className="group flex min-h-[140px] flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                    {card.icon}
                  </div>
                  <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="quick-actions-title">
          <div className="mb-3">
            <h2 id="quick-actions-title" className="text-[22px] font-semibold text-slate-900">
              Quick Actions
            </h2>
            <p className="text-sm text-slate-500">Jump into the next task without friction.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                aria-label={action.title}
                onClick={action.onClick}
                className="group flex items-center justify-between rounded-[22px] border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{action.title}</p>
                    <p className="text-sm text-slate-500">{action.description}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="management-title">
          <div className="mb-3">
            <h2 id="management-title" className="text-[22px] font-semibold text-slate-900">
              Management
            </h2>
            <p className="text-sm text-slate-500">Keep the core hostel operations close at hand.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {managementItems.map((item) => (
              <button
                key={item.title}
                type="button"
                aria-label={item.title}
                onClick={() => navigate(item.href)}
                className="group rounded-[22px] border border-slate-200/80 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <ArrowRight size={18} className="mt-1 text-slate-400 transition group-hover:translate-x-0.5" />
                </div>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-500">Current count</span>
                  <span className="text-base font-semibold text-slate-900">{item.count}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[22px] font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-500">A simple view of what needs attention next.</p>
              </div>
            </div>

            <div className="space-y-3">
              {activityCards.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  aria-label={item.title}
                  onClick={() => navigate(item.href)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-emerald-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {isNewHostel && (
              <div className="rounded-[26px] border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Getting Started</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">A few essentials will make your hostel feel ready to manage.</p>

                <ul className="mt-4 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Hostel created
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Profile completed
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Circle size={18} className="text-slate-400" />
                    Add first room
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Circle size={18} className="text-slate-400" />
                    Add first resident
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Circle size={18} className="text-slate-400" />
                    Record first payment
                  </li>
                </ul>
              </div>
            )}

            <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Next best step</h3>
              <p className="mt-2 text-sm text-slate-600">
                Add your first resident to turn this overview into an active hostel.
              </p>
              <button
                type="button"
                onClick={() => navigate("/residents")}
                className="mt-4 inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start with residents
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </DashboardLayout>
  );
}

export default Dashboard;

