import React from "react";
import { AlertTriangle } from "lucide-react";
import { formatSubscriptionStatus } from "../utils/subscriptionFormatter";

const bannerStyles = {
  critical: {
    icon: <AlertTriangle className="w-5 h-5" />,
    container: "border border-rose-500/35 bg-gradient-to-br from-rose-500/15 to-rose-500/06 text-rose-100",
  },
  medium: {
    icon: <AlertTriangle className="w-5 h-5" />,
    container: "border border-amber-500/35 bg-gradient-to-br from-amber-500/15 to-amber-500/06 text-amber-100",
  },
};

export default function SubscriptionBanner({ status, daysLeft, warningLevel, renewalRequired }) {
  const statusStr = formatSubscriptionStatus({ status, daysLeft, warningLevel, renewalRequired });
  
  const statusNormalized = (status || "").toLowerCase();
  if (statusNormalized === "active" || statusNormalized === "unlimited" || statusNormalized === "lifetime") {
    return null;
  }

  const isCritical = statusNormalized === "expired" || warningLevel === "critical" || renewalRequired === true;
  const s = isCritical ? bannerStyles.critical : bannerStyles.medium;
  const title = isCritical ? "Urgent subscription alert" : "Renewal reminder";
  const desc = isCritical ? "Renewal is required to keep hostel operations running." : "Renew now to keep HostelMate dashboard access uninterrupted.";

  return (
    <div className={`w-full rounded-[28px] border p-5 shadow-lg backdrop-blur-xl ${s.container}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isCritical ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200'} shadow-sm`}>
          {s.icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{title}</div>
          <div className="mt-2 text-base font-semibold leading-7 text-white">{statusStr}</div>
          <div className="mt-2 text-sm opacity-90">{desc}</div>
        </div>
      </div>
    </div>
  );
}
