import React from "react";
import { Menu, Sparkles, Activity, HelpCircle, Moon } from "lucide-react";
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

        <div className="hidden md:flex items-center gap-2 mr-2">
          {/* Platform Status */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">All Systems Operational</span>
          </button>
          
          {/* AI Assistant */}
          <button className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-indigo-400 group relative">
            <Sparkles size={16} className="group-hover:animate-pulse" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">AI Assistant</span>
          </button>

          {/* Support */}
          <button className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-slate-400 hover:text-white">
            <HelpCircle size={16} />
          </button>

          {/* Theme Switch */}
          <button className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition text-slate-400 hover:text-white">
            <Moon size={16} />
          </button>
        </div>

        {/* Bell badge */}
        <NotificationBell />
        
        {/* Profile user info */}
        <ProfileMenu />
      </div>
    </header>
  );
});

export default AdminHeader;
