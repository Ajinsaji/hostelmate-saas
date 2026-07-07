import React from "react";
import SaaSCard from "./SaaSCard";
import { COLORS } from "../../constants/theme";

export const MetricCard = React.memo(({
  title,
  value,
  percentage, // 0 to 100
  progressColor = COLORS.primaryLight,
  infoText,
  className = ""
}) => {
  return (
    <SaaSCard hoverable={false} className={`p-5 flex flex-col justify-between ${className}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>
          {title}
        </p>
        <div className="flex justify-between items-baseline mb-3">
          <h4 className="text-xl font-bold" style={{ color: COLORS.textMain }}>
            {value}
          </h4>
          {percentage !== undefined && (
            <span className="text-xs font-bold" style={{ color: progressColor }}>
              {percentage}%
            </span>
          )}
        </div>
        
        {percentage !== undefined && (
          <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ 
                width: `${Math.min(100, Math.max(0, percentage))}%`,
                background: progressColor
              }} 
            />
          </div>
        )}
      </div>

      {infoText && (
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          {infoText}
        </p>
      )}
    </SaaSCard>
  );
});

export default MetricCard;
