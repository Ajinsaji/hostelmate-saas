import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import SupportBanner from "./SupportBanner";
import AdminRightDrawer from "../components/AdminRightDrawer";
import CommandPalette from "../components/CommandPalette";
import { DrawerProvider } from "../contexts/DrawerContext";
import { UnifiedLayout } from "../../design-system/layouts/UnifiedLayout";
import { adminMenuItems, adminMobileItems } from "../../design-system/layouts/menuConfigs";

/**
 * @deprecated Use UnifiedLayout directly. This wrapper exists for backward compatibility.
 */
export const AdminLayout = React.memo(() => {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Command Palette global shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/admin/login";
  };

  return (
    <DrawerProvider>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <AdminRightDrawer />
      <SupportBanner />

      <UnifiedLayout
        role="admin"
        menuItems={adminMenuItems}
        mobileItems={adminMobileItems}
        userName="Admin Console"
        userRole="Administrator"
        onLogout={handleLogout}
      >
        <Outlet />
      </UnifiedLayout>
    </DrawerProvider>
  );
});

export default AdminLayout;
