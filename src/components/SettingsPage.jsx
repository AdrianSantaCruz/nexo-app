import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Receipt, Store, Banknote, PlusCircle, FileText, ShieldCheck, LogOut, Trash2, ChevronRight, Settings } from "lucide-react";
import { useAuth } from "../context/authContext";
import { deleteMyAccount } from "../lib/moderationApi";
import { fetchOwnStoreSlug } from "../lib/profilesApi";
import { EmptyState, Reveal, Stagger, StaggerItem } from "./ui/Motion";
import { SPRING } from "../lib/motionConfig";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
  coral: "#FF8A65",
};

function Group({ title, children }) {
  return (
    <StaggerItem>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 mt-2" style={{ color: COLOR.muted }}>
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </StaggerItem>
  );
}

function Row({ icon: Icon, label, sub, to, onClick, danger }) {
  const inner = (
    <motion.div
      whileHover={{ x: 4, backgroundColor: "#1E1B18" }}
      whileTap={{ scale: 0.99 }}
      transition={SPRING}
      className="flex items-center gap-3 rounded-2xl p-3.5"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: danger ? "rgba(255,138,101,0.12)" : "rgba(200,255,77,0.08)" }}
      >
        <Icon size={18} style={{ color: danger ? COLOR.coral : COLOR.lima }} />
      </span>
      <span className="flex-1 text-left">
        <span className="block text-sm font-semibold" style={{ color: danger ? COLOR.coral : COLOR.hueso }}>
          {label}
        </span>
        {sub && (
          <span className="block text-xs mt-0.5" style={{ color: COLOR.muted }}>
            {sub}
          </span>
        )}
      </span>
      <ChevronRight size={16} style={{ color: COLOR.muted }} />
    </motion.div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return (
    <button onClick={onClick} className="w-full">
      {inner}
    </button>
  );
}

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [storeSlug, setStoreSlug] = useState(undefined);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchOwnStoreSlug(userId)
      .then((slug) => !cancelled && setStoreSlug(slug))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return null;

  if (!user) {
    return (
      <EmptyState icon={Settings} title="Ajustes" subtitle="Inicia sesión para administrar tu cuenta.">
        <Link to="/ingresar" className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          Ingresar
        </Link>
      </EmptyState>
    );
  }

  const handleDelete = async () => {
    const ok = window.confirm(
      "Se borrarán tu perfil, chats, reseñas, pedidos y carrito. Las tiendas sin ventas se eliminan por completo.\n\nEsta acción NO se puede deshacer. ¿Eliminar mi cuenta para siempre?"
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      navigate("/");
    } catch {
      setDeleting(false);
      window.alert("No se pudo eliminar la cuenta. Inténtalo de nuevo en unos minutos.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <h1 className="text-2xl font-bold mb-5" style={{ color: COLOR.hueso }}>
          Ajustes
        </h1>
      </Reveal>

      <Stagger stagger={0.07} className="flex flex-col gap-3">
        <Group title="Compras">
          <Row icon={Receipt} label="Mis pedidos" sub="Estado de tus compras" to="/pedidos" />
        </Group>

        <Group title="Mi tienda">
          {storeSlug ? (
            <>
              <Row icon={Store} label="Ver mi tienda" to={`/tienda/${storeSlug}`} />
              <Row icon={Banknote} label="Ventas" sub="Pedidos que recibiste" to={`/ventas/${storeSlug}`} />
            </>
          ) : (
            <Row icon={PlusCircle} label="Crear mi tienda" sub="Empieza a vender en Nexo" to="/vender" />
          )}
        </Group>

        <Group title="Legal">
          <Row icon={FileText} label="Términos y condiciones" to="/legal/terminos" />
          <Row icon={ShieldCheck} label="Política de privacidad" to="/legal/privacidad" />
        </Group>

        <Group title="Cuenta">
          <Row
            icon={LogOut}
            label="Cerrar sesión"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          />
          <Row icon={Trash2} label={deleting ? "Eliminando..." : "Eliminar mi cuenta"} sub="Borra tu cuenta y tus datos" danger onClick={handleDelete} />
        </Group>
      </Stagger>

      <p className="text-center text-xs mt-8" style={{ color: COLOR.muted }}>
        Nexo · Nero Labs · versión 1.0.0
      </p>
    </div>
  );
}
