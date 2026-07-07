import React from "react";
import { COLORS } from "../../constants/theme";

export const QuickActionButton = React.memo(({
  label,
  icon,
  onClick,
  variant = "ghost", // 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled = false,
  className = ""
}) => {
  const getStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
          color: COLORS.textMain,
          border: "none",
          boxShadow: "0 10px 30px rgba(0, 200, 150, 0.12)"
        };
      case "secondary":
        return {
          background: COLORS.surfaceLight,
          color: COLORS.textSecondary,
          border: `1px solid ${COLORS.border}`,
        };
      case "danger":
        return {
          background: COLORS.errorBg,
          color: COLORS.error,
          border: `1px solid rgba(220, 38, 38, 0.2)`
        };
      case "ghost":
      default:
        return {
          background: "transparent",
          color: COLORS.textMuted,
          border: "1px solid transparent",
        };
    }
  };

  const buttonStyle = getStyles();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
      } ${
        variant === "ghost" && !disabled ? "hover:bg-white/5 hover:text-white" : ""
      } ${className}`}
      style={buttonStyle}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </button>
  );
});

export default QuickActionButton;
