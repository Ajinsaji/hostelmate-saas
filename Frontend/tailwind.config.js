/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background system
        'ds-bg-primary': '#0B1120',
        'ds-bg-secondary': '#111827',
        'ds-bg-card': '#162032',
        'ds-bg-elevated': '#1C2740',
        'ds-bg-sidebar': '#0F172A',
        'ds-bg-nav': '#101827',
        // Accent colors
        'ds-accent': '#16A34A',
        'ds-success': '#22C55E',
        'ds-warning': '#F59E0B',
        'ds-danger': '#EF4444',
        'ds-info': '#3B82F6',
        'ds-ai': '#6C4CF5',
        // Text
        'ds-text': '#FFFFFF',
        'ds-text-secondary': '#CBD5E1',
        'ds-text-muted': '#94A3B8',
        'ds-text-disabled': '#64748B',
        // Border
        'ds-border': '#22304A',
        // Hover
        'ds-hover': '#1E2B44',
        // Legacy aliases (keep for backward compatibility, remove in Phase 8)
        primary: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
          light: '#22C55E',
        },
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        surface: {
          DEFAULT: '#162032',
          glass: 'rgba(22, 32, 50, 0.72)',
        },
        background: '#0B1120',
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
        'ds-glow-primary': '0 0 20px rgba(22, 163, 74, 0.3)',
        'ds-glow-ai': '0 0 20px rgba(108, 76, 245, 0.3)',
      },
    },
  },
  plugins: [],
};
