import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Plus, ShoppingCart, Store, X, Zap } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import * as storesApi from "../lib/storesApi";
import * as cartApi from "../lib/cartApi";
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

// Compra rápida: se abre sobre el Feed (desde un video, una publicación, un
// producto nuevo o una reseña) para elegir talla/color, cantidad y comprar sin
// salir de ahí. Muestra el stock en tiempo real.
export default function QuickBuySheet({ productId, onClose }) {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(null); // { productId, product }
  const [failed, setFailed] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null); // "add" | "now"
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    storesApi
      .fetchProductById(productId)
      .then((product) => {
        if (cancelled) return;
        if (product) setLoaded({ productId, product });
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const storeId = loaded?.product.storeId;
  useEffect(() => {
    if (!storeId) return;
    return storesApi.subscribeToStoreStock(storeId, (id, stock) => {
      setLoaded((prev) => (prev && prev.product.id === id ? { ...prev, product: { ...prev.product, stock } } : prev));
    });
  }, [storeId]);

  const product = loaded?.productId === productId ? loaded.product : null;

  const groups = product?.options ? Object.keys(product.options) : [];
  const hasOptions = groups.length > 0;
  const allSelected = hasOptions && groups.every((g) => selectedOptions[g]);
  const variant = allSelected && product.variants?.length ? product.variants.find((v) => groups.every((g) => v.optionValues[g] === selectedOptions[g])) : null;
  const price = variant?.price ?? product?.price;
  const optionImage = groups.map((g) => selectedOptions[g] && product.optionImages?.[`${g}:${selectedOptions[g]}`]).find(Boolean);
  const image = optionImage || product?.imageUrl;
  const outOfStock = product?.stock === 0;
  const qty = product ? Math.max(1, Math.min(quantity, product.stock)) : 1;
  const isOwn = Boolean(user && product && user.storeSlug && user.storeSlug === product.storeSlug);
  const canBuy = Boolean(product) && !outOfStock && !isOwn && (!hasOptions || allSelected);

  const addToCart = async (mode) => {
    if (!user) {
      navigate("/ingresar");
      return;
    }
    setError("");
    setBusy(mode);
    try {
      await cartApi.addToCart({
        buyerId: user.id,
        productId: product.id,
        quantity: qty,
        selectedOptions: hasOptions ? selectedOptions : undefined,
        customizationNote: product.isCustomizable ? note.trim() : undefined,
      });
      await cart.refresh();
      if (mode === "now") {
        navigate("/carrito");
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch {
      setError("No se pudo agregar al carrito. Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
      >
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(11,10,9,0.7)" }}>
          <X size={16} style={{ color: COLOR.hueso }} />
        </button>

        {failed ? (
          <p className="p-8 text-sm text-center" style={{ color: COLOR.muted }}>
            Este producto ya no está disponible.
          </p>
        ) : !product ? (
          <div className="p-5 flex gap-3">
            <div className="nexo-skeleton w-24 h-24 rounded-xl" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="nexo-skeleton h-5 w-3/4 rounded" />
              <div className="nexo-skeleton h-4 w-1/3 rounded" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-4 p-5 pr-12">
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: COLOR.surface }}>
                {image && <img src={image} alt={product.name} className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-snug" style={{ color: COLOR.hueso }}>
                  {product.name}
                </h2>
                <Link to={`/tienda/${product.storeSlug}`} onClick={onClose} className="inline-flex items-center gap-1 text-xs mt-0.5 hover:underline" style={{ color: COLOR.muted }}>
                  <Store size={12} />
                  {product.storeName}
                </Link>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={price} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="text-xl font-bold" style={{ color: COLOR.lima }}>
                      {price}
                    </motion.span>
                  </AnimatePresence>
                  {!variant && product.originalPrice && (
                    <span className="text-xs line-through" style={{ color: COLOR.muted }}>
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium mt-1" style={{ color: product.stock <= 5 ? COLOR.coral : COLOR.lima }}>
                  {product.stock === 0 ? "Agotado" : product.stock <= 5 ? `¡Últimas ${product.stock} unidades!` : `${product.stock} disponibles`}
                </p>
              </div>
            </div>

            {hasOptions && (
              <div className="px-5">
                {Object.entries(product.options).map(([group, values]) => (
                  <div key={group} className="mb-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: COLOR.hueso }}>
                      {group}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {values.map((v) => {
                        const on = selectedOptions[group] === v;
                        return (
                          <motion.button
                            key={v}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [group]: v }))}
                            className="rounded-full px-3.5 py-1.5 text-xs"
                            style={on ? { backgroundColor: COLOR.lima, color: COLOR.negro, fontWeight: 600 } : { border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
                          >
                            {v}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product.isCustomizable && (
              <div className="px-5 pb-3">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: COLOR.hueso }}>
                  {product.customizationLabel || "Nota de personalización"}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe aquí lo que quieres personalizar..."
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
                />
              </div>
            )}

            <div className="px-5 pb-5 flex flex-col gap-2.5">
              {isOwn ? (
                <p className="text-xs" style={{ color: COLOR.muted }}>
                  Este es un producto de tu propia tienda.
                </p>
              ) : (
                <>
                  {hasOptions && !allSelected && (
                    <p className="text-[11px]" style={{ color: COLOR.coral }}>
                      Elige {groups.join(" y ")} para continuar.
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: COLOR.muted }}>
                      Cantidad
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: `1px solid ${COLOR.border}` }} aria-label="Menos">
                        <Minus size={12} style={{ color: COLOR.hueso }} />
                      </button>
                      <span className="text-sm w-4 text-center" style={{ color: COLOR.hueso }}>
                        {qty}
                      </span>
                      <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30" style={{ border: `1px solid ${COLOR.border}` }} aria-label="Más">
                        <Plus size={12} style={{ color: COLOR.hueso }} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addToCart("add")}
                      disabled={!canBuy || busy !== null}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold disabled:opacity-50"
                      style={{ border: `1.5px solid ${COLOR.lima}`, color: COLOR.lima }}
                    >
                      {added ? <Check size={15} /> : <ShoppingCart size={15} />}
                      {outOfStock ? "Agotado" : added ? "Agregado" : busy === "add" ? "Agregando..." : "Al carrito"}
                    </motion.button>
                    <motion.button
                      whileHover={{ y: canBuy ? -2 : 0 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addToCart("now")}
                      disabled={!canBuy || busy !== null}
                      className="nexo-glow flex-1 flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold disabled:opacity-50"
                      style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
                    >
                      <Zap size={15} />
                      {busy === "now" ? "Un momento..." : "Comprar ahora"}
                    </motion.button>
                  </div>
                  {error && (
                    <p className="text-[11px]" style={{ color: COLOR.coral }}>
                      {error}
                    </p>
                  )}
                </>
              )}
              <Link to={`/tienda/${product.storeSlug}/producto/${product.id}`} onClick={onClose} className="text-center text-xs hover:underline" style={{ color: COLOR.muted }}>
                Ver detalles y reseñas del producto
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
