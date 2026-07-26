export const animations = {
  pageLoad: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: "easeOut" }
  },
  cardHover: {
    whileHover: { scale: 0.98, transition: { duration: 0.1 } }
  },
  buttonTap: {
    whileTap: { scale: 0.96 }
  }
};
