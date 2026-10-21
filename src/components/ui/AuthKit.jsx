import { motion } from "motion/react";
import LogoMark from "../LogoMark";
import { EASE_OUT, SPRING_BOUNCY } from "../../lib/motionConfig";

const COLOR = { hueso: "#FBF6EF", muted: "#8A8378", lima: "#C8FF4D", negro: "#0B0A09" };

// Marco de las pantallas de acceso (ingresar, registro, crear tienda): una
// tarjeta con resplandor verde y el logo que "rebota" al aparecer.
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        className="absolute pointer-events-none"
        style={{
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,255,77,0.14), transparent 65%)",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(10px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
        className="relative w-full max-w-sm rounded-3xl p-7"
        style={{ backgroundColor: "rgba(21,19,17,0.82)", border: "1px solid #2A2622", backdropFilter: "blur(14px)", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <motion.div initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={SPRING_BOUNCY} className="nexo-glow rounded-2xl">
            <LogoMark size={52} />
          </motion.div>
          <h1 className="text-2xl font-bold mt-4" style={{ color: COLOR.hueso }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1.5" style={{ color: COLOR.muted }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <p className="text-xs text-center mt-5" style={{ color: COLOR.muted }}>
            {footer}
          </p>
        )}
      </motion.div>
    </div>
  );
}

const FIELD_CLASS =
  "w-full mt-1.5 rounded-xl px-4 py-3 text-sm outline-none border border-[#2A2622] bg-[#0B0A09] text-[#FBF6EF] transition focus:border-[#C8FF4D] focus:shadow-[0_0_0_3px_rgba(200,255,77,0.12)] placeholder:text-[#8A8378]";

export function AuthField({ label, delay = 0, as = "input", ...props }) {
  const Tag = as;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + delay, duration: 0.4, ease: EASE_OUT }}>
      <label className="text-xs font-medium" style={{ color: COLOR.muted }}>
        {label}
      </label>
      <Tag className={`${FIELD_CLASS}${as === "textarea" ? " resize-none" : ""}`} {...props} />
    </motion.div>
  );
}

export function AuthButton({ children, loading, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading}
      className="nexo-glow w-full rounded-full py-3.5 text-sm font-semibold mt-2 disabled:opacity-60"
      style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
