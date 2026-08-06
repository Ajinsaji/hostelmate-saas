import React from "react";
import { useTheme } from "../ThemeProvider";
import { ChevronRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionClick,
  actionHref,
  className = ""
}) {
  const { colors, typography } = useTheme();

  return (
    <div 
      className={`flex items-center justify-between w-full mb-3 ${className}`}
      style={{ fontFamily: typography.fontFamily }}
    >
      <div>
        <h3 
          style={{ 
            fontSize: typography.sizes.md || "16px", 
            fontWeight: typography.weights.bold, 
            color: colors.text.primary || "#FFFFFF", 
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p 
            style={{ 
              fontSize: "12px", 
              color: colors.text.secondary || "#94A3B8", 
              margin: "2px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {(actionLabel || onActionClick) && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-1 font-bold text-xs transition-colors"
          style={{
            background: "transparent",
            border: "none",
            color: colors.accent.primary || "#22C55E",
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          <span>{actionLabel || "View All"}</span>
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export default SectionHeader;
