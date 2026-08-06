/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '390px',
      mobile: '412px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        // Background system
        'ds-bg-primary': '#0B1220',
        'ds-bg-secondary': '#0F172A',
        'ds-bg-card': '#131C2E',
        'ds-bg-elevated': '#1A2438',
        'ds-bg-sidebar': '#0B1220',
        'ds-bg-nav': '#0B1220',
        // Accent colors
        'ds-accent': '#22C55E',
        'ds-success': '#22C55E',
        'ds-warning': '#F59E0B',
        'ds-danger': '#EF4444',
        'ds-info': '#3B82F6',
        'ds-ai': '#6C4CF5',
        // Text
        'ds-text': '#FFFFFF',
        'ds-text-secondary': '#94A3B8',
        'ds-text-muted': '#94A3B8',
        'ds-text-disabled': '#64748B',
        // Border
        'ds-border': '#202B45',
        // Hover
        'ds-hover': '#1A263D',
        // Legacy aliases
        primary: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
          light: '#4ADE80',
        },
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        surface: {
          DEFAULT: '#131C2E',
          glass: 'rgba(19, 28, 46, 0.85)',
        },
        background: '#0B1220',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'ds-sm': '8px',
        'ds-md': '12px',
        'ds-lg': '16px',
        'ds-xl': '20px',
        'ds-2xl': '24px',
      },
      boxShadow: {
        'ds-sm': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'ds-md': '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
        'ds-lg': '0 10px 25px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)',
        'ds-glow-primary': '0 0 16px rgba(34, 197, 94, 0.25)',
        'ds-glow-ai': '0 0 16px rgba(108, 76, 245, 0.25)',
      },
    },
  },
  plugins: [],
};
