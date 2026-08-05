/**
 * @deprecated Use UnifiedLayout directly. This wrapper exists for backward compatibility.
 */
import React from 'react';
import { UnifiedLayout } from './UnifiedLayout';
import { ownerMenuItems, ownerMobileItems } from './menuConfigs';

export function OwnerLayout({ children, ownerPhotoUrl, ...props }) {
  return (
    <UnifiedLayout
      role="owner"
      menuItems={ownerMenuItems}
      mobileItems={ownerMobileItems}
      userAvatar={ownerPhotoUrl}
      userName="Owner"
      userRole="Owner"
      {...props}
    >
      {children}
    </UnifiedLayout>
  );
}

export default OwnerLayout;
