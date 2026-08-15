import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Sparkles, ArrowRight, Lock } from "lucide-react";

export default function SubscriptionBanner({
  status = "trial",
  daysLeft = 30,
  trialEndDate = null,
  expiryDate = null,
  warningLevel = "none",
  renewalRequired = false,
  isTrial = true,
  onRequestContinuation,
}) {
  const navigate = useNavigate();

  const statusNormalized = (status || "").toLowerCase();
  const dLeft = typeof daysLeft === "number" ? Math.max(0, daysLeft) : null;
  const isExpired = statusNormalized === "expired" || (typeof daysLeft === "number" && daysLeft < 0);
  const targetDate = trialEndDate || expiryDate;
  const formattedDate = targetDate ? new Date(targetDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Soon";

  const handleRequestClick = () => {
    if (onRequestContinuation) {
      onRequestContinuation();
    } else {
      navigate("/owner/subscription");
    }
  };

  // 1. TRIAL / SUBSCRIPTION EXPIRED BANNER
  if (isExpired) {
    return (
      <div className="w-full rounded-3xl border border-rose-500/40 bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-rose-950/80 p-6 shadow-2xl backdrop-blur-xl text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 text-xl">
              <Lock />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Access Locked
                </span>
                <span className="text-xs text-rose-300/80 font-bold uppercase">Trial Ended {formattedDate}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">TRIAL EXPIRED</h3>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Your free 30-day trial has ended. To continue using HostelMate operations, please request subscription continuation.
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestClick}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition"
          >
            Request Subscription <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // 2. EXPIRING SOON TRIAL OR ACTIVE WARNING (7, 3, 1 Days)
  if (dLeft !== null && dLeft <= 7) {
    const isUrgent = dLeft <= 1;
    const isStrong = dLeft <= 3;

    return (
      <div
        className={`w-full rounded-3xl border p-5 shadow-xl backdrop-blur-xl ${
          isUrgent
            ? "border-rose-500/40 bg-rose-950/60 text-rose-100"
            : isStrong
            ? "border-amber-500/40 bg-amber-950/60 text-amber-100"
            : "border-amber-500/30 bg-slate-900/80 text-amber-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isUrgent ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"}`}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                {isTrial ? "Trial Expiry Alert" : "Subscription Expiry Alert"}
              </div>
              <div className="text-base font-black text-white mt-0.5">
                {isTrial
                  ? `YOUR TRIAL ENDS IN ${dLeft} DAY${dLeft === 1 ? "" : "S"}`
                  : `YOUR SUBSCRIPTION EXPIRES IN ${dLeft} DAY${dLeft === 1 ? "" : "S"}`}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                Please request continuation to avoid operational interruption (Ends {formattedDate}).
              </div>
            </div>
          </div>

          <button
            onClick={handleRequestClick}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition ${
              isUrgent
                ? "bg-rose-500 hover:bg-rose-400 text-white"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950"
            }`}
          >
            Request Continuation <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 3. NORMAL FREE TRIAL BANNER (> 7 days left)
  if (isTrial || statusNormalized === "trial") {
    return (
      <div className="w-full rounded-3xl border border-sky-500/30 bg-gradient-to-r from-[#0d1f3d]/90 via-[#0b1739]/90 to-[#0d1f3d]/90 p-5 shadow-xl backdrop-blur-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  FREE TRIAL
                </span>
                <span className="text-sm font-black text-sky-300">{dLeft !== null ? `${dLeft} DAYS LEFT` : "30 DAYS"}</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Your free HostelMate trial is active. All modules are unlocked. Trial ends: <b className="text-white">{formattedDate}</b>.
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/owner/subscription")}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/15 transition flex items-center gap-1.5"
          >
            View Subscription <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
