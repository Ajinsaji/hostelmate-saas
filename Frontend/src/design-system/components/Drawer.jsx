import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children,
  position = "right", // right or bottom
  size = "md"
}) {
  const { colors, spacing, radius, typography } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const widths = {
    sm: "360px",
    md: "480px",
    lg: "640px",
  };
  const width = widths[size] || widths.md;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 1400,
            }}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: position === "right" ? "100%" : 0, y: position === "bottom" ? "100%" : 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: position === "right" ? "100%" : 0, y: position === "bottom" ? "100%" : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: position === "right" ? 0 : "auto",
              right: 0,
              bottom: 0,
              left: position === "bottom" ? 0 : "auto",
              width: position === "right" ? `min(${width}, 100vw)` : "100%",
              height: position === "right" ? "100vh" : "auto",
              maxHeight: position === "bottom" ? "85vh" : "100vh",
              background: colors.background.card || "#131C2E",
              borderLeft: position === "right" ? `1px solid ${colors.border.default || "#202B45"}` : "none",
              borderTop: position === "bottom" ? `1px solid ${colors.border.default || "#202B45"}` : "none",
              boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
              zIndex: 1500,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${spacing.md || "16px"} ${spacing.lg || "20px"}`,
                borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
              }}
            >
              <h3 style={{ fontSize: typography.sizes.lg || "18px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: radius.full || "9999px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.text.secondary || "#94A3B8",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: spacing.lg || "20px" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
