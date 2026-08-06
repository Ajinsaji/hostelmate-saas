import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

function getIcon(name) {
  return LucideIcons[name] || LucideIcons.Circle;
}

/**
 * Enterprise Unified Mobile Bottom Navigation
 */
export default function UnifiedMobileNav({ items = [], onFabClick }) {
  const { colors, spacing, radius, typography } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href) => {
    if (href === 'fab') return false;
    if (href === location.pathname) return true;
    if (href.length > 1 && location.pathname.startsWith(href + '/')) return true;
    return false;
  };

  if (!items.length) return null;

  return (
    <nav
      className="lg:hidden"
      aria-label="Bottom navigation"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        paddingLeft: 'max(10px, env(safe-area-inset-left))',
        paddingRight: 'max(10px, env(safe-area-inset-right))',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingTop: '8px',
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: `1px solid ${colors.border.default || '#22304A'}`,
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto',
          padding: '4px 4px 2px',
        }}
      >
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          const active = isActive(item.href);
          const isFab = item.key === 'fab' || item.href === 'fab';

          return (
            <button
              key={item.key}
              onClick={() => {
                if (isFab) {
                  if (onFabClick) onFabClick();
                } else {
                  navigate(item.href);
                }
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label || 'Quick action menu'}
              title={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                color: active ? colors.accent.primary : colors.text.muted,
                fontSize: '10.5px',
                fontWeight: active ? typography.weights.bold : typography.weights.semibold,
                fontFamily: typography.fontFamily,
                letterSpacing: '0.01em',
                padding: isFab ? '0px' : '8px 2px',
                borderRadius: radius.lg,
                minHeight: '60px',
                transition: 'all 0.2s ease',
              }}
            >
              <motion.div
                animate={{
                  scale: active ? 1.04 : 1,
                  boxShadow: active
                    ? '0 0 0 6px rgba(22, 163, 74, 0.14)'
                    : isFab
                    ? '0 4px 16px rgba(22, 163, 74, 0.4)'
                    : '0 0 0 0 rgba(22, 163, 74, 0)',
                }}
                transition={{ duration: 0.2 }}
                style={{
                  width: isFab ? '48px' : '40px',
                  height: isFab ? '48px' : '40px',
                  borderRadius: isFab ? '50%' : '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isFab
                    ? colors.accent.primary || '#16A34A'
                    : active
                    ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(22, 163, 74, 0.12))'
                    : 'rgba(255,255,255,0.04)',
                  color: isFab ? '#FFFFFF' : active ? colors.accent.primary : colors.text.muted,
                  border: isFab
                    ? 'none'
                    : active
                    ? '1px solid rgba(22, 163, 74, 0.22)'
                    : '1px solid rgba(255,255,255,0.02)',
                  marginTop: isFab ? '-12px' : '0px',
                }}
              >
                <Icon size={isFab ? 22 : 20} />
              </motion.div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
