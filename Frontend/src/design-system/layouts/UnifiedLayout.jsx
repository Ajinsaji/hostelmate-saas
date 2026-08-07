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
import PageLoader from '../../components/PageLoader';
import { useCurrentUser } from '../../contexts/HostelContext';
import { UserPlus, BedDouble, Wallet, Receipt, AlertTriangle, UserCog, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export function UnifiedLayout({
  role = 'owner',
  menuItems,
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
  const [showMoreActions, setShowMoreActions] = useState(false);
  const { verifying } = useSessionVerification();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const config = getMenuConfig(role);
  const sidebarItems = menuItems || config.sidebar;

  const showPageHeader = pageTitle || breadcrumbs?.length > 0;

  if (verifying) {
    return <PageLoader />;
  }

  const finalUserName = userName || user?.ownerName || user?.name || 'Owner';
  const finalUserRole = userRole || (role === 'owner' ? 'Hostel Owner' : role);
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
          background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(7,12,22,0.98) 100%)',
        }}
      >
        {/* Unified Top Header */}
        <TopHeader onMenuClick={() => setMobileDrawerOpen(true)} />

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
            padding: '24px',
            paddingBottom: '110px',
            maxWidth: '1400px',
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
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Quick Add Bottom Sheet */}
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

      {/* Mobile 5-Tab Bottom Navigation */}
      <UnifiedMobileNav
        onQuickAddClick={() => setShowQuickAdd(true)}
        onMoreClick={() => setMobileDrawerOpen(true)}
      />
    </div>
  );
}

export default UnifiedLayout;
