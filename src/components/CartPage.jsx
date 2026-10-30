import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Trash2, ShoppingBag, Store, ChevronRight } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import * as cartApi from "../lib/cartApi";
import * as pickupApi from "../lib/pickupApi";
import { EASE_OUT, SPRING, SPRING_SOFT } from "../lib/motionConfig";
import PaymentModal from "./PaymentModal";
import PickupPicker from "./PickupPicker";
import { EmptyState, Reveal } from "./ui/Motion";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  surfaceHigh: "#1E1B18",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function formatSoles(n) {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function QtyButton({ children, onClick, disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
      style={{ backgroundColor: COLOR.surfaceHigh, border: `1px solid ${COLOR.border}` }}
    >
      {children}
    </motion.button>
  );
}

function CartRow({ item, onChangeQty, onRemove }) {
  const noStock = item.product.stock < item.quantity;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.22 } }}
      transition={SPRING_SOFT}
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: `1px solid ${COLOR.border}` }}
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: COLOR.surfaceHigh }}>
        {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: COLOR.hueso }}>
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
        <p className="text-sm font-bold mt-0.5" style={{ color: COLOR.lima }}>
          {formatSoles(item.unitPrice * item.quantity)}
        </p>
        {noStock && (
          <p className="text-[11px] mt-0.5" style={{ color: "#FF8A65" }}>
            {item.product.stock === 0 ? "Agotado" : `Solo quedan ${item.product.stock}`} — ajusta la cantidad
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <QtyButton onClick={() => onChangeQty(item, item.quantity - 1)}>
          <Minus size={13} style={{ color: COLOR.hueso }} />
        </QtyButton>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={item.quantity}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-semibold w-5 text-center"
            style={{ color: COLOR.hueso }}
          >
            {item.quantity}
          </motion.span>
        </AnimatePresence>
        <QtyButton onClick={() => onChangeQty(item, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
          <Plus size={13} style={{ color: COLOR.hueso }} />
        </QtyButton>
      </div>
      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={() => onRemove(item)} className="shrink-0 p-1" aria-label="Quitar">
        <Trash2 size={16} style={{ color: "#FF8A65" }} />
      </motion.button>
    </motion.div>
  );
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, refresh } = useCart();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [frozenTotal, setFrozenTotal] = useState(0);
  // Si el pedido se creó pero el pago falló, se reintenta el pago de ESE pedido.
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [error, setError] = useState("");
  // Entrega: locker Nexo (con punto de recojo) o a coordinar con la tienda.
  const [deliveryMethod, setDeliveryMethod] = useState("locker");
  const [pickupPointId, setPickupPointId] = useState(null);
  const [points, setPoints] = useState([]);
  const [pointsStatus, setPointsStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    pickupApi
      .fetchPickupPoints()
      .then((data) => {
        if (cancelled) return;
        setPoints(data);
        setPointsStatus("ready");
      })
      .catch(() => !cancelled && setPointsStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (authLoading) return null;

  if (!user) {
    return (
      <EmptyState icon={ShoppingBag} title="Tu carrito" subtitle="Inicia sesión para agregar productos y confirmar tus pedidos.">
        <Link to="/ingresar" className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          Ingresar
        </Link>
      </EmptyState>
    );
  }

  // Mientras se paga, el carrito se vacía en el servidor; el modal debe seguir visible.
  if (items.length === 0 && !paying) {
    return (
      <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" subtitle="Explora tiendas y agrega lo que te guste.">
        <Link to="/descubrir" className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          Descubrir productos
        </Link>
      </EmptyState>
    );
  }

  const byStore = new Map();
  for (const item of items) {
    const key = item.product.storeId;
    if (!byStore.has(key)) byStore.set(key, { name: item.product.storeName, slug: item.product.storeSlug, items: [] });
    byStore.get(key).items.push(item);
  }
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const hasStockProblem = items.some((i) => i.product.stock < i.quantity);
  const lockersAvailable = pointsStatus === "ready" && points.length > 0;
  const effectiveMethod = lockersAvailable ? deliveryMethod : "coordinar";
  const needsLocker = effectiveMethod === "locker" && !pickupPointId;
  const chosenPoint = points.find((p) => p.id === pickupPointId);

  const handleChangeQty = async (item, quantity) => {
    await cartApi.updateCartItemQuantity(item.id, quantity);
    refresh();
  };

  const handleRemove = async (item) => {
    await cartApi.removeCartItem(item.id);
    refresh();
  };

  const openPayment = () => {
    setError("");
    setFrozenTotal(total);
    setPaying(true);
  };

  const handlePay = async (method) => {
    let orderId = pendingOrderId;
    if (!orderId) {
      try {
        orderId = await cartApi.checkout({ deliveryMethod: effectiveMethod, pickupPointId: effectiveMethod === "locker" ? pickupPointId : null });
      } catch (err) {
        if (err.code === "SIN_STOCK") {
          setPaying(false);
          setError(`Ya no hay stock suficiente de "${err.productName}". Ajusta tu carrito e intenta de nuevo.`);
          await refresh();
          throw new Error("Sin stock suficiente", { cause: err });
        }
        throw new Error("No se pudo registrar el pedido. Intenta de nuevo.", { cause: err });
      }
      setPendingOrderId(orderId);
      await refresh();
    }
    try {
      await cartApi.paySimulated(orderId, method);
      setPendingOrderId(null);
    } catch {
      throw new Error("Tu pedido quedó guardado, pero el pago no se pudo procesar. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <h1 className="text-2xl font-bold mb-6" style={{ color: COLOR.hueso }}>
          Tu carrito
        </h1>
      </Reveal>

      <AnimatePresence initial={false}>
        {[...byStore.values()].map((group, gi) => (
          <motion.div
            key={group.slug}
            layout
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ ...SPRING_SOFT, delay: gi * 0.05 }}
            className="mb-4 rounded-2xl p-4"
            style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
          >
            <Link to={`/tienda/${group.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold group">
              <Store size={15} style={{ color: COLOR.lima }} />
              <span style={{ color: COLOR.hueso }}>{group.name}</span>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" style={{ color: COLOR.muted }} />
            </Link>
            <div className="mt-1">
              <AnimatePresence initial={false}>
                {group.items.map((item) => (
                  <CartRow key={item.id} item={item} onChangeQty={handleChangeQty} onRemove={handleRemove} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <PickupPicker
        method={deliveryMethod}
        onMethod={setDeliveryMethod}
        points={points}
        status={pointsStatus}
        selectedId={pickupPointId}
        onSelect={setPickupPointId}
        disabled={Boolean(pendingOrderId)}
      />

      <motion.div
        layout
        className="rounded-2xl p-5 mt-4"
        style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT }}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm" style={{ color: COLOR.muted }}>
            Total
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={total}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={SPRING}
              className="text-3xl font-bold"
              style={{ color: COLOR.hueso }}
            >
              {formatSoles(total)}
            </motion.span>
          </AnimatePresence>
        </div>

        {error && (
          <p className="text-xs mt-3" style={{ color: "#FF8A65" }}>
            {error}
          </p>
        )}

        <motion.button
          onClick={openPayment}
          disabled={hasStockProblem || needsLocker}
          whileHover={{ y: hasStockProblem || needsLocker ? 0 : -2 }}
          whileTap={{ scale: 0.98 }}
          className="nexo-glow w-full rounded-full py-3.5 text-sm font-semibold mt-4 disabled:opacity-50"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          Continuar al pago
        </motion.button>
        {needsLocker && (
          <p className="text-[11px] text-center mt-2.5" style={{ color: COLOR.lima }}>
            Elige el locker donde recogerás tu pedido para continuar.
          </p>
        )}
        <p className="text-[11px] text-center mt-2.5" style={{ color: COLOR.muted }}>
          Modo simulación: el pago se registra en Nexo pero no se cobra dinero real.
        </p>
      </motion.div>

      {paying && (
        <PaymentModal
          total={frozenTotal}
          note={effectiveMethod === "locker" && chosenPoint ? `Recogerás tu pedido en ${chosenPoint.name}. Te daremos un código de apertura cuando la tienda lo deje allí.` : undefined}
          onPay={handlePay}
          onClose={() => setPaying(false)}
          onDone={() => {
            setPaying(false);
            navigate("/pedidos");
          }}
        />
      )}
    </div>
  );
}
