import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { ChevronLeft } from 'lucide-react';

/**
 * Enterprise Unified Page Header with breadcrumbs, title, subtitle, and actions slot.
 */
export default function UnifiedPageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  backTo,
  onBack,
  actions,
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === 'function') return onBack();
    if (typeof backTo === 'number') return navigate(backTo);
    if (typeof backTo === 'string') return navigate(backTo);
    navigate(-1);
  };

  return (
    <div
      style={{
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.sizes.sm,
            color: colors.text.muted,
            marginBottom: spacing.sm,
            fontFamily: typography.fontFamily,
          }}
        >
          {breadcrumbs.map((b, idx) => (
            <span key={`${b.label}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              {b.to ? (
                <button
                  onClick={() => navigate(b.to)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.text.muted,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = colors.text.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.color = colors.text.muted; }}
                >
                  {b.label}
                </button>
              ) : (
                <span style={{ color: idx === breadcrumbs.length - 1 ? colors.text.secondary : colors.text.muted }}>
                  {b.label}
                </span>
              )}
              {idx < breadcrumbs.length - 1 && (
                <span style={{ color: colors.text.disabled }}>/</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Title row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
          {(backTo !== undefined || typeof onBack === 'function') && (
            <button
              type="button"
              aria-label="Go back"
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.xs,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border.default}`,
                background: 'rgba(255, 255, 255, 0.03)',
                color: colors.text.secondary,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = colors.hover.default; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            {title && (
              <h1
                style={{
                  fontSize: typography.sizes['2xl'] || '24px',
                  fontWeight: typography.weights.bold,
                  color: colors.text.primary,
                  margin: 0,
                  fontFamily: typography.fontFamily,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: typography.sizes.sm,
                  color: colors.text.muted,
                  margin: `4px 0 0 0`,
                  fontFamily: typography.fontFamily,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
