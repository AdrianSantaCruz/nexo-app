import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useNotifications } from "../context/notificationsContext";
import { notificationPath } from "../lib/notificationsApi";
import { metaFor } from "../lib/notificationMeta";
import { SPRING } from "../lib/motionConfig";

const COLOR = { negro: "#0B0A09", surface: "#151311", border: "#2A2622", hueso: "#FBF6EF", muted: "#8A8378" };
const AUTO_CLOSE_MS = 6000;

function Toast({ toast }) {
  const { dismissToast, markRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const n = toast.notification;
  const { icon: Icon, color } = metaFor(n.type);

  // Se cierra solo; si llega otro mensaje de la misma conversación, `key`
  // cambia y el contador vuelve a empezar.
  useEffect(() => {
    const t = setTimeout(() => dismissToast(toast.id), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [toast.key, toast.id, dismissToast]);

  const open = () => {
    markRead([n.id]);
    navigate(notificationPath(n, user?.storeSlug));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.94 }}
      transition={SPRING}
      className="relative w-80 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden cursor-pointer"
      style={{ backgroundColor: "rgba(21,19,17,0.96)", border: `1px solid ${COLOR.border}`, backdropFilter: "blur(14px)", boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}
      onClick={open}
      role="status"
    >
      <div className="flex items-start gap-3 p-3.5 pr-9">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
          <Icon size={17} style={{ color }} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug truncate" style={{ color: COLOR.hueso }}>
            {n.title}
          </p>
          {n.body && (
            <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: COLOR.muted }}>
              {n.body}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          dismissToast(toast.id);
        }}
        aria-label="Cerrar aviso"
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10"
      >
        <X size={13} style={{ color: COLOR.muted }} />
      </button>
      <motion.span
        key={toast.key}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
}

// Avisos emergentes en vivo (arriba a la derecha): mensaje nuevo, pedido, etc.
export default function NotificationToasts() {
  const { toasts } = useNotifications();
  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
