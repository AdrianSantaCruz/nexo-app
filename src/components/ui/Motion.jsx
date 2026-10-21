import { motion } from "motion/react";
import { EASE_OUT, staggerContainer, staggerItem } from "../../lib/motionConfig";

// Fundido al cambiar de página. Solo opacidad (sin transform): un transform
// en el contenedor rompería los elementos `position: fixed` (modales, flechas
// del feed) que viven dentro de las páginas.
export function PageTransition({ children, routeKey }) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  );
}

// Aparece subiendo suavemente; `delay` permite escalonar elementos a mano.
export function Reveal({ children, delay = 0, y = 16, className, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Contenedor que hace aparecer a sus hijos (StaggerItem) uno tras otro.
export function Stagger({ children, className, style, stagger = 0.06, delay = 0 }) {
  return (
    <motion.div variants={staggerContainer(stagger, delay)} initial="hidden" animate="show" className={className} style={style}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }) {
  return (
    <motion.div variants={staggerItem} className={className} style={style}>
      {children}
    </motion.div>
  );
}

export function Skeleton({ className = "", style }) {
  return <div className={`nexo-skeleton rounded-lg ${className}`} style={style} />;
}

// Estado vacío con un ícono flotante, igual que en la app móvil.
export function EmptyState({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 max-w-sm mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <div
          className="nexo-float w-20 h-20 rounded-3xl flex items-center justify-center mb-5 nexo-glow"
          style={{ backgroundColor: "#1E1B18", border: "1px solid rgba(200,255,77,0.22)" }}
        >
          <Icon size={32} style={{ color: "#C8FF4D" }} />
        </div>
      </motion.div>
      <Reveal delay={0.1}>
        <h2 className="text-xl font-semibold" style={{ color: "#FBF6EF" }}>
          {title}
        </h2>
      </Reveal>
      <Reveal delay={0.18}>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "#8A8378" }}>
          {subtitle}
        </p>
      </Reveal>
      {children && (
        <Reveal delay={0.26} className="mt-6 w-full flex flex-col items-center gap-2">
          {children}
        </Reveal>
      )}
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return (
    <motion.span
      className="inline-block rounded-full"
      style={{ width: size, height: size, border: "2px solid rgba(11,10,9,0.25)", borderTopColor: "#0B0A09" }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
    />
  );
}
