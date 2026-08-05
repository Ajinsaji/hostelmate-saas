import React, { useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { getMenuConfig } from './menuConfigs';
import UnifiedSidebar from './UnifiedSidebar';
import UnifiedMobileNav from './UnifiedMobileNav';
import UnifiedPageHeader from './UnifiedPageHeader';
import TopHeader from '../components/TopHeader';
import useSessionVerification from '../../hooks/useSessionVerification';
import PageLoader from '../../components/PageLoader';
import { useCurrentUser } from '../../contexts/HostelContext';

/**
 * HostelMate Enterprise — Unified Layout
 *
 * The single layout component used across all roles.
 * Desktop: Sidebar (left) + Top Header (above) + Main content (right)
 * Mobile: Content + Bottom Navigation
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
  const { colors, spacing } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { verifying } = useSessionVerification();
  const { user } = useCurrentUser();

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

      {/* Mobile Bottom Navigation */}
      <UnifiedMobileNav items={mobileNavItems} />
    </div>
  );
}

export default UnifiedLayout;
