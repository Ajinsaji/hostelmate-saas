import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Phone,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  LogIn,
  RotateCw,
  Home,
  ShieldCheck,
  Calendar,
  User,
} from "lucide-react";
import { api } from "../services/api";

const statusConfig = {
  pending: {
    title: "Application Under Review",
    badge: "Under Review",
    badgeClass: "bg-amber-500/20 border-amber-500/30 text-amber-300",
    icon: Clock,
    iconColor: "text-amber-400",
    stepIndex: 1,
    description: "Your hostel application has been submitted and is currently under review by our compliance team.",
  },
  approved: {
    title: "Documents Approved — Activation Pending",
    badge: "Approved",
    badgeClass: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
    icon: ShieldCheck,
    iconColor: "text-emerald-400",
    stepIndex: 2,
    description: "Your documentation has been approved. The administrator is currently provisioning your subscription and access credentials.",
  },
  activation_pending: {
    title: "Waiting For Final Activation",
    badge: "Activation Pending",
    badgeClass: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    icon: Zap,
    iconColor: "text-blue-400",
    stepIndex: 2,
    description: "Your hostel setup is verified. Credentials and subscription activation are being finalized.",
  },
  activated: {
    title: "Hostel Activated — Ready for Login",
    badge: "Activated",
    badgeClass: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    stepIndex: 3,
    description: "Congratulations! Your hostel workspace is active. You can now login using your registered phone number.",
  },
  rejected: {
    title: "Application Rejected",
    badge: "Rejected",
    badgeClass: "bg-rose-500/20 border-rose-500/30 text-rose-300",
    icon: XCircle,
    iconColor: "text-rose-400",
    stepIndex: 1,
    description: "Your application could not be approved at this time. Please check the rejection reason below.",
  },
};

export default function RequestStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [phoneInput, setPhoneInput] = useState("");
  const [activePhone, setActivePhone] = useState("");
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedOnce, setSearchedOnce] = useState(false);

  // Initialize phone from URL query (?phone=...) or localStorage
  useEffect(() => {
    const queryPhone = searchParams.get("phone") || searchParams.get("phone_number");
    const storedPhone = localStorage.getItem("hostelRequestPhone");
    const initial = (queryPhone || storedPhone || "").trim();

    if (initial) {
      setPhoneInput(initial);
      setActivePhone(initial);
      fetchStatus(initial);
    }
  }, [searchParams]);

  const fetchStatus = useCallback(async (phoneToSearch) => {
    const raw = String(phoneToSearch || "").trim();
    if (!raw) {
      setError("Please enter your registered phone number.");
      return;
    }

    setLoading(true);
    setError("");
    setSearchedOnce(true);

    try {
      // Direct public endpoint call
      const clean = raw.replace(/\D/g, "");
      const res = await api.get(`/api/hostel-request/status/${encodeURIComponent(clean || raw)}`);

      if (res.data?.success) {
        setStatusData(res.data);
        localStorage.setItem("hostelRequestPhone", raw);
        if (res.data.requestId) {
          localStorage.setItem("hostelRequestId", res.data.requestId);
        }
      } else {
        setStatusData(null);
        setError(res.data?.message || "No application found for this phone number.");
      }
    } catch (err) {
      setStatusData(null);
      const msg = err.response?.data?.message || "No application found for this phone number. Please verify and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (phoneInput.trim()) {
      setActivePhone(phoneInput.trim());
      fetchStatus(phoneInput.trim());
    }
  };

  const statusInfo = statusData?.status ? statusConfig[statusData.status] || statusConfig.pending : null;
  const submittedDate = statusData?.submittedAt ? new Date(statusData.submittedAt) : null;

  return (
    <div className="min-h-screen bg-[#081028] text-white flex flex-col font-sans relative selection:bg-emerald-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition cursor-pointer"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            HostelMate Enterprise
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <LogIn size={14} className="text-emerald-400" />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6 relative z-10">
        {/* Page Hero Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Public Application Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Track Application Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Check your hostel registration, compliance review, and system activation progress in real time.
          </p>
        </div>

        {/* Live Search Card */}
        <div className="bg-slate-900/80 border border-[#202B45] rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enter Registered Mobile Number
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !phoneInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Track Status</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-200">Application Not Found</p>
                <p className="text-rose-300/80 leading-relaxed">{error}</p>
                <button
                  onClick={() => navigate("/register")}
                  className="mt-2 text-xs font-bold text-rose-300 underline hover:text-white transition"
                >
                  Register a new hostel application →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Status Result Display */}
        {statusData?.success && statusInfo && (
          <div className="space-y-6 animate-scale-up">
            {/* Status Summary Banner */}
            <div className="bg-slate-900/90 border border-[#202B45] rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0`}>
                    <statusInfo.icon size={26} className={statusInfo.iconColor} />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                      {statusInfo.badge}
                    </span>
                    <h2 className="text-lg font-black text-white mt-1">
                      {statusInfo.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => fetchStatus(activePhone)}
                  disabled={loading}
                  className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw size={13} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {statusInfo.description}
              </p>

              {/* Progress Stepper */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className={`p-3 rounded-xl border text-center transition ${statusInfo.stepIndex >= 1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <span className="text-[10px] font-extrabold uppercase block tracking-wider">Step 1</span>
                  <span className="text-xs font-bold">Submission</span>
                </div>
                <div className={`p-3 rounded-xl border text-center transition ${statusInfo.stepIndex >= 2 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <span className="text-[10px] font-extrabold uppercase block tracking-wider">Step 2</span>
                  <span className="text-xs font-bold">Review & Plan</span>
                </div>
                <div className={`p-3 rounded-xl border text-center transition ${statusInfo.stepIndex >= 3 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <span className="text-[10px] font-extrabold uppercase block tracking-wider">Step 3</span>
                  <span className="text-xs font-bold">Active Login</span>
                </div>
              </div>

              {/* Application Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building size={13} className="text-slate-500" /> Hostel Name
                  </span>
                  <p className="text-sm font-bold text-white mt-1">
                    {statusData.hostelName || "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-500" /> Registered Phone
                  </span>
                  <p className="text-sm font-bold font-mono text-white mt-1">
                    {statusData.phone || "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-500" /> Submitted Date
                  </span>
                  <p className="text-xs font-semibold text-slate-300 mt-1">
                    {submittedDate ? submittedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-slate-500" /> Lifecycle Status
                  </span>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">
                    {statusData.status || "—"}
                  </p>
                </div>
              </div>

              {/* Action Trigger Card */}
              {statusData.status === "activated" ? (
                <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-center space-y-3">
                  <p className="text-xs font-semibold text-emerald-200">
                    Your hostel workspace has been activated. You can now login to manage rooms, residents, and billing.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                  >
                    Login to Owner Dashboard
                  </button>
                </div>
              ) : statusData.status === "rejected" ? (
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
                  <p className="text-xs text-rose-300">
                    {statusData.rejectionReason || "Your application was rejected during compliance verification."}
                  </p>
                  <button
                    onClick={() => navigate("/register")}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition cursor-pointer"
                  >
                    Submit New Application
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    Need help with your application? Contact our administrator support desk.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back to Login Footer Link */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Login Screen</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} HostelMate Enterprise OS • All rights reserved.</p>
      </footer>
    </div>
  );
}
