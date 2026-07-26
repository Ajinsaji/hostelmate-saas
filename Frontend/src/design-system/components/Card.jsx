import { motion } from "framer-motion";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { spacing } from "../tokens/spacing";
import { shadows } from "../tokens/shadows";
import { animations } from "../tokens/animations";

export function Card({ 
  children, 
  className = "", 
  hover = false,
  onClick,
  style = {}
}) {
  return (
    <motion.div
      initial={animations.pageLoad.initial}
      animate={animations.pageLoad.animate}
      transition={animations.pageLoad.transition}
      whileHover={hover && onClick ? animations.cardHover.whileHover : {}}
      onClick={onClick}
      className={`${className}`}
      style={{
        background: colors.card,
        borderRadius: radius.lg,
        padding: spacing.xl,
        boxShadow: shadows.soft,
        border: `1px solid rgba(0,0,0,0.02)`,
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
