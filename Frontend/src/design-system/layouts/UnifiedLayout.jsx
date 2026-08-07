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

  // Top High-Frequency Owner Tasks
  const topPrimaryActions = [
    { label: 'Add Resident', icon: UserPlus, href: '/residents', desc: 'Register a new resident' },
    { label: 'Collect Payment', icon: Wallet, href: '/payments', desc: 'Log rent or deposits received' },
    { label: 'View Residents', icon: Users, href: '/residents', desc: 'Browse resident directory' },
    { label: 'View Pending Rent', icon: Clock, href: '/payments?tab=pending', desc: 'Check overdue rent balances' },
    { label: 'View Complaints', icon: AlertTriangle, href: '/owner/dashboard', desc: 'Review active issues' },
  ];

  // Secondary Actions
  const secondaryActions = [
    { label: 'Add Room', icon: BedDouble, href: '/rooms', desc: 'Create a new room space' },
    { label: 'Add Expense', icon: Receipt, href: '/owner/expense-dashboard', desc: 'File new purchase or utility bill' },
    { label: 'Add Staff', icon: UserCog, href: '/owner/staff-management', desc: 'Add warden or staff member' },
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
        title="High-Frequency Actions"
        subtitle="Top owner tasks reachable in 3 taps"
      >
        <div className="space-y-2">
          {topPrimaryActions.map((act, index) => {
            const IconComponent = act.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate(act.href);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition text-left border"
                style={{ borderColor: colors.border.default || '#202B45', background: 'rgba(255,255,255,0.03)', minHeight: '48px' }}
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <IconComponent size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: typography.weights.bold, color: '#FFFFFF' }}>{act.label}</div>
                  <div style={{ fontSize: '12px', color: colors.text.secondary || '#94A3B8' }}>{act.desc}</div>
                </div>
              </button>
            );
          })}

          {/* Secondary Actions Collapsible */}
          <div className="pt-2">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1"
            >
              {showMoreActions ? 'Hide Secondary Actions' : 'More Actions'}
              {showMoreActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showMoreActions && (
              <div className="space-y-2 pt-2">
                {secondaryActions.map((act, index) => {
                  const IconComponent = act.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setShowQuickAdd(false);
                        navigate(act.href);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition text-left border"
                      style={{ borderColor: colors.border.default || '#202B45', background: 'rgba(255,255,255,0.03)', minHeight: '48px' }}
                    >
                      <div className="p-2 rounded-lg bg-white/5 text-slate-300">
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: typography.weights.bold, color: '#FFFFFF' }}>{act.label}</div>
                        <div style={{ fontSize: '12px', color: colors.text.secondary || '#94A3B8' }}>{act.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
