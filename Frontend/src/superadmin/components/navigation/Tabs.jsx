import React from "react";
import { COLORS } from "../../constants/theme";

export const Tabs = React.memo(({
  tabs = [], // array of { id, label, icon }
  activeTab,
  onChange,
  className = ""
}) => {
  return (
    <div 
      className={`flex items-center gap-1 overflow-x-auto p-1 rounded-2xl border ${className}`}
      style={{
        background: "rgba(11, 17, 32, 0.4)",
        borderColor: COLORS.border
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange && onChange(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all duration-200 select-none ${
              isActive 
                ? "shadow-sm" 
                : "hover:text-white"
            }`}
            style={{
              background: isActive ? COLORS.primary : "transparent",
              color: isActive ? COLORS.textMain : COLORS.textMuted
            }}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});

export default Tabs;
