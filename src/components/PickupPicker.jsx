import { AnimatePresence, motion } from "motion/react";
import { MapPin, MessageCircle, Lock, Clock } from "lucide-react";
import { EASE_OUT, SPRING, SPRING_SOFT } from "../lib/motionConfig";
import { Skeleton } from "./ui/Motion";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  surfaceHigh: "#1E1B18",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

export function LockerCard({ point, selected, onSelect, disabled }) {
  const interactive = Boolean(onSelect);
  const Wrapper = interactive ? motion.button : motion.div;
  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={interactive && !disabled ? () => onSelect(point.id) : undefined}
      whileHover={interactive && !disabled ? { x: 3 } : undefined}
      whileTap={interactive && !disabled ? { scale: 0.99 } : undefined}
      className="w-full flex items-start gap-3 rounded-2xl p-3.5 text-left"
      style={{
        backgroundColor: selected ? "rgba(200,255,77,0.08)" : COLOR.surfaceHigh,
        border: `1.5px solid ${selected ? COLOR.lima : COLOR.border}`,
        opacity: disabled && !selected ? 0.5 : 1,
        cursor: interactive && !disabled ? "pointer" : "default",
      }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: selected ? COLOR.lima : "rgba(200,255,77,0.08)" }}
      >
        <Lock size={18} style={{ color: selected ? COLOR.negro : COLOR.lima }} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold" style={{ color: COLOR.hueso }}>
          {point.name}
        </span>
        <span className="flex items-start gap-1 text-xs mt-0.5" style={{ color: COLOR.muted }}>
          <MapPin size={12} className="shrink-0 mt-0.5" />
          <span>
            {point.district} · {point.address}
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: COLOR.muted }}>
          <Clock size={12} className="shrink-0" />
          {point.hours}
        </span>
      </span>
      {interactive && (
        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ border: `2px solid ${selected ? COLOR.lima : COLOR.muted}` }}>
          {selected && <motion.span layoutId="locker-dot" transition={SPRING} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR.lima }} />}
        </span>
      )}
    </Wrapper>
  );
}

const OPTIONS = [
  { id: "locker", label: "Recoger en locker", sub: "Lockers Nexo en el centro de Arequipa", icon: Lock },
  { id: "coordinar", label: "Coordinar con la tienda", sub: "Acuerdan la entrega por chat", icon: MessageCircle },
];

// Elige cómo recibir el pedido: en un locker Nexo (con el punto de recojo) o
// a coordinar con la tienda.
export default function PickupPicker({ method, onMethod, points, status, selectedId, onSelect, disabled }) {
  const lockersAvailable = status === "ready" && points.length > 0;
  const options = lockersAvailable ? OPTIONS : OPTIONS.filter((o) => o.id === "coordinar");
  const current = lockersAvailable ? method : "coordinar";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT }}
      className="rounded-2xl p-4 mt-4"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <p className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
        ¿Cómo recibes tu pedido?
      </p>

      {status === "loading" ? (
        <Skeleton className="h-16 mt-3" />
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          {options.map((o) => {
            const on = current === o.id;
            const Icon = o.icon;
            return (
              <motion.button
                key={o.id}
                type="button"
                disabled={disabled}
                onClick={() => onMethod(o.id)}
                whileTap={{ scale: 0.98 }}
                className="relative flex-1 flex items-center gap-2.5 rounded-xl p-3 text-left disabled:opacity-60"
                style={{ border: `1.5px solid ${on ? COLOR.lima : COLOR.border}`, backgroundColor: on ? "rgba(200,255,77,0.08)" : COLOR.surfaceHigh }}
              >
                <Icon size={17} style={{ color: on ? COLOR.lima : COLOR.muted }} />
                <span>
                  <span className="block text-sm font-semibold" style={{ color: COLOR.hueso }}>
                    {o.label}
                  </span>
                  <span className="block text-[11px] leading-snug" style={{ color: COLOR.muted }}>
                    {o.sub}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence initial={false}>
        {current === "locker" && lockersAvailable && (
          <motion.div
            key="points"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_SOFT}
            className="overflow-hidden"
          >
            <p className="text-xs mt-4 mb-2" style={{ color: COLOR.muted }}>
              Elige el locker donde la tienda dejará tu pedido. Te daremos un código de apertura cuando esté listo.
            </p>
            <div className="flex flex-col gap-2">
              {points.map((p) => (
                <LockerCard key={p.id} point={p} selected={selectedId === p.id} onSelect={onSelect} disabled={disabled} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === "error" && (
        <p className="text-xs mt-3" style={{ color: COLOR.muted }}>
          Los lockers no están disponibles por ahora. Puedes coordinar la entrega con la tienda.
        </p>
      )}
    </motion.div>
  );
}
