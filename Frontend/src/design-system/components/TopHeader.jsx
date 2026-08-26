import React from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { useCurrentUser } from "../../contexts/HostelContext";
import NotificationBell from "../../components/NotificationBell";
import HostelSwitcher from "./HostelSwitcher";
import { useNavigate, useLocation } from "react-router-dom";

import ConnectionStatus from "../../components/ConnectionStatus";

import buildFileUrl from "../../utils/buildFileUrl";

export function TopHeader({ role, userName, userRole, userAvatar, onLogout, onMenuClick }) {
  const { colors, typography } = useTheme();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = role === 'admin' || role === 'superadmin' || location.pathname.startsWith('/admin');
  const displayName = userName || user?.ownerName || user?.name || (isAdmin ? "Admin Console" : "Owner");
  const avatarSrc = buildFileUrl(userAvatar || user?.profileImage || user?.photo);

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
      {/* Left section: Hamburger Menu & Hostel Selector or Admin Title */}
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

        {/* Current Hostel Selector Dropdown for Owner / Admin Badge for Admin */}
        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', border: `1px solid ${colors.border.default || '#202B45'}`, borderRadius: '10px' }}>
            <ShieldCheck size={18} style={{ color: colors.accent.primary || '#22C55E' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Admin Console</span>
          </div>
        ) : (
          <div style={{ minWidth: 0 }}>
            <HostelSwitcher />
          </div>
        )}
      </div>

      {/* Right section: Connection Status, Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <ConnectionStatus />
        {/* Notification Bell (Owner Only) */}
        {/* Notification Bell (Owner Only) */}
        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
            <NotificationBell />
          </div>
        )}

        {/* User Profile Avatar Button */}
        <button
          onClick={() => navigate(isAdmin ? '/admin/profile' : '/owner/profile')}
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
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
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

