import { useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Home,
  Users,
  BedDouble,
  Wallet,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useCurrentUser, useCurrentHostel } from '../../contexts/HostelContext';
import HostelSwitcher from './HostelSwitcher';

const drawerSections = [
  {
    title: 'MAIN',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: Home, href: '/owner/dashboard' }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { key: 'residents', label: 'Residents', icon: Users, href: '/residents' },
      { key: 'rooms', label: 'Rooms', icon: BedDouble, href: '/rooms' },
      { key: 'admissions', label: 'Admissions', icon: Users, href: '/owner/pending-admissions' }
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { key: 'payments', label: 'Payments', icon: Wallet, href: '/payments' },
      { key: 'expenses', label: 'Expenses', icon: Receipt, href: '/owner/expense-dashboard' }
    ]
  },
  {
    title: 'BUSINESS',
    items: [
      { key: 'reports', label: 'Reports', icon: FileText, href: '/reports' },
      { key: 'analytics', label: 'Analytics', icon: BarChart3, href: '/owner/business-intelligence' }
    ]
  },
  {
    title: 'MORE',
    items: [
      { key: 'settings', label: 'Settings', icon: Settings, href: '/owner/hostel-settings' },
      { key: 'support', label: 'Support', icon: HelpCircle, href: '/owner/profile' }
    ]
  }
];

export const MobileDrawer = memo(function MobileDrawer({ isOpen, onClose }) {
  const { colors, radius } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();
  const { hostel } = useCurrentHostel();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeHostelName = hostel?.name || hostel?.hostelName || 'Green Valley Hostel';
  const userName = user?.ownerName || user?.name || 'Ajin KS';
  const userRole = user?.role ? (user.role === 'owner' ? 'Hostel Owner' : user.role) : 'Hostel Owner';
  const planName = user?.plan?.name || user?.subscription?.planName || 'Trial Plan';

  const handleSearchClick = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-global-search'));
  };

  const handleNavClick = (href) => {
    onClose();
    navigate(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          {/* Backdrop Blur (12px) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Drawer Panel: Width 72%, Max Width 320px */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '72%',
              maxWidth: '320px',
              height: '100vh',
              background: colors.background.primary || '#0B1220',
              borderRight: `1px solid ${colors.border.default || '#202B45'}`,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10000,
              boxShadow: '8px 0 32px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Header: Compact Brand & Hostel Switcher */}
            <div
              style={{
                padding: '16px 16px 12px',
                borderBottom: `1px solid ${colors.border.default || '#202B45'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={16} style={{ color: colors.accent.primary || '#22C55E' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                      HostelMate
                    </span>
                    <span style={{ fontSize: '10px', color: colors.text.secondary || '#94A3B8', marginLeft: '4px' }}>
                      Enterprise
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close drawer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.text.secondary || '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Compact Hostel Selector */}
              <div style={{ marginTop: '2px' }}>
                <HostelSwitcher />
              </div>
            </div>

            {/* Search Trigger */}
            <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
              <button
                onClick={handleSearchClick}
                aria-label="Tap to search"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: colors.background.card || '#131C2E',
                  border: `1px solid ${colors.border.default || '#202B45'}`,
                  borderRadius: radius.md || '10px',
                  color: colors.text.secondary || '#94A3B8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Search size={18} style={{ color: colors.text.secondary || '#94A3B8' }} />
                <span>Tap to search...</span>
              </button>
            </div>

            {/* Flat Grouped Navigation */}
            <nav
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {drawerSections.map((section) => (
                <div key={section.title}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: colors.text.disabled || '#64748B',
                      letterSpacing: '0.1em',
                      padding: '4px 8px 6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {section.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href || (item.href !== '/owner/dashboard' && location.pathname.startsWith(item.href));
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavClick(item.href)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            borderLeft: isActive ? `3px solid ${colors.accent.primary || '#22C55E'}` : '3px solid transparent',
                            background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                            color: isActive ? '#FFFFFF' : colors.text.secondary || '#94A3B8',
                            fontSize: '14px',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <Icon size={22} style={{ color: isActive ? (colors.accent.primary || '#22C55E') : (colors.text.secondary || '#94A3B8') }} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Compressed Profile Card (Max Height 110px) */}
            <div
              style={{
                maxHeight: '110px',
                borderTop: `1px solid ${colors.border.default || '#202B45'}`,
                padding: '12px 16px',
                background: colors.background.card || '#131C2E',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userName}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.text.secondary || '#94A3B8',
                      margin: '2px 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userRole} • {activeHostelName}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.accent.primary || '#22C55E',
                      margin: '2px 0 0',
                    }}
                  >
                    {planName}
                  </div>
                </div>

                <button
                  onClick={() => handleNavClick('/owner/profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    background: 'transparent',
                    border: 'none',
                    color: colors.accent.primary || '#22C55E',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >
                  Settings <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default MobileDrawer;
