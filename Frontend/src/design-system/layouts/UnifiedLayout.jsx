import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { getMenuConfig } from './menuConfigs';
import UnifiedSidebar from './UnifiedSidebar';
import UnifiedMobileNav from './UnifiedMobileNav';
import UnifiedPageHeader from './UnifiedPageHeader';
import TopHeader from '../components/TopHeader';
import BottomSheet from '../components/BottomSheet';
import MobileDrawer from '../components/MobileDrawer';
import useSessionVerification from '../../hooks/useSessionVerification';
import useIsMobile from '../../hooks/useIsMobile';
import PageLoader from '../../components/PageLoader';
import { useCurrentUser } from '../../contexts/HostelContext';
import { UserPlus, BedDouble, Wallet, Receipt, AlertTriangle } from 'lucide-react';

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
  const { colors, typography } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { verifying } = useSessionVerification();
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const config = getMenuConfig(role);
  const sidebarItems = menuItems || config?.sidebar || [];
  const mobileNavItems = mobileItems || config?.mobile || [];

  const showPageHeader = !isMobile && Boolean(pageTitle || breadcrumbs?.length > 0);

  if (verifying) {
    return <PageLoader />;
  }

  const finalUserName = userName || user?.ownerName || user?.name || (role === 'admin' || role === 'superadmin' ? 'Admin Console' : 'Owner');
  const finalUserRole = userRole || (role === 'owner' ? 'Hostel Owner' : role === 'admin' || role === 'superadmin' ? 'Administrator' : role);
  const finalUserAvatar = userAvatar || user?.profileImage || user?.photo || '';

  // Top High-Frequency Owner FAB Actions
  const fabActions = [
    { label: 'Add Resident', icon: UserPlus, href: '/residents?action=add', desc: 'Register a new resident' },
    { label: 'Add Room', icon: BedDouble, href: '/rooms?action=add', desc: 'Create a new room space' },
    { label: 'Collect Payment', icon: Wallet, href: '/payments?action=collect', desc: 'Log rent or deposits received' },
    { label: 'Add Expense', icon: Receipt, href: '/owner/expense-dashboard?action=add', desc: 'File purchase or utility bill' },
    { label: 'Register Complaint', icon: AlertTriangle, href: '/owner/dashboard?action=complaint', desc: 'Log resident complaint' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: colors.background.primary || '#0B1220',
        color: colors.text.primary || '#FFFFFF',
        fontFamily: typography.fontFamily,
      }}
    >
      {!isMobile && (
        <UnifiedSidebar
          role={role}
          menuItems={sidebarItems}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={onLogout}
          userName={finalUserName}
          userRole={finalUserRole}
          userAvatar={finalUserAvatar}
        />
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
          background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(7,12,22,0.98) 100%)',
        }}
      >
        {/* Unified Top Header */}
        <TopHeader
          role={role}
          userName={finalUserName}
          userRole={finalUserRole}
          userAvatar={finalUserAvatar}
          onLogout={onLogout}
          onMenuClick={() => setMobileDrawerOpen(true)}
        />

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

        {/* Page Content Centered 1400px Max Width with 24px Padding */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? '16px 16px 110px' : '24px',
            paddingBottom: isMobile ? '116px' : '110px',
            maxWidth: isMobile ? '100%' : '1400px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Redesigned Drawer */}
      <MobileDrawer
        role={role}
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        menuItems={sidebarItems}
        userName={finalUserName}
        userRole={finalUserRole}
        userAvatar={finalUserAvatar}
        onLogout={onLogout}
      />

      {/* Quick Add Bottom Sheet (Owner Only) */}
      {role !== 'admin' && role !== 'superadmin' && (
        <BottomSheet
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          title="Quick Actions"
          subtitle="Perform common owner tasks in 1-2 taps"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fabActions.map((act, index) => {
              const IconComponent = act.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setShowQuickAdd(false);
                    navigate(act.href);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${colors.border.default || '#202B45'}`,
                    background: 'rgba(255, 255, 255, 0.03)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '48px',
                  }}
                >
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.12)', color: colors.accent.primary || '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{act.label}</div>
                    <div style={{ fontSize: '12px', color: colors.text.secondary || '#94A3B8' }}>{act.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}

      {/* Mobile Bottom Navigation */}
      <UnifiedMobileNav
        role={role}
        mobileItems={mobileNavItems}
        onQuickAddClick={() => setShowQuickAdd(true)}
        onMoreClick={() => setMobileDrawerOpen(true)}
      />
    </div>
  );
}

export default UnifiedLayout;
