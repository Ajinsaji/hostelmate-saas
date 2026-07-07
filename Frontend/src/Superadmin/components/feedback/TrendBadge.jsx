import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const TrendBadge = React.memo(({
  value,
  direction = "neutral", // 'up' | 'down' | 'neutral'
  className = ""
}) => {
  const getStyle = () => {
    switch (direction) {
      case "up":
        return { text: COLORS.success, bg: COLORS.successBg, icon: <TrendingUp size={12} /> };
      case "down":
        return { text: COLORS.error, bg: COLORS.errorBg, icon: <TrendingDown size={12} /> };
      case "neutral":
      default:
        return { text: COLORS.textMuted, bg: "rgba(255,255,255,0.04)", icon: <Minus size={12} /> };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border select-none ${className}`}
      style={{
        color: style.text,
        background: style.bg,
        borderColor: direction === "up" ? "rgba(5, 150, 105, 0.2)" : direction === "down" ? "rgba(220, 38, 38, 0.2)" : "rgba(255,255,255,0.08)"
      }}
    >
      {style.icon}
      {value}
    </span>
  );
});

export default TrendBadge;
