import { motion } from "framer-motion";
import { useTheme } from "../ThemeProvider";

export function Button({ 
  children, 
  variant = "primary", 
  onClick, 
  className = "", 
  disabled = false,
  fullWidth = true,
  "aria-label": ariaLabel
}) {
  const { colors, spacing, radius, shadows, typography, animations } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: colors.gradients.primary,
          color: colors.text.primary,
          border: "none",
          boxShadow: `0 4px 12px rgba(22, 163, 74, 0.35)`
        };
      case "secondary":
        return {
          background: colors.background.card,
          color: colors.text.primary,
          border: `1px solid ${colors.border.default}`,
          boxShadow: "none"
        };
      case "danger":
        return {
          background: colors.accent.danger,
          color: colors.text.primary,
          border: "none",
          boxShadow: `0 4px 12px rgba(239, 68, 68, 0.35)`
        };
      case "success":
        return {
          background: colors.accent.success,
          color: colors.text.primary,
          border: "none",
          boxShadow: `0 4px 12px rgba(34, 197, 94, 0.35)`
        };
      case "ghost":
        return {
          background: "transparent",
          color: colors.text.primary,
          border: "none",
          boxShadow: "none"
        };
      case "ai":
        return {
          background: colors.gradients.ai,
          color: colors.text.primary,
          border: "none",
          boxShadow: `0 4px 12px rgba(108, 76, 245, 0.35)`
        };
      default:
        return {
          background: colors.gradients.primary,
          color: colors.text.primary,
          border: "none",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.button
      whileTap={!disabled ? animations.buttonTap.whileTap : {}}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`flex items-center justify-center gap-2 font-semibold transition-all ${className}`}
      style={{
        ...styles,
        borderRadius: radius.md,
        padding: "12px 20px",
        height: variant === "secondary" || variant === "ghost" ? "40px" : "48px",
        fontSize: typography.sizes.body,
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: typography.fontFamily,
      }}
    >
      {children}
    </motion.button>
  );
}
