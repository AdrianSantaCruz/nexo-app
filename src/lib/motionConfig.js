// Parámetros de animación compartidos por toda la web, para que el sitio se
// sienta coherente (mismos resortes y curvas en todas partes).

export const EASE_OUT = [0.22, 1, 0.36, 1];

export const SPRING = { type: "spring", stiffness: 380, damping: 28 };
export const SPRING_SOFT = { type: "spring", stiffness: 260, damping: 26 };
export const SPRING_BOUNCY = { type: "spring", stiffness: 500, damping: 18 };

export const TAP = { scale: 0.96 };
export const HOVER_LIFT = { y: -4, transition: SPRING_SOFT };

export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } },
};
