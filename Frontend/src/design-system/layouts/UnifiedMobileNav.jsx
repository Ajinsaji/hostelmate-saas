import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { Home, Users, Plus, Wallet, Menu, Building, CreditCard, HelpCircle, Settings, ShieldCheck } from 'lucide-react';

/**
 * HostelMate Enterprise v5.1 — Role-Aware Mobile Bottom Navigation
 */
export const UnifiedMobileNav = memo(function UnifiedMobileNav({ role = 'owner', mobileItems, onQuickAddClick, onMoreClick }) {
  const { colors, typography } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = role === 'admin' || role === 'superadmin' || location.pathname.startsWith('/admin');

  const isActive = (href) => {
    if (!href || href === 'fab' || href === 'more') return false;
    if (href === location.pathname) return true;
    if (href.length > 1 && location.pathname.startsWith(href + '/')) return true;
    return false;
  };

  const defaultOwnerNav = [
    { key: 'home', label: 'Home', icon: Home, href: '/owner/dashboard' },
    { key: 'residents', label: 'Residents', icon: Users, href: '/residents' },
    { key: 'fab', label: '', icon: Plus, href: 'fab' },
    { key: 'finance', label: 'Finance', icon: Wallet, href: '/payments' },
    { key: 'more', label: 'More', icon: Menu, href: 'more' },
  ];

  const iconMap = {
    Home, Users, Plus, Wallet, Menu, Building, CreditCard, HelpCircle, Settings, ShieldCheck
  };

  let navItems = defaultOwnerNav;

  if (isAdmin) {
    const rawItems = mobileItems || [
      { key: 'home', label: 'Home', icon: 'Home', href: '/admin/dashboard' },
      { key: 'hostels', label: 'Hostels', icon: 'Building', href: '/admin/hostels' },
      { key: 'plans', label: 'Plans', icon: 'CreditCard', href: '/admin/subscriptions' },
      { key: 'support', label: 'Support', icon: 'HelpCircle', href: '/admin/support' },
      { key: 'more', label: 'More', icon: 'Menu', href: 'more' },
    ];
    navItems = rawItems.map(item => ({
      ...item,
      icon: typeof item.icon === 'string' ? (iconMap[item.icon] || Home) : item.icon
    }));
  }

  const columnsCount = navItems.length;

  return (
    <nav
      className="lg:hidden"
      aria-label="Mobile navigation"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
        paddingLeft: 'max(8px, env(safe-area-inset-left))',
        paddingRight: 'max(8px, env(safe-area-inset-right))',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingTop: '6px',
        background: colors.background.primary || '#0B1220',
        borderTop: `1px solid ${colors.border.default || '#202B45'}`,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
          alignItems: 'center',
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isFab = item.key === 'fab';
          const isMore = item.key === 'more' || item.href === 'more';

          return (
            <button
              key={item.key || item.href}
              onClick={() => {
                if (isFab) {
                  if (onQuickAddClick) onQuickAddClick();
                } else if (isMore) {
                  if (onMoreClick) onMoreClick();
                } else {
                  navigate(item.href);
                }
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label || 'Navigation link'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                color: active ? (colors.accent.primary || '#22C55E') : (colors.text.secondary || '#94A3B8'),
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                fontFamily: typography.fontFamily,
                minHeight: '52px',
                minWidth: '44px',
                padding: '4px 0',
              }}
            >
              {isFab && !isAdmin ? (
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: colors.accent.primary || '#22C55E',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '-16px',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                    border: `3px solid ${colors.background.primary || '#0B1220'}`,
                  }}
                >
                  <Icon size={24} />
                </div>
              ) : (
                <>
                  <Icon size={22} style={{ color: active ? (colors.accent.primary || '#22C55E') : (colors.text.secondary || '#94A3B8') }} />
                  <span>{item.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default UnifiedMobileNav;
