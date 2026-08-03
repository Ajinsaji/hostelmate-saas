/**
 * @deprecated Use UnifiedLayout directly. This wrapper exists for backward compatibility.
 */
import React from 'react';
import { UnifiedLayout } from '../design-system/layouts/UnifiedLayout';
import { getMenuConfig } from '../design-system/layouts/menuConfigs';

export default function DesktopShell({
  variant = 'owner',
  title,
  breadcrumbs,
  backTo,
  children,
}) {
  const config = getMenuConfig(variant);
  return (
    <UnifiedLayout
      role={variant}
      menuItems={config.sidebar}
      mobileItems={config.mobile}
      pageTitle={title}
      breadcrumbs={breadcrumbs}
      backTo={backTo}
    >
      {children}
    </UnifiedLayout>
  );
}
