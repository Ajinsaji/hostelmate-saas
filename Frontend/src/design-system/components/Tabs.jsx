import React from "react";
import clsx from "clsx";
import { useTheme } from "../ThemeProvider";

/**
 * Enterprise Tabs Component
 * @param {Array} tabs - Array of { id, label, icon: IconComponent, badge: number/string }
 * @param {String} activeTab - Currently active tab id
 * @param {Function} onChange - Callback when tab changes
 */
export default function Tabs({ tabs, activeTab, onChange }) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <div className="w-full">
      <div 
        className="flex overflow-x-auto hide-scrollbar"
        style={{ borderBottom: `1px solid ${colors.border.default}` }}
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
                padding: `${spacing.md} ${spacing.lg}`,
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.medium,
                color: isActive ? colors.accent.primary : colors.text.secondary,
                background: 'transparent',
                border: 'none',
                fontFamily: typography.fontFamily,
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = colors.text.primary;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = colors.text.secondary;
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {Icon && (
                <Icon
                  size={18}
                  style={{
                    color: isActive ? colors.accent.primary : colors.text.muted,
                    transition: 'color 200ms ease',
                  }}
                />
              )}
              {tab.label}
              
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  style={{
                    marginLeft: spacing.xs,
                    padding: '2px 8px',
                    fontSize: typography.sizes.xs,
                    fontWeight: typography.weights.semibold,
                    borderRadius: radius.full,
                    background: isActive ? 'rgba(22, 163, 74, 0.15)' : colors.background.elevated,
                    color: isActive ? colors.accent.primary : colors.text.muted,
                  }}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{
                    background: colors.accent.primary,
                    boxShadow: '0 -2px 10px rgba(22, 163, 74, 0.4)',
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

