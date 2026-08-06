import React from "react";
import { Menu, Search } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { useCurrentUser, useCurrentHostel } from "../../contexts/HostelContext";
import NotificationBell from "../../components/NotificationBell";
import HostelSwitcher from "./HostelSwitcher";
import { useNavigate } from "react-router-dom";

export function TopHeader({ onMenuClick }) {
  const { colors, typography, spacing, radius } = useTheme();
  const { user } = useCurrentUser();
  const { hostel } = useCurrentHostel();
  const navigate = useNavigate();

  const displayName = user?.ownerName || user?.name || "Owner";

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  return (
    <header 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: `${spacing.sm || "12px"} ${spacing.lg || "20px"}`,
        background: 'rgba(11, 18, 32, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
        height: '68px',
        boxSizing: 'border-box',
        zIndex: 30,
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Left section: Hamburger menu & Hostel Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md || "16px", minWidth: 0 }}>
        <button 
          onClick={onMenuClick}
          className="lg:hidden"
          style={{ 
            background: 'transparent',
            border: 'none',
            color: colors.text.primary || "#FFFFFF",
            cursor: 'pointer',
            width: "44px",
            height: "44px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Current Hostel Selector Dropdown */}
        <HostelSwitcher />
      </div>

      {/* Right section: Search icon trigger, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm || "12px", flexShrink: 0 }}>
        
        {/* Search Icon button (triggers Global Search modal) */}
        <button
          onClick={handleOpenSearch}
          aria-label="Search"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: radius.full || "9999px",
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            color: colors.text.primary || "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 150ms ease-out",
          }}
        >
          <Search size={18} />
        </button>

        {/* Notification Bell */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </div>

        {/* User Profile Button */}
        <button
          onClick={() => navigate('/owner/profile')}
          aria-label="Profile settings"
          style={{ 
            width: "40px", 
            height: "40px", 
            borderRadius: radius.full || "9999px",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            background: colors.background.elevated || "#1A2438",
            overflow: "hidden",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {user?.profileImage || user?.photo ? (
            <img src={user.profileImage || user.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: colors.text.muted || "#94A3B8", fontSize: '13px', fontWeight: 'bold', fontFamily: typography.fontFamily }}>
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}

export default TopHeader;
