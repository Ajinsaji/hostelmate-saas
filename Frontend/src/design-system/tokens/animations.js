export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  scaleUp: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  buttonTap: {
    whileTap: { scale: 0.98 },
  },
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
  },
};

export default animations;
