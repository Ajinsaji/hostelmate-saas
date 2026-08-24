import { useState, useEffect } from 'react';
import { useCurrentUser, useCurrentHostel } from '../../contexts/HostelContext';
import { useTheme } from '../ThemeProvider';
import { Building, ChevronDown, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export function HostelSwitcher() {
  const { colors, spacing, radius, typography, shadows } = useTheme();
  const { user } = useCurrentUser();
  const { hostel, switchHostel } = useCurrentHostel();
  const [open, setOpen] = useState(false);
  const [hostelsList, setHostelsList] = useState([]);

  const plan = user?.plan?.name || user?.subscription?.planName || 'Trial';
  // If plan is base or trial (and has <=1 hostels), it is basic.
  const isPro = ["pro", "enterprise"].includes(plan.toLowerCase()) || hostelsList.length > 1;

  useEffect(() => {
    let isMounted = true;
    const fetchHostels = async () => {
      try {
        const response = await api.get("/api/v2/workspaces/hostels");
        if (response.data && response.data.success && isMounted) {
          setHostelsList(response.data.hostels || []);
        }
      } catch (err) {
        console.warn("Failed to load workspace hostels list", err);
      }
    };

    fetchHostels();
    return () => {
      isMounted = false;
    };
  }, []);

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
          {hostel?.name || hostel?.hostelName || user?.hostelName || 'Hostel'}
        </span>
      </div>
    );
  }

  const currentHostelId = hostel?.id || hostel?._id;

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
            {hostel?.name || hostel?.hostelName || user?.hostelName || 'Hostel'}
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
              const hId = h._id || h.id;
              const isActive = String(hId) === String(currentHostelId);
              return (
                <button
                  key={hId}
                  onClick={() => {
                    switchHostel({
                      id: hId,
                      name: h.hostelName || h.name,
                      address: h.address,
                    });
                    setOpen(false);
                    toast.success(`Switched to ${h.hostelName || h.name}`);
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
                      {h.hostelName || h.name}
                    </span>
                    {isActive && <Check size={14} style={{ color: colors.accent.success }} />}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.text.muted, marginTop: '2px' }}>
                    {h.city ? `${h.city} • ` : ""}{h.hostelType || "Hostel"}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              // Redirect to Dashboard Workspace Overview where adding hostel modal lives
              window.location.href = "/dashboard";
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
