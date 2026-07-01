import { motion } from "framer-motion";

export const FadeIn = ({ children, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const HoverLift = ({ children }) => {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
};

