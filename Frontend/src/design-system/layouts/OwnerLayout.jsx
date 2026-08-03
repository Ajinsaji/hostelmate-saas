/**
 * @deprecated Use UnifiedLayout directly. This wrapper exists for backward compatibility.
 */
import React from 'react';
import { UnifiedLayout } from './UnifiedLayout';
import { ownerMenuItems, ownerMobileItems } from './menuConfigs';

export function OwnerLayout({ children, ownerPhotoUrl, notificationCount = 0 }) {
  return (
    <UnifiedLayout
      role="owner"
      menuItems={ownerMenuItems}
      mobileItems={ownerMobileItems}
      userAvatar={ownerPhotoUrl}
      userName="Owner"
      userRole="Owner"
    >
      {children}
    </UnifiedLayout>
  );
}
