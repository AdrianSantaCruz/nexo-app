import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import * as cartApi from "../lib/cartApi";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function formatSoles(n) {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function CartRow({ item, onChangeQty, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: COLOR.surface }}>
        {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate" style={{ color: COLOR.hueso }}>
          {item.product.name}
        </p>
        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
          <p className="text-[11px]" style={{ color: COLOR.muted }}>
            {Object.values(item.selectedOptions).join(" / ")}
          </p>
        )}
        {item.customizationNote && (
          <p className="text-[11px] italic" style={{ color: COLOR.muted }}>
            "{item.customizationNote}"
          </p>
        )}
        <p className="text-xs font-semibold mt-0.5" style={{ color: COLOR.lima }}>
          {formatSoles(item.product.price)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onChangeQty(item, item.quantity - 1)}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ border: `1px solid ${COLOR.border}` }}
        >
          <Minus size={12} style={{ color: COLOR.hueso }} />
        </button>
        <span className="text-sm w-4 text-center" style={{ color: COLOR.hueso }}>
          {item.quantity}
        </span>
        <button
          onClick={() => onChangeQty(item, item.quantity + 1)}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ border: `1px solid ${COLOR.border}` }}
        >
          <Plus size={12} style={{ color: COLOR.hueso }} />
        </button>
      </div>
      <button onClick={() => onRemove(item)} className="shrink-0">
        <Trash2 size={16} style={{ color: "#FF8A65" }} />
      </button>
    </div>
  );
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, refresh } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm mb-4" style={{ color: COLOR.muted }}>
            Inicia sesión para ver tu carrito.
          </p>
          <Link to="/ingresar" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-semibold mb-2" style={{ color: COLOR.hueso }}>
            Pedido registrado
          </h1>
          <p className="text-sm mb-6" style={{ color: COLOR.muted }}>
            Tu pedido quedó guardado como <span style={{ color: COLOR.lima }}>pendiente de pago</span> — todavía no procesamos pagos con
            tarjeta, así que coordina el pago directamente con la tienda por chat.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link to="/chats" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
              Ir a mis chats
            </Link>
            <Link to="/" className="rounded-full px-5 py-2.5 text-sm font-medium border" style={{ borderColor: COLOR.border, color: COLOR.hueso }}>
              Seguir viendo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 gap-3">
        <ShoppingBag size={28} style={{ color: COLOR.muted }} />
        <p className="text-sm" style={{ color: COLOR.muted }}>
          Tu carrito está vacío.
        </p>
        <Link to="/descubrir" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          Descubrir productos
        </Link>
      </div>
    );
  }

  const byStore = new Map();
  for (const item of items) {
    const key = item.product.storeId;
    if (!byStore.has(key)) byStore.set(key, { name: item.product.storeName, slug: item.product.storeSlug, items: [] });
    byStore.get(key).items.push(item);
  }
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleChangeQty = async (item, quantity) => {
    await cartApi.updateCartItemQuantity(item.id, quantity);
    refresh();
  };

  const handleRemove = async (item) => {
    await cartApi.removeCartItem(item.id);
    refresh();
  };

  const handleCheckout = async () => {
    setError("");
    setCheckingOut(true);
    try {
      await cartApi.checkout(user.id, items);
      await refresh();
      setDone(true);
    } catch {
      setError("No se pudo registrar el pedido. Intenta de nuevo.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-lg font-semibold mb-5" style={{ color: COLOR.hueso }}>
        Tu carrito
      </h1>

      {[...byStore.values()].map((group) => (
        <div key={group.slug} className="mb-5 rounded-xl p-4" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <Link to={`/tienda/${group.slug}`} className="text-sm font-medium hover:underline" style={{ color: COLOR.hueso }}>
            {group.name}
          </Link>
          <div className="mt-1">
            {group.items.map((item) => (
              <CartRow key={item.id} item={item} onChangeQty={handleChangeQty} onRemove={handleRemove} />
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm" style={{ color: COLOR.muted }}>
          Total
        </span>
        <span className="text-lg font-semibold" style={{ color: COLOR.hueso }}>
          {formatSoles(total)}
        </span>
      </div>

      {error && (
        <p className="text-xs mt-2" style={{ color: "#FF8A65" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full rounded-full py-3 text-sm font-medium mt-4 disabled:opacity-60"
        style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
      >
        {checkingOut ? "Registrando pedido..." : "Confirmar pedido"}
      </button>
      <p className="text-[11px] text-center mt-2" style={{ color: COLOR.muted }}>
        Todavía no procesamos pagos con tarjeta — el pedido queda pendiente y coordinas el pago con la tienda por chat.
      </p>
    </div>
  );
}
