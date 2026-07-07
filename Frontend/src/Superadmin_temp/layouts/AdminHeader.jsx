import React from "react";
import { Menu } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { COLORS } from "../constants/theme";

export const AdminHeader = React.memo(({
  onMenuClick // for mobile collapsible navigation
}) => {
  return (
    <header 
      className="h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: "rgba(11, 17, 32, 0.6)",
        borderColor: COLORS.border
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile toggle button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition"
          aria-label="Toggle menu navigation"
        >
          <Menu size={20} style={{ color: COLORS.textMain }} />
        </button>

        {/* Breadcrumb pathing */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Cmd-K command search */}
        <GlobalSearch />

        {/* Bell badge */}
        <NotificationBell />
        
        {/* Profile user info */}
        <ProfileMenu />
      </div>
    </header>
  );
});

export default AdminHeader;
