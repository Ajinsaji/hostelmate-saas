import React from 'react';
import clsx from "clsx";
import { useTheme } from '../ThemeProvider';

export default function FilterChip({ label, isActive, onClick, count }) {
  const { colors, spacing, radius, typography, shadows } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: radius.full,
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        fontFamily: typography.fontFamily,
        border: `1px solid ${isActive ? colors.accent.primary : colors.border.default}`,
        background: isActive ? colors.accent.primary : colors.background.card,
        color: colors.text.primary,
        cursor: 'pointer',
        boxShadow: isActive ? shadows.glow.primary : 'none',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = colors.hover.default;
          e.currentTarget.style.borderColor = colors.hover.default;
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = colors.background.card;
          e.currentTarget.style.borderColor = colors.border.default;
        }
      }}
    >
      {label}
      {count !== undefined && (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: radius.full,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.semibold,
            background: isActive ? 'rgba(255, 255, 255, 0.2)' : colors.background.elevated,
            color: colors.text.primary,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

