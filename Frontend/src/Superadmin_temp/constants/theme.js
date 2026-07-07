// Design System Tokens for HostelMate Super Admin 3.0

export const COLORS = {
  // Brand Colors
  primary: "#0F5D46",       // Deep Emerald
  primaryLight: "#0F7A5E",  // Mint/Glow Green
  primaryDark: "#0B4A37",   // Dark Emerald
  
  // Theme Backgrounds
  background: "#0B1120",    // Root Dark Space
  surface: "#111827",       // Dark Sheet Card surface
  surfaceLight: "rgba(255, 255, 255, 0.04)",
  surfaceGlass: "rgba(23, 32, 51, 0.72)", // Glass Card Backdrop
  
  // Border
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.18)",
  borderGlow: "rgba(20, 241, 217, 0.20)",
  
  // Accents
  accentGold: "#D4AF37",    // Gold accents / premium plans
  accentGoldLight: "#E2C95E",
  
  // Status Colors
  success: "#059669",       // Paid / active / verified
  successBg: "rgba(5, 150, 105, 0.12)",
  
  warning: "#D97706",       // Inactive / pending / trials
  warningBg: "rgba(217, 119, 6, 0.12)",
  
  error: "#DC2626",         // Churn risk / failed / expired
  errorBg: "rgba(220, 38, 38, 0.12)",
  
  info: "#3B82F6",          // Support / activity
  infoBg: "rgba(59, 130, 246, 0.12)",
  
  // Text Colors
  textMain: "#FFFFFF",
  textSecondary: "#D1D5DB",
  textMuted: "rgba(209, 213, 219, 0.75)",
  textDark: "#0B1120",
};

export const SPACING = {
  xs: "4px",    // space-1
  sm: "8px",    // space-2
  md: "16px",   // space-4
  lg: "24px",   // space-6
  xl: "32px",   // space-8
  xxl: "48px",  // space-12
};

export const TYPOGRAPHY = {
  fontFamily: "'Outfit', sans-serif",
  sizes: {
    xs: "11px",
    sm: "13px",
    base: "15px",
    lg: "18px",
    xl: "22px",
    xxl: "30px",
  },
  weights: {
    light: "300",
    regular: "400",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  }
};

export const RADIUS = {
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "26px",
  full: "9999px",
};

export const SHADOWS = {
  sm: "0 10px 30px rgba(15, 93, 70, 0.10)",
  md: "0 18px 60px rgba(15, 93, 70, 0.16)",
  lg: "0 24px 70px rgba(0, 0, 0, 0.45)",
  glass: "0 10px 30px rgba(15, 93, 70, 0.12)",
};

export const ANIMATIONS = {
  transitionFast: "all 0.15s ease",
  transitionNormal: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  slideUp: "animate-slide-up",
};

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 2000,
  fixed: 3000,
  modal: 4000,
  popover: 5000,
  toast: 6000,
};

export const GLASS_VARIABLES = {
  backdropFilter: "blur(18px)",
  webkitBackdropFilter: "blur(18px)",
};
