import React from "react";
import { useTheme } from "../ThemeProvider";

/**
 * Enterprise Tabs Component
 * @param {Array} tabs - Array of { id, label, icon: IconComponent, badge: number/string }
 * @param {String} activeTab - Currently active tab id
 * @param {Function} onChange - Callback when tab changes
 */
export function Tabs({ tabs, activeTab, onChange }) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <div className="w-full">
      <div 
        className="flex overflow-x-auto hide-scrollbar border-b"
        style={{ borderColor: colors.border.default || "#202B45" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="group relative min-w-fit flex items-center gap-2 transition-colors cursor-pointer"
              style={{
                padding: `${spacing.md || "16px"} ${spacing.lg || "20px"}`,
                fontSize: typography.sizes.sm || "14px",
                fontWeight: typography.weights.bold,
                color: isActive ? (colors.accent.primary || "#22C55E") : (colors.text.secondary || "#94A3B8"),
                background: "transparent",
                border: "none",
                fontFamily: typography.fontFamily,
                outline: "none",
              }}
            >
              {Icon && (
                <Icon
                  size={18}
                  style={{
                    color: isActive ? (colors.accent.primary || "#22C55E") : (colors.text.secondary || "#94A3B8"),
                    transition: "color 150ms ease",
                  }}
                />
              )}
              {tab.label}
              
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  style={{
                    marginLeft: spacing.xs || "8px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: typography.weights.bold,
                    borderRadius: radius.full || "9999px",
                    background: isActive ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.08)",
                    color: isActive ? (colors.accent.primary || "#22C55E") : (colors.text.secondary || "#94A3B8"),
                  }}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{
                    background: colors.accent.primary || "#22C55E",
                    boxShadow: "0 -2px 10px rgba(34, 197, 94, 0.4)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;
