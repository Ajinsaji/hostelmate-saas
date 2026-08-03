import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { Plus } from 'lucide-react';

export function FloatingActionButton({ onClick, icon, ariaLabel = 'Add', className = '' }) {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      style={{
        position: 'fixed',
        bottom: spacing['2xl'],
        right: spacing.xl,
        width: '56px',
        height: '56px',
        borderRadius: radius.full,
        background: colors.accent.primary,
        border: 'none',
        color: colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: shadows.elevated,
        cursor: 'pointer',
        zIndex: 100,
      }}
    >
      {icon || <Plus size={24} />}
    </motion.button>
  );
}

export default FloatingActionButton;
