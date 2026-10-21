import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Compass, LayoutGrid, MessageCircle, User, Plus, ShoppingCart, Receipt } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import LogoMark from "./LogoMark";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import { SPRING, SPRING_BOUNCY } from "../lib/motionConfig";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function SidebarItem({ icon: Icon, label, active, to, badge }) {
  return (
    <Link to={to} className="relative block">
      {active && (
        <motion.span
          layoutId="sidebar-pill"
          transition={SPRING}
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: "rgba(200,255,77,0.1)", boxShadow: "inset 0 0 0 1px rgba(200,255,77,0.18)" }}
        />
      )}
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
        transition={SPRING}
        className="relative flex items-center justify-center lg:justify-start gap-3 rounded-xl px-0 lg:px-3 py-2.5"
        style={{ color: active ? COLOR.lima : COLOR.hueso }}
      >
        <span className="relative shrink-0">
          <Icon size={22} strokeWidth={active ? 2.4 : 2} />
          <AnimatePresence>
            {badge > 0 && (
              <motion.span
                key={badge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={SPRING_BOUNCY}
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-semibold"
                style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
              >
                {badge > 9 ? "9+" : badge}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="hidden lg:inline text-sm font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}

// Nav lateral fijo, inspirado en TikTok/Instagram/YouTube web: la marca y la
// búsqueda arriba, la navegación principal debajo, sin barra superior — el
// contenido de cada página empieza directamente arriba de la pantalla.
export default function SiteSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const sellCta = user ? (user.storeSlug ? `/tienda/${user.storeSlug}` : "/vender") : "/registro";
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const path = location.pathname;

  const submitSearch = () => {
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-16 lg:w-56 flex flex-col z-40 shrink-0"
      style={{ backgroundColor: "rgba(11,10,9,0.86)", backdropFilter: "blur(14px)", borderRight: `1px solid ${COLOR.border}` }}
    >
      <Link to="/" className="flex items-center justify-center lg:justify-start gap-2 h-16 px-0 lg:px-4 shrink-0">
        <motion.span whileHover={{ rotate: -8, scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={SPRING_BOUNCY} className="flex">
          <LogoMark size={32} />
        </motion.span>
        <span className="hidden lg:inline text-lg font-bold tracking-tight" style={{ color: COLOR.hueso }}>
          Nexo
        </span>
      </Link>

      {/* Buscador: campo completo en pantallas grandes, solo ícono (lleva a
          /buscar) en la barra angosta */}
      <div className="px-2 lg:px-4 pb-2">
        <Link
          to="/buscar"
          className="lg:hidden w-full h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
        >
          <Search size={16} style={{ color: COLOR.muted }} />
        </Link>
        <motion.div
          animate={{
            borderColor: searchFocused ? COLOR.lima : COLOR.border,
            boxShadow: searchFocused ? "0 0 0 3px rgba(200,255,77,0.12)" : "0 0 0 0px rgba(200,255,77,0)",
          }}
          transition={{ duration: 0.2 }}
          className="hidden lg:flex items-center gap-2 rounded-full px-3 py-2"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
        >
          <Search size={15} style={{ color: searchFocused ? COLOR.lima : COLOR.muted }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Buscar tiendas o productos"
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: COLOR.hueso }}
          />
        </motion.div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 lg:px-3 mt-1 overflow-y-auto no-scrollbar">
        <SidebarItem icon={Compass} label="Para ti" to="/" active={path === "/"} />
        <SidebarItem icon={LayoutGrid} label="Descubrir" to="/descubrir" active={path === "/descubrir"} />
        <SidebarItem icon={MessageCircle} label="Chats" to="/chats" active={path.startsWith("/chats")} />
        <SidebarItem icon={ShoppingCart} label="Carrito" to="/carrito" active={path === "/carrito"} badge={cartCount} />
        {user && <SidebarItem icon={Receipt} label="Mis pedidos" to="/pedidos" active={path === "/pedidos"} />}
        <SidebarItem
          icon={User}
          label="Mi cuenta"
          to="/cuenta"
          active={path === "/cuenta" || path.startsWith("/perfil") || path === "/ajustes"}
        />
      </nav>

      <div className="p-2 lg:p-3 shrink-0">
        <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={SPRING}>
          <Link
            to={sellCta}
            className="nexo-glow w-full flex items-center justify-center gap-1.5 rounded-full px-0 lg:px-4 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
          >
            <Plus size={16} strokeWidth={2.6} />
            <span className="hidden lg:inline">{user?.storeSlug ? "Mi tienda" : "Vender en Nexo"}</span>
          </Link>
        </motion.div>
      </div>
    </aside>
  );
}
