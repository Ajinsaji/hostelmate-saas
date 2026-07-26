import { motion } from "framer-motion";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { spacing } from "../tokens/spacing";
import { animations } from "../tokens/animations";
import { typography } from "../tokens/typography";

export function Button({ 
  children, 
  variant = "primary", 
  onClick, 
  className = "", 
  disabled = false,
  fullWidth = true
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: colors.gradients.ai,
          color: "#FFFFFF",
          border: "none",
          boxShadow: `0 4px 12px rgba(108, 76, 245, 0.35)`
        };
      case "secondary":
        return {
          background: colors.card,
          color: colors.textPrimary,
          border: `1px solid ${colors.border}`,
          boxShadow: "none"
        };
      case "danger":
        return {
          background: colors.danger,
          color: "#FFFFFF",
          border: "none",
          boxShadow: `0 4px 12px rgba(239, 68, 68, 0.35)`
        };
      case "success":
        return {
          background: colors.success,
          color: "#FFFFFF",
          border: "none",
          boxShadow: `0 4px 12px rgba(34, 197, 94, 0.35)`
        };
      default:
        return {
          background: colors.gradients.ai,
          color: "#FFFFFF",
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
      className={`flex items-center justify-center gap-2 font-semibold transition-all ${className}`}
      style={{
        ...styles,
        borderRadius: radius.md,
        padding: "12px 20px",
        height: variant === "secondary" ? "40px" : "48px",
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
