import React from "react";
import { COLORS } from "../../constants/theme";

export const ActivityItem = React.memo(({
  title,
  description,
  timestamp,
  icon,
  badgeText,
  badgeVariant = "info",
  isLast = false
}) => {
  const getBadgeColors = () => {
    switch (badgeVariant) {
      case "success": return { text: COLORS.success, bg: COLORS.successBg };
      case "warning": return { text: COLORS.warning, bg: COLORS.warningBg };
      case "error": return { text: COLORS.error, bg: COLORS.errorBg };
      case "info":
      default: return { text: COLORS.info, bg: COLORS.infoBg };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <div className="flex gap-4 relative">
      {/* Visual Line */}
      {!isLast && (
        <div 
          className="absolute left-5 top-10 bottom-0 w-[2px]" 
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      )}

      {/* Icon node */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border z-10"
        style={{ 
          borderColor: COLORS.border, 
          background: COLORS.surface,
          color: COLORS.textSecondary
        }}
      >
        {icon || <span className="w-2 h-2 rounded-full bg-white/40" />}
      </div>

      {/* Body content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex justify-between items-start gap-4 mb-1">
          <h5 className="text-xs font-bold leading-normal truncate" style={{ color: COLORS.textMain }}>
            {title}
          </h5>
          {timestamp && (
            <span className="text-[10px] shrink-0 font-medium" style={{ color: COLORS.textMuted }}>
              {timestamp}
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-[11px] leading-relaxed mb-2" style={{ color: COLORS.textSecondary }}>
            {description}
          </p>
        )}

        {badgeText && (
          <span 
            className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ color: badgeColors.text, background: badgeColors.bg }}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
});

export const Timeline = React.memo(({
  items = [],
  className = ""
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-6 text-center text-xs" style={{ color: COLORS.textMuted }}>
        No recent activities recorded.
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {items.map((item, idx) => (
        <ActivityItem
          key={item.id || idx}
          title={item.title}
          description={item.description}
          timestamp={item.timestamp}
          icon={item.icon}
          badgeText={item.badgeText}
          badgeVariant={item.badgeVariant}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
});

export default Timeline;
