import React from 'react';
import clsx from "clsx";
import { useTheme } from "../ThemeProvider";

/**
 * Enterprise Timeline Component
 * @param {Array} events - Array of { id, title, description, timestamp, icon: Icon, type: 'success' | 'warning' | 'info' | 'danger' | 'default' }
 */
export default function Timeline({ events }) {
  const { colors, spacing, radius, typography } = useTheme();

  const getColorClasses = (type) => {
    switch (type) {
      case "success":
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          text: colors.accent.success,
          border: 'rgba(34, 197, 94, 0.3)',
        };
      case "warning":
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          text: colors.accent.warning,
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case "danger":
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          text: colors.accent.danger,
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case "info":
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          text: colors.accent.info,
          border: 'rgba(59, 130, 246, 0.3)',
        };
      case "primary":
        return {
          bg: 'rgba(22, 163, 74, 0.15)',
          text: colors.accent.primary,
          border: 'rgba(22, 163, 74, 0.3)',
        };
      default:
        return {
          bg: colors.background.elevated,
          text: colors.text.secondary,
          border: colors.border.default,
        };
    }
  };

  if (!events || events.length === 0) {
    return (
      <div 
        style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.text.muted,
          fontSize: typography.sizes.sm,
          fontFamily: typography.fontFamily,
        }}
      >
        No timeline events available.
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'relative',
        paddingLeft: spacing.md,
        borderLeft: `2px solid ${colors.border.default}`,
        marginLeft: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
      }}
    >
      {events.map((event, index) => {
        const Icon = event.icon;
        const colorStyles = getColorClasses(event.type);
        
        return (
          <div key={event.id || index} style={{ position: 'relative', marginBottom: spacing.xl }}>
            {/* Timeline Dot/Icon */}
            <div
              style={{
                position: 'absolute',
                left: '-25px',
                top: '0px',
                width: '32px',
                height: '32px',
                borderRadius: radius.full,
                border: `2px solid ${colorStyles.border}`,
                background: colorStyles.bg,
                color: colorStyles.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              {Icon && <Icon size={14} strokeWidth={2.5} />}
            </div>

            {/* Content */}
            <div style={{ paddingLeft: spacing.xl }}>
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginBottom: spacing.xs,
                  fontFamily: typography.fontFamily,
                }}
              >
                <h4 style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text.primary, margin: 0 }}>
                  {event.title}
                </h4>
                <span style={{ fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: '2px' }}>
                  {new Date(event.timestamp).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              
              {event.description && (
                <p style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, margin: 0, lineHeight: typography.lineHeights.normal, fontFamily: typography.fontFamily }}>
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

