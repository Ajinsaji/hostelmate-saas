import React from "react";
import { BadgeCheck, Clock, Crown, ShieldAlert } from "lucide-react";

const styles = {
  active: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-100",
    border: "border-emerald-400/30",
    icon: <BadgeCheck className="w-4 h-4" />,
  },
  expiringSoon: {
    bg: "bg-amber-500/15",
    text: "text-amber-100",
    border: "border-amber-400/30",
    icon: <Clock className="w-4 h-4" />,
  },
  expired: {
    bg: "bg-rose-500/15",
    text: "text-rose-100",
    border: "border-rose-400/35",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  trial: {
    bg: "bg-sky-500/15",
    text: "text-sky-100",
    border: "border-sky-400/30",
    icon: <Crown className="w-4 h-4" />,
  },
  freeAccess: {
    bg: "bg-violet-500/15",
    text: "text-violet-100",
    border: "border-violet-400/30",
    icon: <Crown className="w-4 h-4" />,
  },
};

export default function SubscriptionStatusBadge({ status }) {
  const s = styles[status] || styles.active;
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
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-wide ${s.bg} ${s.text} ${s.border} shadow-[0_8px_30px_-20px_rgba(255,255,255,0.45)]`}
      style={{
        minHeight: 42,
      }}
    >
      <span className="opacity-95">{s.icon}</span>
      <span className="uppercase">{label}</span>
    </div>
  );
}

