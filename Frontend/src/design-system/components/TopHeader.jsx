import React from "react";
import { Menu, Search } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { useCurrentUser, useCurrentHostel } from "../../contexts/HostelContext";
import NotificationBell from "../../components/NotificationBell";
import HostelSwitcher from "./HostelSwitcher";
import { useNavigate } from "react-router-dom";

export function TopHeader({ onMenuClick }) {
  const { colors, typography } = useTheme();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const displayName = user?.ownerName || user?.name || "Owner";

  return (
    <header 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 16px',
        background: 'rgba(11, 18, 32, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
        height: '64px',
        boxSizing: 'border-box',
        zIndex: 40,
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Left section: Hamburger Menu & Hostel Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
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
            borderRadius: '12px',
            flexShrink: 0,
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Current Hostel Selector Dropdown */}
        <div style={{ minWidth: 0 }}>
          <HostelSwitcher />
        </div>
      </div>

      {/* Right section: Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Notification Bell */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
          <NotificationBell />
        </div>

        {/* User Profile Avatar Button */}
        <button
          onClick={() => navigate('/owner/profile')}
          aria-label="Profile settings"
          style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "50%",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            background: colors.background.elevated || "#131C2E",
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
            <div style={{ color: colors.text.primary || "#FFFFFF", fontSize: '14px', fontWeight: 700, fontFamily: typography.fontFamily }}>
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}

export default TopHeader;

