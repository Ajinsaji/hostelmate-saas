import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { getMenuConfig } from './menuConfigs';
import UnifiedSidebar from './UnifiedSidebar';
import UnifiedMobileNav from './UnifiedMobileNav';
import UnifiedPageHeader from './UnifiedPageHeader';
import TopHeader from '../components/TopHeader';
import useSessionVerification from '../../hooks/useSessionVerification';
import PageLoader from '../../components/PageLoader';
import { useCurrentUser } from '../../contexts/HostelContext';
import { Plus, X, UserPlus, BedDouble, Wallet, Receipt, AlertTriangle } from 'lucide-react';

/**
 * HostelMate Enterprise — Unified Layout
 *
 * The single layout component used across all roles.
 * Desktop: Sidebar (left) + Top Header (above) + Main content (right)
 * Mobile: Content + Bottom Navigation + Quick Add FAB
 */
export function UnifiedLayout({
  role = 'owner',
  menuItems,
  mobileItems,
  children,
  headerActions,
  breadcrumbs,
  pageTitle,
  pageSubtitle,
  backTo,
  onBack,
  onLogout,
  userName,
  userRole,
  userAvatar,
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { verifying } = useSessionVerification();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Resolve menu config from role if not provided
  const config = getMenuConfig(role);
  const sidebarItems = menuItems || config.sidebar;
  const mobileNavItems = mobileItems || config.mobile;

  const showPageHeader = pageTitle || breadcrumbs?.length > 0;

  // Render full screen session verification load state to avoid layout flash
  if (verifying) {
    return <PageLoader />;
  }

  const finalUserName = userName || user?.ownerName || user?.name || 'Owner';
  const finalUserRole = userRole || (role === 'owner' ? 'Hostel Owner' : role === 'admin' || role === 'superadmin' ? 'Administrator' : role);
  const finalUserAvatar = userAvatar || user?.profileImage || user?.photo || '';

  const isOwner = role === 'owner';

  const quickActions = [
    { label: 'Add Resident', icon: UserPlus, href: '/residents', desc: 'Register a new resident' },
    { label: 'Add Room', icon: BedDouble, href: '/rooms', desc: 'Create a new room space' },
    { label: 'Record Payment', icon: Wallet, href: '/payments', desc: 'Log rent or deposits received' },
    { label: 'Record Expense', icon: Receipt, href: '/owner/expense-dashboard', desc: 'File new purchase or utility bill' },
    { label: 'Add Complaint', icon: AlertTriangle, href: '/owner/dashboard', desc: 'Log warden or resident concern' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: colors.background.primary,
        color: colors.text.primary,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Desktop Sidebar */}
      <UnifiedSidebar
        menuItems={sidebarItems}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={onLogout}
        userName={finalUserName}
        userRole={finalUserRole}
        userAvatar={finalUserAvatar}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Unified Top Header */}
        <TopHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Header */}
        {showPageHeader && (
          <UnifiedPageHeader
            title={pageTitle}
            subtitle={pageSubtitle}
            breadcrumbs={breadcrumbs}
            backTo={backTo}
            onBack={onBack}
            actions={headerActions}
          />
        )}

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: `0 ${spacing.lg} ${spacing.lg}`,
            paddingBottom: '100px', // Account for mobile bottom nav
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {isOwner && (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="lg:hidden"
          aria-label="Quick action menu"
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '88px', // Safe offset above mobile bottom navigation
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: colors.accent.primary,
            color: '#ffffff',
            border: 'none',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(22, 163, 74, 0.45)',
            cursor: 'pointer',
            zIndex: 90,
          }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Quick Add Bottom Sheet Backdrop */}
      <div
        onClick={() => setShowQuickAdd(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 99,
          display: showQuickAdd ? 'block' : 'none',
        }}
      />

      {/* Quick Add Bottom Sheet content */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: showQuickAdd ? 0 : '-100%',
          background: colors.background.card,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderTop: `1px solid ${colors.border.default}`,
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 100,
          padding: `${spacing.lg} ${spacing.lg} max(${spacing.xl}, env(safe-area-inset-bottom))`,
          transition: 'bottom 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: typography.fontFamily,
        }}
      >
        {/* Sheet Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <div>
            <h2 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text.primary, margin: 0 }}>
              Quick Actions
            </h2>
            <p style={{ fontSize: typography.sizes.sm, color: colors.text.muted, margin: '2px 0 0' }}>
              Create resources instantly
            </p>
          </div>
          <button
            onClick={() => setShowQuickAdd(false)}
            aria-label="Close menu"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: radius.full,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text.muted,
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet List Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {quickActions.map((act, index) => {
            const IconComponent = act.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate(act.href);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  width: '100%',
                  padding: spacing.md,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radius.lg,
                  color: colors.text.primary,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: radius.md,
                    background: 'rgba(22, 163, 74, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.accent.primary,
                    flexShrink: 0,
                  }}
                >
                  <IconComponent size={20} />
                </div>
                <div>
                  <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold }}>
                    {act.label}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.text.muted, marginTop: '2px' }}>
                    {act.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <UnifiedMobileNav items={mobileNavItems} onFabClick={() => setShowQuickAdd(true)} />
    </div>
  );
}

export default UnifiedLayout;
