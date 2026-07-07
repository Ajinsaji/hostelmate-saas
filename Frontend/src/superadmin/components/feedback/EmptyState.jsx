import React from "react";
import { Inbox } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const EmptyState = React.memo(({
  title = "No data available",
  description = "There are no entries to display in this list yet.",
  icon = <Inbox size={48} />,
  action,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-[24px] ${className}`}
      style={{ borderColor: COLORS.border, background: "rgba(23, 32, 51, 0.2)" }}
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
        style={{ 
          borderColor: COLORS.border, 
          background: COLORS.surfaceLight,
          color: COLORS.textMuted
        }}
      >
        {icon}
      </div>
      
      <h4 className="text-sm font-bold mb-1" style={{ color: COLORS.textMain }}>
        {title}
      </h4>
      <p className="text-xs max-w-xs leading-relaxed mb-5" style={{ color: COLORS.textMuted }}>
        {description}
      </p>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});

export default EmptyState;
