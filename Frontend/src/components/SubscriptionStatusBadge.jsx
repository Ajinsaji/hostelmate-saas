import React from "react";
import { BadgeCheck, Clock, Crown, ShieldAlert } from "lucide-react";

const styles = {
  active: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-200",
    border: "border-emerald-400/30",
    icon: <BadgeCheck className="w-4 h-4" />,
  },
  expiringSoon: {
    bg: "bg-orange-500/15",
    text: "text-orange-200",
    border: "border-orange-400/30",
    icon: <Clock className="w-4 h-4" />,
  },
  expired: {
    bg: "bg-rose-500/15",
    text: "text-rose-200",
    border: "border-rose-400/35",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  trial: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-200",
    border: "border-cyan-400/30",
    icon: <Crown className="w-4 h-4" />,
  },
  freeAccess: {
    bg: "bg-violet-500/15",
    text: "text-violet-200",
    border: "border-violet-400/30",
    icon: <Crown className="w-4 h-4" />,
  },
};

export default function SubscriptionStatusBadge({ status }) {
  const s = styles[status] || styles.active;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all duration-300 ${s.bg} ${s.text} ${s.border}`}
      style={{
        boxShadow:
          status === "expired"
            ? "0 0 0 1px rgba(244,63,94,0.15), 0 0 30px rgba(244,63,94,0.12)"
            : status === "expiringSoon"
              ? "0 0 0 1px rgba(251,146,60,0.15), 0 0 30px rgba(251,146,60,0.10)"
              : "0 0 0 1px rgba(16,185,129,0.15), 0 0 30px rgba(16,185,129,0.08)",
      }}
    >
      <span className="opacity-95">{s.icon}</span>
      <span className="text-xs font-semibold tracking-wide capitalize whitespace-nowrap">
        {status === "freeAccess" ? "Free Access" : status === "expiringSoon" ? "Expiring" : status}
      </span>
    </div>
  );
}

