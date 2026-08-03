export const animations = {
  // Framer Motion presets
  pageLoad: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  cardHover: {
    whileHover: { y: -2, transition: { duration: 0.2 } },
  },
  buttonHover: {
    whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  },
  buttonTap: {
    whileTap: { scale: 0.98 },
  },
  // CSS transition values
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
};
