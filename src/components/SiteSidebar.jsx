import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Compass, LayoutGrid, MessageCircle, User, Plus, ShoppingCart } from "lucide-react";
import LogoMark from "./LogoMark";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function SidebarItem({ icon: Icon, label, active, to, badge }) {
  const className = "relative flex items-center justify-center lg:justify-start gap-3 rounded-xl px-0 lg:px-3 py-2.5";
  const style = {
    backgroundColor: active ? "rgba(200,255,77,0.1)" : "transparent",
    color: active ? COLOR.lima : COLOR.hueso,
  };
  const content = (
    <>
      <span className="relative shrink-0">
        <Icon size={22} />
        {badge > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="hidden lg:inline text-sm font-medium">{label}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button className={className} style={style}>
      {content}
    </button>
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

  const submitSearch = () => {
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-16 lg:w-56 flex flex-col z-40 shrink-0"
      style={{ backgroundColor: COLOR.negro, borderRight: `1px solid ${COLOR.border}` }}
    >
      <Link to="/" className="flex items-center justify-center lg:justify-start gap-2 h-16 px-0 lg:px-4 shrink-0">
        <LogoMark size={32} />
        <span className="hidden lg:inline text-lg font-semibold" style={{ color: COLOR.hueso, fontFamily: "Georgia, serif" }}>
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
        <div
          className="hidden lg:flex items-center gap-2 rounded-full px-3 py-2"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
        >
          <Search size={15} style={{ color: COLOR.muted }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            placeholder="Buscar tiendas o productos"
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: COLOR.hueso }}
          />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 lg:px-3 mt-1 overflow-y-auto no-scrollbar">
        <SidebarItem icon={Compass} label="Para ti" to="/" active={location.pathname === "/"} />
        <SidebarItem icon={LayoutGrid} label="Descubrir" to="/descubrir" active={location.pathname === "/descubrir"} />
        <SidebarItem icon={MessageCircle} label="Chats" to="/chats" active={location.pathname.startsWith("/chats")} />
        <SidebarItem icon={ShoppingCart} label="Carrito" to="/carrito" active={location.pathname === "/carrito"} badge={cartCount} />
        <SidebarItem icon={User} label="Mi cuenta" to="/cuenta" active={location.pathname === "/cuenta"} />
      </nav>

      <div className="p-2 lg:p-3 shrink-0">
        <Link
          to={sellCta}
          className="w-full flex items-center justify-center gap-1.5 rounded-full px-0 lg:px-4 py-2.5 text-sm font-medium"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          <Plus size={16} />
          <span className="hidden lg:inline">Vender en Nexo</span>
        </Link>
      </div>
    </aside>
  );
}
