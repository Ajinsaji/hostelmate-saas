import { Menu, ShieldCheck, Home } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { useCurrentUser } from "../../contexts/HostelContext";
import NotificationBell from "../../components/NotificationBell";
import HostelSwitcher from "./HostelSwitcher";
import { useNavigate, useLocation } from "react-router-dom";

import ConnectionStatus from "../../components/ConnectionStatus";

import buildFileUrl from "../../utils/buildFileUrl";

export function TopHeader({ role, userName, userAvatar, onMenuClick }) {
  const { colors, typography } = useTheme();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = role === 'admin' || role === 'superadmin' || location.pathname.startsWith('/admin');
  const displayName = userName || user?.ownerName || user?.name || (isAdmin ? "Admin Console" : "Owner");
  const avatarSrc = buildFileUrl(userAvatar || user?.profileImage || user?.photo);
  const isOwnerDashboard = role === 'owner' && location.pathname === '/owner/dashboard';

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
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {/* On mobile owner dashboard: Show polished brand */}
        {isOwnerDashboard && (
          <div
            onClick={() => navigate('/owner/dashboard')}
            className="flex lg:hidden items-center gap-2 cursor-pointer"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                flexShrink: 0,
              }}
            >
              <Home size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                <span style={{ color: '#FFFFFF' }}>Hostel</span>
                <span style={{ color: '#22C55E' }}>Mate</span>
              </div>
              <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, letterSpacing: '0.01em', marginTop: '1px' }}>
                Manage Smarter, Live Better
              </span>
            </div>
          </div>
        )}

        {/* Hamburger menu: on mobile when NOT owner dashboard */}
        <button 
          onClick={onMenuClick}
          className={`lg:hidden ${isOwnerDashboard ? 'hidden' : 'flex'}`}
          style={{ 
            background: 'transparent',
            border: 'none',
            color: colors.text.primary || "#FFFFFF",
            cursor: 'pointer',
            width: "44px",
            height: "44px",
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            flexShrink: 0,
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Current Hostel Selector Dropdown for Owner / Admin Badge for Admin (desktop or non-dashboard mobile) */}
        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', border: `1px solid ${colors.border.default || '#202B45'}`, borderRadius: '10px' }}>
            <ShieldCheck size={18} style={{ color: colors.accent.primary || '#22C55E' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Admin Console</span>
          </div>
        ) : (
          <div className={`${isOwnerDashboard ? 'hidden lg:block' : 'block'}`} style={{ minWidth: 0 }}>
            <HostelSwitcher />
          </div>
        )}
      </div>

      {/* Right section: Connection Status, Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <ConnectionStatus />

        {/* Notification Bell (Owner Only) - circular container matching mockup */}
        {!isAdmin && (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#162238",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NotificationBell />
          </div>
        )}

        {/* User Profile Avatar Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => navigate(isAdmin ? '/admin/profile' : '/owner/profile')}
            aria-label="Profile settings"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: `1px solid rgba(34, 197, 94, 0.4)`,
              background: '#0F382A',
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
              <div style={{ color: '#22C55E', fontSize: '15px', fontWeight: 700, fontFamily: typography.fontFamily }}>
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;

