import React from "react";
import { COLORS } from "../../constants/theme";

export const StatusBadge = React.memo(({
  status = "",
  label,
  className = ""
}) => {
  const normalizedStatus = String(status).toLowerCase().trim();
  
  const getBadgeConfig = () => {
    switch (normalizedStatus) {
      case "active":
      case "paid":
      case "approved":
      case "success":
      case "resolved":
        return { text: COLORS.success, bg: COLORS.successBg, border: "rgba(5, 150, 105, 0.2)" };
      
      case "trial":
      case "pending":
      case "in_progress":
      case "partial":
      case "warning":
        return { text: COLORS.warning, bg: COLORS.warningBg, border: "rgba(217, 119, 6, 0.2)" };
      
      case "expired":
      case "suspended":
      case "failed":
      case "error":
      case "disabled":
      case "rejected":
        return { text: COLORS.error, bg: COLORS.errorBg, border: "rgba(220, 38, 38, 0.2)" };
      
      default:
        return { text: COLORS.textSecondary, bg: "rgba(255,255,255,0.04)", border: COLORS.border };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border select-none ${className}`}
      style={{
        color: config.text,
        background: config.bg,
        borderColor: config.border
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: config.text }} />
      {label || status}
    </span>
  );
});

export default StatusBadge;
