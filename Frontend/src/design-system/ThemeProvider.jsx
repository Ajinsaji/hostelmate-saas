import React, { createContext, useContext, useMemo } from 'react';
import { colors } from './tokens/colors';
import { spacing } from './tokens/spacing';
import { typography } from './tokens/typography';
import { radius } from './tokens/radius';
import { shadows } from './tokens/shadows';
import { animations } from './tokens/animations';

const ThemeContext = createContext(null);

/**
 * HostelMate Enterprise Design System Theme Provider
 * 
 * Provides access to all design tokens via useTheme() hook.
 * Wraps the entire application in main.jsx.
 * 
 * Future branding changes only require editing token files.
 */
export function ThemeProvider({ children }) {
  const theme = useMemo(() => ({
    colors,
    spacing,
    typography,
    radius,
    shadows,
    animations,
  }), []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access design system tokens.
 * 
 * Usage:
 *   const { colors, spacing, radius } = useTheme();
 *   style={{ background: colors.background.card }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
export default ThemeProvider;
