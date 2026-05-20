import React from "react";
import { CalendarDays, RotateCcw } from "lucide-react";

function statusColor(status) {
  if (status === "expired") return { ring: "ring-rose-500/20", text: "text-rose-100", bar: "from-rose-500 to-rose-400" };
  if (status === "expiringSoon") return { ring: "ring-amber-500/20", text: "text-amber-100", bar: "from-amber-500 to-amber-400" };
  if (status === "trial") return { ring: "ring-sky-500/20", text: "text-sky-100", bar: "from-sky-500 to-sky-400" };
  if (status === "freeAccess") return { ring: "ring-violet-500/20", text: "text-violet-100", bar: "from-violet-500 to-violet-400" };
  return { ring: "ring-emerald-500/20", text: "text-emerald-100", bar: "from-emerald-500 to-emerald-400" };
}

export default function SubscriptionProgressCard({ status, daysLeft, expiryDate, renewalRequired }) {
  const pct = (() => {
    if (status === "expired") return 0;
    if (status === "expiringSoon") return 35;
    if (status === "trial") return 50;
    if (status === "freeAccess") return 100;
    if (status === "active") return 85;
    return 25;
  })();

  const formattedExpiry = expiryDate ? new Date(expiryDate).toLocaleDateString("en-GB") : "—";
  const color = statusColor(status);
  const label =
    status === "freeAccess"
      ? "Free Access"
      : status === "expiringSoon"
      ? "Expiring Soon"
      : status === "trial"
      ? "Trial"
      : status === "active"
      ? "Active"
      : status;

  return (
    <div className={`rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl ${color.ring}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Subscription summary</div>
          <div className="mt-3 text-2xl font-bold text-white">{label}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 px-4 py-3 text-sm font-semibold text-white shadow-sm">
          {typeof daysLeft === "number" ? `${daysLeft} days left` : "No expiry set"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">Plan</div>
          <div className="mt-2 text-lg font-semibold text-white">{status === "trial" ? "Trial" : status === "freeAccess" ? "Free Access" : "HostelMate"}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">Expiry date</div>
          <div className="mt-2 text-lg font-semibold text-white">{formattedExpiry}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-semibold text-white/75">
          <span>Status</span>
          <span className="capitalize">{label}</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {renewalRequired && (
        <button
          type="button"
          className="mt-6 w-full rounded-3xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110"
        >
          <RotateCcw className="mr-2 inline-block h-4 w-4" />
          Renew now
        </button>
      )}
    </div>
  );
}

