import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

const bannerStyles = {
  medium: {
    icon: <AlertTriangle className="w-5 h-5" />, 
    container:
      "border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-orange-500/5 text-orange-50",
  },
  critical: {
    icon: <AlertTriangle className="w-5 h-5" />,
    container:
      "border border-red-500/40 bg-gradient-to-br from-red-500/18 to-red-500/6 text-red-50",
  },
  expired: {
    icon: <AlertTriangle className="w-5 h-5" />,
    container:
      "border border-red-600/50 bg-gradient-to-br from-red-600/18 to-red-600/6 text-red-50",
  },
};

export default function SubscriptionBanner({ status, daysLeft, warningLevel, renewalRequired }) {
  if (status === "active" || status === "trial" || status === "freeAccess") return null;

  if (status === "expired" || warningLevel === "critical") {
    const level = "critical";
    const msg =
      status === "expired"
        ? "Subscription expired.\nRenew to continue dashboard access."
        : "Your HostelMate subscription expires soon.\nImmediate renewal recommended.";

    const s = bannerStyles[level];

    return (
      <div
        className={`w-full rounded-2xl p-4 backdrop-blur-md transition-all duration-300 shadow-[0_0_0_1px_rgba(255,0,0,0.1)] ${s.container}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-red-200">{s.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold leading-5 whitespace-pre-line">
              {msg}
            </div>
            {renewalRequired && (
              <div className="mt-2 text-xs text-red-100/90">
                Renewal recommended to keep uninterrupted access.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // medium
  if (warningLevel === "medium") {
    const s = bannerStyles.medium;
    const days = typeof daysLeft === "number" ? daysLeft : "X";

    return (
      <div
        className={`w-full rounded-2xl p-4 backdrop-blur-md transition-all duration-300 shadow-[0_0_0_1px_rgba(255,168,0,0.12)] ${s.container}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-orange-200">{s.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold leading-5 whitespace-pre-line">
              Your subscription expires in {days} days.\nRenew now to avoid dashboard interruption.
            </div>
            <div className="mt-2 text-xs text-orange-100/90">
              Keep your hostel operations running without downtime.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // fallback
  return null;
}

