import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) {
  const { colors, spacing, radius, typography, shadows } = useTheme();

  const sizes = {
    sm: '480px',
    md: '640px',
    lg: '800px',
    xl: '960px',
  };

  const maxWidth = sizes[size] || sizes.md;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: spacing.xl,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: colors.background.card,
              borderRadius: radius['2xl'],
              border: `1px solid ${colors.border.default}`,
              padding: spacing.xl,
              maxWidth,
              width: '100%',
              boxShadow: shadows.elevated,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${colors.border.default}`,
                paddingBottom: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <h3
                id="modal-title"
                style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: typography.weights.semibold,
                  color: colors.text.primary,
                  margin: 0,
                  fontFamily: typography.fontFamily,
                }}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  padding: spacing.xs,
                  background: 'transparent',
                  border: 'none',
                  color: colors.text.muted,
                  cursor: 'pointer',
                  borderRadius: radius.sm,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = colors.text.primary;
                  e.currentTarget.style.background = colors.background.elevated;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = colors.text.muted;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                fontSize: typography.sizes.base,
                color: colors.text.secondary,
                fontFamily: typography.fontFamily,
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
