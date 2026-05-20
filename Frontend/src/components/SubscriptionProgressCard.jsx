import React from "react";
import { CalendarDays, RotateCcw } from "lucide-react";

function progressColor(status) {
  if (status === "expired") return "from-rose-500/25 to-rose-500/10";
  if (status === "expiringSoon" || status === "active") return "from-orange-500/25 to-orange-500/10";
  if (status === "trial") return "from-cyan-500/25 to-cyan-500/10";
  if (status === "freeAccess") return "from-violet-500/25 to-violet-500/10";
  return "from-emerald-500/20 to-emerald-500/10";
}

export default function SubscriptionProgressCard({ status, daysLeft, expiryDate, renewalRequired }) {
  // Progress heuristics (engine currently provides only daysLeft/status):
  // - critical/expired => low
  // - expiringSoon => mid
  // - active => high
  const pct = (() => {
    if (status === "expired") return 0;
    if (status === "expiringSoon") return 35;
    if (status === "trial") return 50;
    if (status === "freeAccess") return 100;
    if (status === "active") return 85;
    return 25;
  })();

  const barClass =
    status === "expired"
      ? "bg-gradient-to-r from-rose-500 to-rose-400"
      : status === "expiringSoon"
        ? "bg-gradient-to-r from-orange-500 to-orange-400"
        : "bg-gradient-to-r from-emerald-500 to-emerald-400";

  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString()
    : "—";

  return (
    <div className={`rounded-2xl p-5 backdrop-blur-md border border-white/10 bg-white/5 shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-white/70 tracking-wider uppercase">Subscription</div>
          <div className="mt-2 text-lg font-bold">Plan: {status === "trial" ? "Trial" : "HostelMate"}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border border-white/10 ${progressColor(status)} text-white/90 shadow-[0_0_25px_rgba(255,255,255,0.05)]`}
        >
          <div className="text-xs font-semibold">{typeof daysLeft === "number" ? `${daysLeft} days remaining` : "—"}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <CalendarDays className="w-4 h-4" />
          <span>Expiry: {formattedExpiry}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/80">
          <span className="font-semibold">Progress</span>
          <span>{pct}%</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full ${barClass} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-3 text-xs text-white/60">
          Status: {status === "freeAccess" ? "Free Access" : status}
        </div>
      </div>

      {renewalRequired && (
        <button
          type="button"
          className="mt-5 w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Renew now
        </button>
      )}
    </div>
  );
}

