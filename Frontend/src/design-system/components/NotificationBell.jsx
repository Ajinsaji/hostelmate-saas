import React from 'react';
import { useTheme } from '../ThemeProvider';
import { Bell } from 'lucide-react';

export function NotificationBell({ count = 0, onClick, className = '' }) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <button
      onClick={onClick}
      className={className}
      aria-label={`${count} unread notifications`}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        color: colors.text.secondary,
        cursor: 'pointer',
        padding: spacing.xs,
        borderRadius: radius.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = colors.text.primary;
        e.currentTarget.style.background = colors.background.elevated;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = colors.text.secondary;
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <Bell size={20} />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: colors.accent.danger,
            color: colors.text.primary,
            fontSize: '10px',
            fontWeight: typography.weights.bold,
            minWidth: '16px',
            height: '16px',
            borderRadius: radius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: `2px solid ${colors.background.card}`,
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
