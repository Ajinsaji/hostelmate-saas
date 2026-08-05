import React from 'react';
import { Menu, Search, ShieldCheck } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { useCurrentUser, useCurrentHostel } from "../../contexts/HostelContext";
import NotificationBell from "../../components/NotificationBell";

export function TopHeader({ onMenuClick }) {
  const { colors, typography, spacing, radius } = useTheme();
  const { user } = useCurrentUser();
  const { hostel } = useCurrentHostel();

  const now = new Date();
  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const dateStr = now.toLocaleDateString("en-IN", { 
    day: "numeric", 
    month: "short" 
  });

  const displayName = user?.ownerName || user?.name || "Owner";

  return (
    <header 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: `${spacing.sm} ${spacing.lg}`,
        background: 'rgba(11, 17, 32, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${colors.border.default}`,
        height: '64px',
        boxSizing: 'border-box',
        zIndex: 30,
      }}
    >
      {/* Left section: Hamburger menu & Greeting info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, minWidth: 0 }}>
        <button 
          onClick={onMenuClick}
          className="lg:hidden"
          style={{ 
            background: 'transparent',
            border: 'none',
            color: colors.text.primary,
            cursor: 'pointer',
            padding: spacing.xs,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, minWidth: 0 }}>
          <span style={{ fontWeight: typography.weights.semibold, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {greeting}, <span style={{ color: colors.accent.primary }}>{displayName}</span>
          </span>
          <span style={{ color: colors.text.disabled, fontSize: typography.sizes.xs }}>|</span>
          <span style={{ fontSize: typography.sizes.xs, color: colors.text.muted, fontWeight: typography.weights.medium, whiteSpace: 'nowrap' }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* Right section: Search, Status, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexShrink: 0 }}>
        
        {/* Active Hostel Indicator */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(22, 163, 74, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            fontSize: '11px',
            color: colors.accent.success,
            fontWeight: typography.weights.bold,
            fontFamily: typography.fontFamily,
          }}
          className="hidden md:flex"
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent.success, animation: 'pulse 2s infinite' }} />
          <span style={{ whiteSpace: 'nowrap' }}>{hostel?.name || 'Green Valley'}</span>
        </div>

        {/* Search Field (Compact) */}
        <div style={{ position: 'relative' }} className="hidden sm:block">
          <Search 
            size={14} 
            style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: colors.text.muted 
            }} 
          />
          <input 
            type="text" 
            placeholder="Search console..." 
            style={{
              width: '160px',
              padding: '6px 10px 6px 30px',
              borderRadius: radius.md,
              background: colors.background.elevated,
              border: `1px solid ${colors.border.default}`,
              color: colors.text.primary,
              fontSize: '12px',
              fontFamily: typography.fontFamily,
              outline: 'none',
            }}
          />
        </div>

        {/* Stateful Notification Bell Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </div>

        {/* User Profile Avatar */}
        <div 
          style={{ 
            width: "32px", 
            height: "32px", 
            borderRadius: radius.full,
            border: `1px solid ${colors.border.default}`,
            background: colors.background.elevated,
            overflow: "hidden",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {user?.profileImage || user?.photo ? (
            <img src={user.profileImage || user.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: colors.text.muted, fontSize: '12px', fontWeight: 'bold', fontFamily: typography.fontFamily }}>
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
