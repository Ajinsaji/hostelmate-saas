import React from "react";
import { useTheme } from "../ThemeProvider";

export function Badge({ 
  children, 
  variant = "success", // success, danger, warning, info, neutral
  showDot = true,
  size = "md",
  className = "" 
}) {
  const { colors, typography } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
      case "paid":
      case "occupied":
        return { 
          bg: "rgba(34, 197, 94, 0.12)", 
          text: colors.accent.success || "#22C55E", 
          dot: colors.accent.success || "#22C55E" 
        };
      case "danger":
      case "overdue":
        return { 
          bg: "rgba(239, 68, 68, 0.12)", 
          text: colors.accent.danger || "#EF4444", 
          dot: colors.accent.danger || "#EF4444" 
        };
      case "warning":
      case "pending":
      case "vacant":
        return { 
          bg: "rgba(245, 158, 11, 0.12)", 
          text: colors.accent.warning || "#F59E0B", 
          dot: colors.accent.warning || "#F59E0B" 
        };
      case "info":
        return { 
          bg: "rgba(59, 130, 246, 0.12)", 
          text: colors.accent.info || "#3B82F6", 
          dot: colors.accent.info || "#3B82F6" 
        };
      case "neutral":
      default:
        return { 
          bg: "rgba(255, 255, 255, 0.08)", 
          text: colors.text.secondary || "#94A3B8", 
          dot: colors.text.secondary || "#94A3B8" 
        };
    }
  };

  const styles = getVariantStyles();
  const fontSz = size === "sm" ? "11px" : "12px";
  const pd = size === "sm" ? "2px 8px" : "4px 10px";

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-bold rounded-full ${className}`}
      role="status"
      style={{
        background: styles.bg,
        color: styles.text,
        borderRadius: "9999px",
        padding: pd,
        fontSize: fontSz,
        fontFamily: typography.fontFamily,
        border: `1px solid ${styles.text}25`,
        whiteSpace: "nowrap",
      }}
    >
      {showDot && (
        <span 
          style={{ 
            width: "6px", 
            height: "6px", 
            borderRadius: "50%", 
            background: styles.dot,
            display: "inline-block",
            flexShrink: 0
          }} 
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export function StatusBadge(props) {
  return <Badge {...props} />;
}

export function StatChip(props) {
  return <Badge {...props} showDot={false} size="sm" />;
}

export default Badge;
