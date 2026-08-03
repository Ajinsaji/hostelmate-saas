import React, { useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { getMenuConfig } from './menuConfigs';
import UnifiedSidebar from './UnifiedSidebar';
import UnifiedMobileNav from './UnifiedMobileNav';
import UnifiedPageHeader from './UnifiedPageHeader';

/**
 * HostelMate Enterprise — Unified Layout
 *
 * The single layout component used across all roles.
 * Desktop: Sidebar (left) + Main content (right)
 * Mobile: Content + Bottom Navigation
 *
 * @param {string} role - 'owner' | 'admin' | 'warden' | 'cook' | 'accountant' | 'resident'
 * @param {Array} menuItems - Optional override for sidebar items
 * @param {Array} mobileItems - Optional override for mobile nav items
 * @param {ReactNode} children - Page content
 * @param {ReactNode} headerActions - Right-side actions for the page header
 * @param {Array} breadcrumbs - Array of { label, to? }
 * @param {string} pageTitle - Page title
 * @param {string} pageSubtitle - Page subtitle (optional)
 * @param {string|number} backTo - Back navigation target
 * @param {Function} onBack - Custom back handler
 * @param {Function} onLogout - Logout handler
 * @param {string} userName - Display name for sidebar profile
 * @param {string} userRole - Display role for sidebar profile
 * @param {string} userAvatar - Avatar URL for sidebar profile
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

  // Resolve menu config from role if not provided
  const config = getMenuConfig(role);
  const sidebarItems = menuItems || config.sidebar;
  const mobileNavItems = mobileItems || config.mobile;

  const showPageHeader = pageTitle || breadcrumbs?.length > 0;

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
        userName={userName}
        userRole={userRole}
        userAvatar={userAvatar}
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
