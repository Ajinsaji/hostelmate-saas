import React, { memo } from "react";
import { Card } from "./Card";
import { MoreVertical } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export const MobileCard = memo(function MobileCard({
  avatar,
  title,
  subtitle,
  badge,
  onClick,
  onMenuClick,
  children,
  className = ""
}) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Card
      onClick={onClick}
      hover={!!onClick}
      className={`w-full ${className}`}
      padding="md"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.md || "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md || "16px", minWidth: 0, flex: 1 }}>
          {avatar && <div style={{ flexShrink: 0 }}>{avatar}</div>}

          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 
              style={{ 
                fontSize: typography.sizes.sm || "14px", 
                fontWeight: typography.weights.bold, 
                color: colors.text.primary || "#FFFFFF", 
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {title}
            </h4>

            {subtitle && (
              <p 
                style={{ 
                  fontSize: "12px", 
                  color: colors.text.secondary || "#94A3B8", 
                  margin: "2px 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: spacing.xs || "8px", flexShrink: 0 }}>
          {badge}

          {onMenuClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick(e);
              }}
              aria-label="Actions menu"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                background: "transparent",
                border: "none",
                color: colors.text.secondary || "#94A3B8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <MoreVertical size={18} />
            </button>
          )}
        </div>
      </div>

      {children && (
        <div style={{ marginTop: spacing.md || "16px", paddingTop: spacing.sm || "12px", borderTop: `1px solid ${colors.border.default || "#202B45"}` }}>
          {children}
        </div>
      )}
    </Card>
  );
});

export default MobileCard;
