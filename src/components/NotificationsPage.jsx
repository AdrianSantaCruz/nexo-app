import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellRing, CheckCheck, Trash2 } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useNotifications } from "../context/notificationsContext";
import { notificationPath, timeAgo } from "../lib/notificationsApi";
import { metaFor } from "../lib/notificationMeta";
import { EmptyState, Reveal, Skeleton } from "./ui/Motion";
import { EASE_OUT, SPRING } from "../lib/motionConfig";

const COLOR = { negro: "#0B0A09", surface: "#151311", border: "#2A2622", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

function Row({ n, index, onOpen, onRemove }) {
  const { icon: Icon, color } = metaFor(n.type);
  const unread = !n.readAt;
  const count = n.type === "mensaje" ? Number(n.data?.count) || 1 : 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      transition={{ ...SPRING, delay: Math.min(index, 8) * 0.03 }}
      className="group relative flex items-start gap-3.5 rounded-2xl p-4 cursor-pointer"
      style={{ backgroundColor: unread ? "rgba(200,255,77,0.045)" : COLOR.surface, border: `1px solid ${unread ? "rgba(200,255,77,0.22)" : COLOR.border}` }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
    >
      <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1f` }}>
        <Icon size={20} style={{ color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-snug" style={{ color: COLOR.hueso, fontWeight: unread ? 700 : 500 }}>
            {n.title}
          </p>
          <span className="text-[11px] shrink-0 mt-0.5" style={{ color: COLOR.muted }}>
            {timeAgo(n.createdAt)}
          </span>
        </div>
        {n.body && (
          <p className="text-[13px] mt-1 leading-relaxed line-clamp-2" style={{ color: COLOR.muted }}>
            {count > 1 ? `${count} mensajes nuevos · ` : ""}
            {n.body}
          </p>
        )}
      </div>
      {unread && <span className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ backgroundColor: COLOR.lima, boxShadow: "0 0 10px rgba(200,255,77,0.7)" }} />}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Eliminar notificación"
        className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
      >
        <Trash2 size={13} style={{ color: COLOR.muted }} />
      </button>
    </motion.div>
  );
}

// Centro de notificaciones: todo lo que pasó en tu cuenta, en vivo.
export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, bellCount, markRead, markAllRead, remove, browserPermission, enableBrowserAlerts } = useNotifications();
  const navigate = useNavigate();

  if (authLoading) return null;

  if (!user) {
    return (
      <EmptyState icon={Bell} title="Tus notificaciones" subtitle="Inicia sesión para ver tus avisos de pedidos, mensajes y más.">
        <Link to="/ingresar" className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          Ingresar
        </Link>
      </EmptyState>
    );
  }

  const open = (n) => {
    if (!n.readAt) markRead([n.id]);
    navigate(notificationPath(n, user.storeSlug));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLOR.hueso }}>
              Notificaciones
            </h1>
            <p className="text-sm mt-1" style={{ color: COLOR.muted }}>
              {bellCount > 0 ? `Tienes ${bellCount} sin leer` : "Estás al día"}
            </p>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={markAllRead}
            disabled={bellCount === 0}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-40"
            style={{ border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
          >
            <CheckCheck size={14} />
            Marcar todo como leído
          </motion.button>
        </div>
      </Reveal>

      {browserPermission === "default" && (
        <Reveal delay={0.05}>
          <div className="flex items-center gap-3 rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(200,255,77,0.06)", border: "1px solid rgba(200,255,77,0.2)" }}>
            <BellRing size={20} style={{ color: COLOR.lima }} className="shrink-0" />
            <p className="text-xs leading-relaxed flex-1" style={{ color: COLOR.hueso }}>
              Activa los avisos del navegador para enterarte de pedidos y mensajes aunque tengas Nexo en segundo plano.
            </p>
            <button onClick={enableBrowserAlerts} className="rounded-full px-4 py-2 text-xs font-semibold shrink-0" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
              Activar
            </button>
          </div>
        </Reveal>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="Aún no tienes notificaciones" subtitle="Aquí te avisaremos de mensajes, pedidos, pagos y de quién interactúa con tus publicaciones." />
      ) : (
        <motion.div layout className="flex flex-col gap-3" transition={{ duration: 0.3, ease: EASE_OUT }}>
          <AnimatePresence initial>
            {items.map((n, i) => (
              <Row key={n.id} n={n} index={i} onOpen={() => open(n)} onRemove={() => remove(n.id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
