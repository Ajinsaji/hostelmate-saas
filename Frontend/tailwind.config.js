/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#047857', // emerald-700
          dark: '#064e3b',    // emerald-900
          light: '#10b981',   // emerald-500
        },
        gold: {
          DEFAULT: '#d97706', // amber-600
          light: '#f59e0b',   // amber-500
        },
        surface: {
          DEFAULT: '#ffffff',
          glass: 'rgba(255, 255, 255, 0.8)',
        },
        background: '#f8fafc', // slate-50
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
