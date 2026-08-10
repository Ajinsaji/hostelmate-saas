import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import * as LucideIcons from 'lucide-react';
import { Search, LogOut, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useCurrentUser, useCurrentStorage, useCurrentSubscription } from '../../contexts/HostelContext';
import { formatSubscriptionStatus } from '../../utils/subscriptionFormatter';
import HostelSwitcher from '../components/HostelSwitcher';

function getIcon(name) {
  return LucideIcons[name] || LucideIcons.Circle;
}

/**
 * Enterprise Unified Sidebar
 * Used by UnifiedLayout for desktop navigation.
 */
export default function UnifiedSidebar({
  menuItems = [],
  collapsed = false,
  onToggleCollapse,
  onLogout,
  userName = '',
  userRole = '',
  userAvatar = '',
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useCurrentUser();
  const { storage } = useCurrentStorage();
  const { subscription } = useCurrentSubscription();

  // Filter menu items by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(section => section.items.length > 0);
  }, [menuItems, searchQuery]);

  const isActive = (href) => {
    if (href === location.pathname) return true;
    // Match sub-routes but avoid false positives on short paths
    if (href.length > 1 && location.pathname.startsWith(href + '/')) return true;
    return false;
  };

  const sidebarWidth = collapsed ? '72px' : '280px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: colors.background.sidebar,
        borderRight: `1px solid ${colors.border.default}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
        zIndex: 40,
      }}
      className="hidden lg:flex"
      aria-label="Sidebar navigation"
    >
      {/* Brand */}
      <div
        style={{
          padding: collapsed ? `${spacing.lg} ${spacing.sm}` : `${spacing.lg} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: spacing.sm,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: radius.lg,
              background: `rgba(22, 163, 74, 0.15)`,
              border: `1px solid rgba(22, 163, 74, 0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} style={{ color: colors.accent.primary }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.text.muted, fontFamily: typography.fontFamily }}>
                HostelMate
              </div>
              <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text.primary, fontFamily: typography.fontFamily }}>
                Enterprise
              </div>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.text.muted,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: radius.sm,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: `${spacing.sm} ${spacing.md}`, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.text.muted,
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search menu items"
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: colors.background.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '9999px',
                color: colors.text.primary,
                fontSize: typography.sizes.sm,
                fontFamily: typography.fontFamily,
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${spacing.sm} ${collapsed ? spacing.xs : spacing.sm}`,
        }}
      >
        {filteredSections.map((section) => (
          <div key={section.section} style={{ marginBottom: spacing.md }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: typography.weights.bold,
                  color: colors.text.disabled,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontFamily: typography.fontFamily,
                }}
              >
                {section.section}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => {
                const Icon = getIcon(item.icon);
                const active = isActive(item.href);
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.href)}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      padding: collapsed ? `${spacing.sm} 0` : `${spacing.sm} ${spacing.md}`,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active ? 'rgba(22, 163, 74, 0.15)' : 'transparent',
                      border: active ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid transparent',
                      borderRadius: radius.md,
                      boxShadow: active ? '0 0 12px rgba(22, 163, 74, 0.25)' : 'none',
                      color: active ? colors.text.primary : colors.text.secondary,
                      fontSize: typography.sizes.sm,
                      fontWeight: active ? typography.weights.semibold : typography.weights.medium,
                      fontFamily: typography.fontFamily,
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = colors.hover.default;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon
                      size={18}
                      style={{
                        color: active ? colors.accent.primary : colors.text.muted,
                        flexShrink: 0,
                      }}
                    />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          fontWeight: typography.weights.bold,
                          background: colors.accent.danger,
                          color: colors.text.primary,
                          padding: '1px 6px',
                          borderRadius: radius.full,
                          minWidth: '18px',
                          textAlign: 'center',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Card */}
      <div
        style={{
          borderTop: `1px solid ${colors.border.default}`,
          padding: collapsed ? spacing.sm : spacing.md,
          flexShrink: 0,
        }}
      >
        {!collapsed ? (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
                padding: spacing.sm,
                background: colors.background.elevated,
                borderRadius: radius.xxl,
                marginBottom: spacing.sm,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              {/* User Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: radius.full,
                    background: colors.background.card,
                    border: `1px solid ${colors.border.default}`,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text.muted }}>
                      <LucideIcons.User size={16} />
                    </div>
                  )}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text.primary, fontFamily: typography.fontFamily, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userName || 'User'}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.text.muted, fontFamily: typography.fontFamily }}>
                    {userRole || 'Role'}
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div style={{ borderTop: `1px solid ${colors.border.light}`, margin: '4px 0' }} />

              {/* Hostel Switcher & Meta Details for Owner / Role Info for Admin */}
              {role === 'admin' || role === 'superadmin' || location.pathname.startsWith('/admin') ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: typography.fontFamily, color: colors.text.muted, marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Console:</span>
                    <span style={{ color: colors.accent.success, fontWeight: typography.weights.bold }}>
                      Super Admin
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Access:</span>
                    <span style={{ color: colors.text.primary, fontWeight: typography.weights.semibold }}>
                      Full Privilege
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ margin: '2px 0' }}>
                    <HostelSwitcher />
                  </div>

                  {/* Meta details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: typography.fontFamily, color: colors.text.muted, marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Plan:</span>
                      <span style={{ color: colors.accent.success, fontWeight: typography.weights.bold }}>
                        {user?.plan?.name || user?.subscription?.planName || 'Trial'}
                      </span>
                    </div>
                    {user?.hostels?.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Hostels:</span>
                        <span style={{ color: colors.text.secondary }}>
                          {user.hostels.length} Hostels
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Storage:</span>
                        <span style={{ color: colors.text.secondary }}>
                          {storage.limit === 'Unlimited' ? `${storage.used} GB Used` : `${storage.used} / ${storage.limit} GB`}
                        </span>
                      </div>
                      {storage.limit !== 'Unlimited' && (
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{ width: `${storage.percentage}%`, height: '100%', background: colors.accent.success, borderRadius: '3px' }} />
                        </div>
                      )}
                      {storage.limit === 'Unlimited' && (
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{ width: '40%', height: '100%', background: colors.accent.success, borderRadius: '3px' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Status:</span>
                      <span style={{ color: colors.text.primary, fontWeight: typography.weights.semibold }}>
                        {formatSubscriptionStatus(subscription)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                aria-label="Logout"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.md}`,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: radius.md,
                  color: colors.accent.danger,
                  fontSize: typography.sizes.sm,
                  fontWeight: typography.weights.semibold,
                  fontFamily: typography.fontFamily,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            )}
          </>
        ) : (
          onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              aria-label="Logout"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.sm,
                background: 'transparent',
                border: 'none',
                color: colors.accent.danger,
                cursor: 'pointer',
                borderRadius: radius.md,
              }}
            >
              <LogOut size={18} />
            </button>
          )
        )}
      </div>
    </aside>
  );
}
