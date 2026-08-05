import { motion } from "framer-motion";
import { useTheme } from "../ThemeProvider";

export function Card({ 
  children, 
  className = "", 
  hover = false,
  onClick,
  style = {},
  variant = "default",
  "aria-label": ariaLabel
}) {
  const { colors, spacing, radius, shadows, animations } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          background: colors.background.elevated || "#1C2740",
          border: `1px solid ${colors.border.default || "#22304A"}`,
        };
      case "ai":
        return {
          background: colors.background.card || "#162032",
          border: `1px solid ${colors.accent.ai || "#6C4CF5"}`,
        };
      case "default":
      default:
        return {
          background: colors.background.card || "#162032",
          border: `1px solid ${colors.border.default || "#22304A"}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <motion.div
      initial={animations.pageLoad.initial}
      animate={animations.pageLoad.animate}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={hover ? { y: -4, scale: 1.01, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)" } : {}}
      onClick={onClick}
      role={onClick ? "button" : "region"}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      className={`${className}`}
      style={{
        ...variantStyles,
        borderRadius: radius.xxl || "24px",
        padding: spacing.xl || "24px",
        boxShadow: shadows.card || shadows.soft || "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
