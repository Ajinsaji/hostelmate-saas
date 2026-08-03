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
          border: `1px solid ${colors.border.default}`,
        };
      case "ai":
        return {
          background: colors.background.card,
          border: `1px solid ${colors.accent.ai || "#6C4CF5"}`,
        };
      case "default":
      default:
        return {
          background: colors.background.card,
          border: `1px solid ${colors.border.default}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <motion.div
      initial={animations.pageLoad.initial}
      animate={animations.pageLoad.animate}
      transition={animations.pageLoad.transition}
      whileHover={hover && onClick ? animations.cardHover.whileHover : {}}
      onClick={onClick}
      role={onClick ? "button" : "region"}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      className={`${className}`}
      style={{
        ...variantStyles,
        borderRadius: radius.xl,
        padding: spacing.xl,
        boxShadow: shadows.card || shadows.soft,
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
