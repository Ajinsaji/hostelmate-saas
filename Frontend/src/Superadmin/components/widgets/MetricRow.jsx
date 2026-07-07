import React from "react";
import { COLORS } from "../../constants/theme";

export const MetricRow = React.memo(({
  label,
  value,
  description,
  trend,
  trendDirection = "neutral",
  className = ""
}) => {
  const isUp = trendDirection === "up";
  const isDown = trendDirection === "down";
  const trendColor = isUp ? COLORS.success : isDown ? COLORS.error : COLORS.textMuted;

  return (
    <div 
      className={`flex items-center justify-between py-3 border-b border-white/5 last:border-b-0 gap-4 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold" style={{ color: COLORS.textSecondary }}>
          {label}
        </p>
        {description && (
          <p className="text-[11px] truncate mt-0.5" style={{ color: COLORS.textMuted }}>
            {description}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold" style={{ color: COLORS.textMain }}>
          {value}
        </span>
        {trend && (
          <span 
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ 
              color: trendColor, 
              background: isUp ? COLORS.successBg : isDown ? COLORS.errorBg : "rgba(255,255,255,0.04)"
            }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
});

export default MetricRow;
