import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Banknote, Lock } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as ordersApi from "../lib/ordersApi";
import * as storesApi from "../lib/storesApi";
import OrderCard from "./OrderCard";
import { EmptyState, Reveal, Skeleton } from "./ui/Motion";

const COLOR = { negro: "#0B0A09", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

function formatSoles(n) {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

// Vista del vendedor: pedidos que recibió su tienda. Avanza cada pedido
// (preparando → enviado → entregado) o lo cancela (el stock vuelve solo).
export default function SalesPage() {
  const { storeSlug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    storesApi
      .fetchStoreBySlug(storeSlug)
      .then(async (store) => {
        if (!store) return { isOwner: false, groups: [] };
        const isOwner = Boolean(userId && store.ownerId === userId);
        return { isOwner, groups: isOwner ? await ordersApi.fetchStoreOrders(store.id) : [] };
      })
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setError(false);
        setLoadedSlug(storeSlug);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [storeSlug, userId, authLoading, reloadKey]);

  const changeStatus = async (group, status) => {
    if (status === "cancelado" && !window.confirm("Se devolverá el stock y el comprador verá el pedido como cancelado. ¿Cancelar?")) return;
    setBusyId(group.id);
    try {
      await ordersApi.setFulfillmentStatus(group.id, status);
      setReloadKey((k) => k + 1);
    } catch {
      window.alert("No se pudo actualizar el pedido. Inténtalo de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const deliverWithCode = async (group, code) => {
    await ordersApi.deliverWithCode(group.id, code);
    setReloadKey((k) => k + 1);
  };

  const loaded = loadedSlug === storeSlug && data;
  const toCollect = loaded ? data.groups.filter((g) => g.status !== "cancelado").reduce((s, g) => s + g.payout, 0) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <Link to={`/tienda/${storeSlug}`} className="inline-flex items-center gap-1.5 text-xs mb-3 hover:underline" style={{ color: COLOR.muted }}>
          <ArrowLeft size={13} />
          Volver a la tienda
        </Link>
        <h1 className="text-2xl font-bold mb-6" style={{ color: COLOR.hueso }}>
          Ventas
        </h1>
      </Reveal>

      {error && !loaded ? (
        <EmptyState icon={Banknote} title="No pudimos cargar las ventas" subtitle="Revisa tu conexión e inténtalo de nuevo." />
      ) : !loaded ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-44" />
        </div>
      ) : !data.isOwner ? (
        <EmptyState icon={Lock} title="Solo para el dueño" subtitle="Únicamente el dueño de la tienda puede ver sus ventas." />
      ) : data.groups.length === 0 ? (
        <EmptyState icon={Banknote} title="Aún no tienes ventas" subtitle="Cuando alguien compre en tu tienda, el pedido aparecerá aquí." />
      ) : (
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{ backgroundColor: "rgba(200,255,77,0.07)", border: "1px solid rgba(200,255,77,0.2)" }}
          >
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Por cobrar (sin cancelados)
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: COLOR.lima }}>
              {formatSoles(toCollect)}
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: COLOR.muted }}>
              Después de la comisión de Nexo (8 %).
            </p>
          </motion.div>

          {data.groups.map((g, i) => (
            <OrderCard key={g.id} group={g} index={i} mode="seller" busy={busyId === g.id} onStatus={(s) => changeStatus(g, s)} onDeliverWithCode={(code) => deliverWithCode(g, code)} />
          ))}
        </div>
      )}
    </div>
  );
}
