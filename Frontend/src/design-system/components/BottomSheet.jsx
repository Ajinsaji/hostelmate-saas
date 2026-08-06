import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children 
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

          {/* Bottom Sheet Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "85vh",
              overflowY: "auto",
              background: colors.background.card || "#131C2E",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              borderTop: `1px solid ${colors.border.default || "#202B45"}`,
              boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)",
              zIndex: 1500,
              padding: `${spacing.md || "16px"} ${spacing.lg || "20px"} max(${spacing.xl || "24px"}, env(safe-area-inset-bottom))`,
            }}
          >
            {/* Top Grab Handle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: spacing.xs || "8px" }}>
              <div 
                style={{ 
                  width: "36px", 
                  height: "4px", 
                  borderRadius: "2px", 
                  background: "rgba(255, 255, 255, 0.2)" 
                }} 
              />
            </div>

            {/* Header */}
            {(title || onClose) && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md || "16px" }}>
                <div>
                  {title && (
                    <h3 style={{ fontSize: typography.sizes.lg || "18px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p style={{ fontSize: typography.sizes.xs || "12px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close bottom sheet"
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
            )}

            {/* Sheet Content */}
            <div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
