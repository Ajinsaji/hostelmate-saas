import React from "react";
import SaaSCard from "./SaaSCard";
import { COLORS } from "../../constants/theme";

export const StatCard = React.memo(({
  title,
  value,
  icon,
  trend,         // e.g., "+12.3%" or "-2.1%"
  trendDirection, // 'up' | 'down' | 'neutral'
  trendLabel,
  sparkline = [], // array of numbers for mini chart
  statusBadge,    // optional status badge element
  loading = false,
  onClick,
  className = ""
}) => {
  const isUp = trendDirection === "up" || (trend && trend.startsWith("+"));
  const isDown = trendDirection === "down" || (trend && trend.startsWith("-"));
  
  const trendColor = isUp 
    ? COLORS.success 
    : isDown 
      ? COLORS.error 
      : COLORS.textMuted;

  const trendBg = isUp 
    ? COLORS.successBg 
    : isDown 
      ? COLORS.errorBg 
      : "rgba(255,255,255,0.04)";

  // Generate SVG path for sparkline points
  const getSparklinePath = (points) => {
    if (!points || points.length < 2) return "";
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min === 0 ? 1 : max - min;
    const w = 80;
    const h = 24;
    const pad = 2;
    
    return points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * (w - pad * 2) + pad;
      const y = h - ((p - min) / range) * (h - pad * 2) - pad;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  return (
    <SaaSCard 
      onClick={onClick}
      hoverable={!!onClick}
      className={`p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex justify-between items-start mb-3 select-none">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-white/5 animate-pulse rounded mt-2" />
          ) : (
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1" style={{ color: COLORS.textMain }}>
              {value}
            </h3>
          )}
        </div>
        {icon && (
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
            style={{ 
              borderColor: COLORS.border, 
              background: COLORS.surfaceLight 
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {!loading && (
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex flex-col gap-1">
            {trend && (
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-bold border w-max select-none"
                style={{ 
                  color: trendColor, 
                  background: trendBg,
                  borderColor: isUp ? "rgba(5, 150, 105, 0.15)" : isDown ? "rgba(220, 38, 38, 0.15)" : "rgba(255,255,255,0.06)"
                }}
              >
                {trend}
              </span>
            )}
            {trendLabel && (
              <span className="text-[9px] select-none" style={{ color: COLORS.textMuted }}>
                {trendLabel}
              </span>
            )}
          </div>

          {/* Mini Sparkline Chart */}
          {sparkline && sparkline.length > 1 && (
            <div className="h-6 w-20 shrink-0 opacity-80 hover:opacity-100 transition-opacity duration-200">
              <svg className="w-full h-full" viewBox="0 0 80 24" preserveAspectRatio="none">
                <path
                  d={getSparklinePath(sparkline)}
                  fill="none"
                  stroke={isUp ? COLORS.success : isDown ? COLORS.error : COLORS.textMuted}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {statusBadge}
        </div>
      )}
    </SaaSCard>
  );
});

export default StatCard;
