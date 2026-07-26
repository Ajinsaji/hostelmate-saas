// DashboardLayout is just a wrapper around OwnerLayout with specific dashboard context if needed.
// For now, it re-exports OwnerLayout's structure to keep concerns separated.
import { OwnerLayout } from "./OwnerLayout";

export function DashboardLayout({ children, ownerPhotoUrl, notificationCount }) {
  return (
    <OwnerLayout ownerPhotoUrl={ownerPhotoUrl} notificationCount={notificationCount}>
      {children}
    </OwnerLayout>
  );
}
