import { motion } from "motion/react";
import { Store, User, ShieldCheck, Clock, Undo2, MapPin, KeyRound, PackageCheck } from "lucide-react";
import { METHOD_LABEL, STATUS_LABEL, statusLabel } from "../lib/ordersApi";
import { EASE_OUT, SPRING_SOFT } from "../lib/motionConfig";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

const STATUS_COLOR = {
  pendiente: "#F5C242",
  preparando: "#4DD9C8",
  enviado: "#C8FF4D",
  entregado: "#A6E02E",
  cancelado: "#FF8A65",
};

const NEXT = { pendiente: "preparando", preparando: "enviado", enviado: "entregado" };

function formatSoles(n) {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

// Tarjeta de un pedido (la parte de UNA tienda). `mode`: "buyer" o "seller".
export default function OrderCard({ group, index = 0, mode, busy, onStatus, onCancel, onPay, onConfirmPickup }) {
  const color = STATUS_COLOR[group.status];
  const paid = group.paymentStatus === "pagado";
  const refunded = group.paymentStatus === "cancelado" && Boolean(group.paymentReference);
  const isLocker = group.deliveryMethod === "locker";
  // En pedidos de locker la tienda llega hasta "enviado" (dejado en el locker); "entregado" lo confirma el comprador.
  const next = isLocker && group.status === "enviado" ? undefined : NEXT[group.status];
  const nextLabel = isLocker && next === "enviado" ? "dejado en el locker" : next ? STATUS_LABEL[next].toLowerCase() : "";
  const date = new Date(group.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
  const payColor = paid ? COLOR.lima : refunded ? "#FF8A65" : "#F5C242";
  const PayIcon = paid ? ShieldCheck : refunded ? Undo2 : Clock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: Math.min(index, 8) * 0.05, ease: EASE_OUT }}
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {mode === "buyer" ? <Store size={16} style={{ color: COLOR.lima }} /> : <User size={16} style={{ color: COLOR.lima }} />}
          <span className="text-sm font-semibold truncate" style={{ color: COLOR.hueso }}>
            {mode === "buyer" ? group.storeName : group.buyerName}
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
          style={{ border: `1px solid ${color}`, color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {statusLabel(group)}
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: COLOR.muted }}>
        {date}
      </p>

      <div
        className="mt-2.5 w-fit flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ color: payColor, backgroundColor: paid ? "rgba(200,255,77,0.08)" : refunded ? "rgba(255,138,101,0.1)" : "rgba(245,194,66,0.1)" }}
      >
        <PayIcon size={13} />
        {paid
          ? `Pagado${group.paymentMethod ? ` · ${METHOD_LABEL[group.paymentMethod]}` : ""} · ${group.paymentReference ?? ""}`
          : refunded
            ? "Reembolsado (simulado)"
            : "Pago pendiente"}
      </div>

      {isLocker && group.pickupPoint && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl p-3" style={{ backgroundColor: "rgba(200,255,77,0.05)", border: "1px solid rgba(200,255,77,0.18)" }}>
          <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: COLOR.lima }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
              {group.pickupPoint.name}
            </p>
            <p className="text-xs" style={{ color: COLOR.muted }}>
              {group.pickupPoint.district} · {group.pickupPoint.address}
            </p>
            <p className="text-xs" style={{ color: COLOR.muted }}>
              {group.pickupPoint.hours}
            </p>
          </div>
        </div>
      )}
      {!isLocker && (
        <p className="text-xs mt-3" style={{ color: COLOR.muted }}>
          Entrega: a coordinar con la tienda por chat.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {group.lines.map((l) => (
          <div key={l.id}>
            <div className="flex justify-between gap-3 text-sm" style={{ color: COLOR.hueso }}>
              <span>
                {l.quantity} × {l.productName}
              </span>
              <span className="shrink-0">{formatSoles(l.unitPrice * l.quantity)}</span>
            </div>
            {l.selectedOptions && (
              <p className="text-xs" style={{ color: COLOR.muted }}>
                {Object.entries(l.selectedOptions)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")}
              </p>
            )}
            {l.customizationNote && (
              <p className="text-xs" style={{ color: "#A6E02E" }}>
                Nota: {l.customizationNote}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between pt-3 mt-3" style={{ borderTop: `1px solid ${COLOR.border}` }}>
        <span className="text-xs" style={{ color: COLOR.muted }}>
          {mode === "seller" ? "Subtotal" : "Total"}
        </span>
        <span className="text-lg font-bold" style={{ color: COLOR.lima }}>
          {formatSoles(group.subtotal)}
        </span>
      </div>
      {mode === "seller" && (
        <p className="text-xs mt-1" style={{ color: COLOR.muted }}>
          Comisión Nexo {formatSoles(group.commission)} · Recibes {formatSoles(group.payout)}
        </p>
      )}

      {mode === "buyer" && isLocker && group.status === "enviado" && (
        <div className="mt-3 rounded-xl p-4 text-center" style={{ backgroundColor: "rgba(200,255,77,0.08)", border: "1px solid rgba(200,255,77,0.3)" }}>
          <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: COLOR.muted }}>
            <KeyRound size={13} style={{ color: COLOR.lima }} />
            Tu pedido ya está en el locker. Código de apertura:
          </p>
          <p className="text-3xl font-bold tracking-[0.3em] mt-1.5" style={{ color: COLOR.lima }}>
            {group.lockerCode ?? "······"}
          </p>
          {onConfirmPickup && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              disabled={busy}
              onClick={onConfirmPickup}
              className="nexo-glow w-full rounded-full py-2.5 text-sm font-semibold mt-3 flex items-center justify-center gap-2"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              <PackageCheck size={16} />
              Ya recogí mi pedido
            </motion.button>
          )}
        </div>
      )}
      {mode === "buyer" && isLocker && (group.status === "pendiente" || group.status === "preparando") && group.status !== "cancelado" && (
        <p className="text-xs mt-3" style={{ color: COLOR.muted }}>
          Cuando la tienda deje tu pedido en el locker verás aquí tu código de apertura.
        </p>
      )}

      {mode === "buyer" && (
        <div className="flex gap-2 mt-3">
          {group.paymentStatus === "pendiente" && group.status === "pendiente" && onPay && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              disabled={busy}
              onClick={onPay}
              className="flex-1 rounded-full py-2.5 text-sm font-semibold"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              Pagar ahora
            </motion.button>
          )}
          {group.status === "pendiente" && onCancel && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              onClick={onCancel}
              className="rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ border: `1px solid ${COLOR.border}`, color: "#FF8A65" }}
            >
              Cancelar pedido
            </motion.button>
          )}
        </div>
      )}

      {mode === "seller" && group.status === "pendiente" && group.paymentStatus === "pendiente" && (
        <p className="text-xs mt-3" style={{ color: COLOR.muted }}>
          Esperando el pago del comprador para poder prepararlo.
        </p>
      )}

      {mode === "seller" && isLocker && group.status === "enviado" && (
        <p className="text-xs mt-3" style={{ color: COLOR.muted }}>
          Dejaste el pedido en el locker. Queda en "Listo en locker" hasta que el comprador lo recoja y lo confirme.
        </p>
      )}

      {mode === "seller" && group.status !== "cancelado" && group.status !== "entregado" && onStatus && (
        <div className="flex gap-2 mt-3">
          {next && paid && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              disabled={busy}
              onClick={() => onStatus(next)}
              className="flex-1 rounded-full py-2.5 text-sm font-semibold"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              Marcar como {nextLabel}
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy}
            onClick={() => onStatus("cancelado")}
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ border: `1px solid ${COLOR.border}`, color: "#FF8A65" }}
          >
            Cancelar
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
