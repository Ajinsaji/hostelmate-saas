import { motion } from "framer-motion";
import { useTheme } from "../ThemeProvider";

export function Button({ 
  children, 
  variant = "primary", 
  onClick, 
  className = "", 
  disabled = false,
  fullWidth = false,
  size = "md",
  icon: Icon,
  type = "button",
  "aria-label": ariaLabel
}) {
  const { colors, radius, typography, animations } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: `linear-gradient(135deg, ${colors.accent.primary || "#22C55E"} 0%, ${colors.accent.success || "#16A34A"} 100%)`,
          color: "#FFFFFF",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 24px rgba(34, 197, 94, 0.18)",
        };
      case "secondary":
        return {
          background: "rgba(255,255,255,0.04)",
          color: colors.text.primary || "#FFFFFF",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        };
      case "outline":
        return {
          background: "transparent",
          color: colors.accent.primary || "#22C55E",
          border: `1px solid ${colors.accent.primary || "#22C55E"}`,
          boxShadow: "none",
        };
      case "danger":
        return {
          background: `linear-gradient(135deg, ${colors.accent.danger || "#EF4444"} 0%, #DC2626 100%)`,
          color: "#FFFFFF",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 24px rgba(239, 68, 68, 0.2)",
        };
      case "ghost":
        return {
          background: "transparent",
          color: colors.text.primary || "#FFFFFF",
          border: "1px solid transparent",
          boxShadow: "none",
        };
      default:
        return {
          background: colors.accent.primary || "#22C55E",
          color: "#FFFFFF",
          border: "1px solid rgba(255,255,255,0.08)",
        };
    }
  };

  const minHeight = size === "sm" ? "40px" : size === "lg" ? "52px" : "44px";
  const styles = getVariantStyles();

  return (
    <motion.button
      type={type}
      whileTap={!disabled ? animations.buttonTap?.whileTap || { scale: 0.98 } : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-2xl ${className}`}
      style={{
        ...styles,
        borderRadius: radius.lg || "16px",
        padding: size === "sm" ? "8px 14px" : size === "lg" ? "14px 22px" : "10px 16px",
        minHeight,
        minWidth: size === "sm" ? "40px" : "44px",
        fontSize: size === "sm" ? "13px" : typography.sizes.sm || "14px",
        fontWeight: typography.weights.bold,
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: typography.fontFamily,
        transition: "all 150ms ease-out",
      }}
    >
      {Icon && <Icon size={size === "sm" ? 16 : 18} />}
      {children}
    </motion.button>
  );
}

export function IconButton({ icon: Icon, onClick, ariaLabel, variant = "ghost", className = "", size = "md" }) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`!p-0 !min-w-[44px] !h-[44px] rounded-full ${className}`}
      size={size}
    >
      {Icon && <Icon size={20} />}
    </Button>
  );
}

export default Button;
