import React from "react";
import { COLORS } from "../constants/theme";

export const QuickActionsBar = React.memo(({
  children,
  className = ""
}) => {
  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-2xl border border-white/5 mb-6 overflow-x-auto ${className}`}
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wider shrink-0" style={{ color: COLORS.textMuted }}>
        Quick Actions:
      </span>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
});

export default QuickActionsBar;
