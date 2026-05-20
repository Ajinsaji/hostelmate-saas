import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

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
  if (status === "active" || status === "trial" || status === "freeAccess") return null;

  const days = typeof daysLeft === "number" ? daysLeft : "a few";

  if (status === "expired" || warningLevel === "critical") {
    const s = bannerStyles.critical;
    const message =
      status === "expired"
        ? "Your subscription has expired. Renew now to keep dashboard access."
        : "Your subscription expires very soon. Renew immediately to avoid disruption.";

    return (
      <div className={`w-full rounded-[28px] border p-5 shadow-lg backdrop-blur-xl ${s.container}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200 shadow-sm">
            {s.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Urgent subscription alert</div>
            <div className="mt-2 text-base font-semibold leading-7 text-white">{message}</div>
            <div className="mt-2 text-sm text-rose-100/85">{renewalRequired ? "Renewal is required to keep hostel operations running." : "Please renew soon to avoid losing access."}</div>
          </div>
        </div>
      </div>
    );
  }

  if (warningLevel === "medium") {
    const s = bannerStyles.medium;

    return (
      <div className={`w-full rounded-[28px] border p-5 shadow-lg backdrop-blur-xl ${s.container}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200 shadow-sm">
            {s.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Renewal reminder</div>
            <div className="mt-2 text-base font-semibold leading-7 text-white">Your subscription expires in {days} days.</div>
            <div className="mt-2 text-sm text-amber-100/85">Renew now to keep HostelMate dashboard access uninterrupted.</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

