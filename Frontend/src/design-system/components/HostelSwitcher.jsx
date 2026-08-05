import React, { useState } from 'react';
import { useCurrentUser, useCurrentHostel } from '../../contexts/HostelContext';
import { useTheme } from '../ThemeProvider';
import { Building, ChevronDown, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export function HostelSwitcher() {
  const { colors, spacing, radius, typography, shadows } = useTheme();
  const { user } = useCurrentUser();
  const { hostel, switchHostel } = useCurrentHostel();
  const [open, setOpen] = useState(false);

  const plan = user?.plan?.name || user?.subscription?.planName || 'Trial';
  const isPro = plan === 'Pro Plan' || plan === 'Enterprise' || (user?.hostels?.length > 1);

  // Data-driven hostels list from user profile or default list
  const hostelsList = user?.hostels || [
    { id: '1', name: 'Green Valley Hostel', residentsCount: 120, code: 'GV01' },
    { id: '2', name: 'Sunrise Hostel', residentsCount: 64, code: 'SR02' },
    { id: '3', name: 'Hill View Hostel', residentsCount: 210, code: 'HV03' }
  ];

  if (!isPro) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: radius.md,
          background: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${colors.border.default}`,
          fontFamily: typography.fontFamily,
          color: colors.text.primary,
        }}
      >
        <Building size={16} style={{ color: colors.accent.primary, flexShrink: 0 }} />
        <span style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {hostel?.name || 'Green Valley Hostel'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', fontFamily: typography.fontFamily }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: colors.background.elevated,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radius.md,
          padding: `${spacing.sm} ${spacing.md}`,
          color: colors.text.primary,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.accent.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border.default;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
          <Building size={16} style={{ color: colors.accent.primary, flexShrink: 0 }} />
          <span style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hostel?.name || 'Green Valley Hostel'}
          </span>
        </div>
        <ChevronDown size={14} style={{ color: colors.text.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            background: colors.background.card,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.md,
            marginBottom: '6px',
            zIndex: 100,
            boxShadow: shadows.elevated,
            overflow: 'hidden',
          }}
        >
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {hostelsList.map((h) => {
              const isActive = h.id === hostel.id;
              return (
                <button
                  key={h.id}
                  onClick={() => {
                    switchHostel(h);
                    setOpen(false);
                    toast.success(`Switched to ${h.name}`);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: `${spacing.sm} ${spacing.md}`,
                    background: isActive ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${colors.border.light}`,
                    color: colors.text.primary,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = colors.hover.default;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: typography.sizes.sm, fontWeight: isActive ? typography.weights.bold : typography.weights.medium }}>
                      {h.name}
                    </span>
                    {isActive && <Check size={14} style={{ color: colors.accent.success }} />}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.text.muted, marginTop: '2px' }}>
                    {h.residentsCount || h.memberCount || 0} Residents
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              toast.success("Create new hostel wizard initialized");
              setOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              padding: `${spacing.sm} ${spacing.md}`,
              background: 'rgba(255,255,255,0.02)',
              border: 'none',
              color: colors.accent.primary,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <Plus size={14} /> Add Hostel
          </button>
        </div>
      )}
    </div>
  );
}

export default HostelSwitcher;
