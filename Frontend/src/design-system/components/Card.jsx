import { motion } from "framer-motion";
import { useTheme } from "../ThemeProvider";

export function Card({ 
  children, 
  className = "", 
  hover = false,
  onClick,
  style = {},
  variant = "default",
  padding = "xl",
  "aria-label": ariaLabel
}) {
  const { colors, spacing, radius, shadows, animations } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          background: colors.background.elevated || "#1A2438",
          border: `1px solid ${colors.border.default || "#202B45"}`,
        };
      case "ai":
        return {
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.accent.ai || "#6C4CF5"}`,
        };
      case "glass":
        return {
          background: "rgba(19, 28, 46, 0.85)",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        };
      case "default":
      default:
        return {
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <motion.div
      initial={animations.fadeIn.initial}
      animate={animations.fadeIn.animate}
      transition={{ duration: 0.15, ease: "easeOut" }}
      whileHover={hover ? { y: -2, scale: 1.005, transition: { duration: 0.15 } } : undefined}
      onClick={onClick}
      role={onClick ? "button" : "region"}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick(e) : undefined}
      className={`rounded-2xl ${className}`}
      style={{
        ...variantStyles,
        borderRadius: radius.xl || "18px",
        padding: spacing[padding] || spacing.lg || "20px",
        boxShadow: shadows.card || "0 10px 28px rgba(0, 0, 0, 0.24)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 150ms ease-out",
        position: "relative",
        overflow: "hidden",
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardCard(props) {
  return <Card {...props} variant="default" padding="lg" />;
}

export default Card;
