import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as ordersApi from "../lib/ordersApi";
import * as cartApi from "../lib/cartApi";
import OrderCard from "./OrderCard";
import PaymentModal from "./PaymentModal";
import { EmptyState, Reveal, Skeleton } from "./ui/Motion";

const COLOR = { negro: "#0B0A09", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

// "Mis pedidos": todo lo que compró el usuario, separado por tienda, con el
// estado del pago y de la entrega (los datos son reales, vienen de Supabase).
export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [groups, setGroups] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    ordersApi
      .fetchMyOrders(userId)
      .then((data) => {
        if (cancelled) return;
        setGroups(data);
        setError(false);
        setLoadedFor(userId);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  if (authLoading) return null;

  if (!user) {
    return (
      <EmptyState icon={Receipt} title="Tus pedidos" subtitle="Inicia sesión para ver tus compras.">
        <Link to="/ingresar" className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          Ingresar
        </Link>
      </EmptyState>
    );
  }

  const payingGroups = groups.filter((g) => g.orderId === payingOrderId);
  const payingTotal = payingGroups.reduce((sum, g) => sum + g.subtotal, 0) + (payingGroups[0]?.buyerFee ?? 0);
  // La comisión por compra segura es una por pedido: se muestra en la primera tienda de cada pedido.
  const feeCarrier = new Map();
  for (const g of groups) if (!feeCarrier.has(g.orderId)) feeCarrier.set(g.orderId, g.id);

  const cancel = async (group) => {
    if (!window.confirm(`¿Cancelar tu pedido en ${group.storeName}? Se devolverá el stock a la tienda.`)) return;
    setBusyId(group.id);
    try {
      await ordersApi.cancelMyOrderGroup(group.id);
      reload();
    } catch {
      window.alert("No se pudo cancelar: puede que la tienda ya haya empezado a prepararlo.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <h1 className="text-2xl font-bold mb-6" style={{ color: COLOR.hueso }}>
          Mis pedidos
        </h1>
      </Reveal>

      {error && loadedFor !== userId ? (
        <EmptyState icon={Receipt} title="No pudimos cargar tus pedidos" subtitle="Revisa tu conexión e inténtalo de nuevo.">
          <button onClick={() => { setError(false); reload(); }} className="rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Reintentar
          </button>
        </EmptyState>
      ) : loadedFor !== userId ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={Receipt} title="Aún no tienes pedidos" subtitle="Cuando compres algo, lo verás aquí con su estado.">
          <Link to="/descubrir" className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Descubrir productos
          </Link>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g, i) => (
            <OrderCard
              key={g.id}
              group={g}
              index={i}
              mode="buyer"
              buyerFee={feeCarrier.get(g.orderId) === g.id ? g.buyerFee : 0}
              busy={busyId === g.id}
              onCancel={() => cancel(g)}
              onPay={() => setPayingOrderId(g.orderId)}
            />
          ))}
        </div>
      )}

      {payingOrderId && (
        <PaymentModal
          total={payingTotal}
          onPay={async (method) => {
            try {
              await cartApi.paySimulated(payingOrderId, method);
            } catch {
              throw new Error("No se pudo procesar el pago. Inténtalo de nuevo.");
            }
          }}
          onClose={() => setPayingOrderId(null)}
          onDone={() => {
            setPayingOrderId(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
