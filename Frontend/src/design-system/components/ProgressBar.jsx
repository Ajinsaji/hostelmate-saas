import React from "react";
import { useTheme } from "../ThemeProvider";

export function ProgressBar({ 
  value = 0, 
  max = 100, 
  color = "primary", // primary, success, warning, danger
  height = "8px",
  showLabel = false,
  label,
  className = "" 
}) {
  const { colors, radius, typography } = useTheme();

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    switch (color) {
      case "danger": return colors.accent.danger || "#EF4444";
      case "warning": return colors.accent.warning || "#F59E0B";
      case "success":
      case "primary":
      default: return colors.accent.primary || "#22C55E";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", fontWeight: typography.weights.bold }}>
            {label || "Usage"}
          </span>
          <span style={{ fontSize: "12px", color: colors.text.primary || "#FFFFFF", fontWeight: typography.weights.bold }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div
        style={{
          width: "100%",
          height,
          borderRadius: radius.full || "9999px",
          background: "rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            borderRadius: radius.full || "9999px",
            background: getColor(),
            transition: "width 300ms ease-out",
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
