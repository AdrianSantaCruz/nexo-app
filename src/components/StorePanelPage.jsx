import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Banknote, BellRing, ChevronRight, Clapperboard, Lock, Package, Plus, Receipt, ShoppingBag, Store, TrendingUp, TriangleAlert } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as storesApi from "../lib/storesApi";
import * as ordersApi from "../lib/ordersApi";
import * as panelApi from "../lib/panelApi";
import { EASE_OUT } from "../lib/motionConfig";
import OrderCard from "./OrderCard";
import { PostTile } from "./StorePostsPage";
import PostCreateModal from "./PostCreateModal";
import { EmptyState, Reveal, Skeleton, Stagger, StaggerItem } from "./ui/Motion";

const COLOR = { negro: "#0B0A09", surface: "#151311", surfaceHigh: "#1E1B18", border: "#2A2622", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378", coral: "#FF8A65" };

const DAYS = 14;

function formatSoles(n) {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

const dayKey = (date) => new Date(date).toLocaleDateString("en-CA");

// Cifras de ventas a partir de los pedidos reales. Una venta cuenta solo si el
// pedido está pagado y no fue cancelado.
function computeStats(groups) {
  const sold = groups.filter((g) => g.paymentStatus === "pagado" && g.status !== "cancelado");
  const toAttend = groups.filter((g) => g.paymentStatus === "pagado" && (g.status === "pendiente" || g.status === "preparando"));
  const waitingPayment = groups.filter((g) => g.paymentStatus === "pendiente" && g.status === "pendiente");
  const inLocker = groups.filter((g) => g.deliveryMethod === "locker" && g.status === "enviado");
  const payout = sold.reduce((s, g) => s + g.payout, 0);
  const gross = sold.reduce((s, g) => s + g.subtotal, 0);

  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return { key: dayKey(d), label: d.getDate(), amount: 0 };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const g of sold) {
    const slot = byKey.get(dayKey(g.createdAt));
    if (slot) slot.amount += g.subtotal;
  }

  const products = new Map();
  for (const g of sold) {
    for (const l of g.lines) {
      const cur = products.get(l.productName) ?? { name: l.productName, qty: 0, amount: 0 };
      cur.qty += l.quantity;
      cur.amount += l.unitPrice * l.quantity;
      products.set(l.productName, cur);
    }
  }
  const top = [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return { sold, toAttend, waitingPayment, inLocker, payout, gross, ticket: sold.length ? gross / sold.length : 0, days, top };
}

function Kpi({ icon: Icon, label, value, hint, accent, to }) {
  const inner = (
    <motion.div
      whileHover={{ y: -3 }}
      className="h-full rounded-2xl p-4"
      style={{ backgroundColor: accent ? "rgba(200,255,77,0.07)" : COLOR.surface, border: `1px solid ${accent ? "rgba(200,255,77,0.25)" : COLOR.border}` }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: COLOR.muted }}>
        <Icon size={14} style={{ color: COLOR.lima }} />
        {label}
      </div>
      <p className="text-2xl font-bold mt-2" style={{ color: accent ? COLOR.lima : COLOR.hueso }}>
        {value}
      </p>
      {hint && (
        <p className="text-[11px] mt-1" style={{ color: COLOR.muted }}>
          {hint}
        </p>
      )}
    </motion.div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function Section({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl p-5 ${className}`} style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR.hueso }}>
          <Icon size={16} style={{ color: COLOR.lima }} />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ to, children }) {
  return (
    <Link to={to} className="flex items-center gap-0.5 text-xs font-medium hover:underline" style={{ color: COLOR.lima }}>
      {children}
      <ChevronRight size={13} />
    </Link>
  );
}

function SalesChart({ days }) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  const total = days.reduce((s, d) => s + d.amount, 0);
  return (
    <div>
      <p className="text-xs mb-3" style={{ color: COLOR.muted }}>
        Últimos {DAYS} días · {formatSoles(total)} vendidos
      </p>
      <div className="flex items-end gap-1.5 h-36">
        {days.map((d, i) => (
          <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.key}: ${formatSoles(d.amount)}`}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 6 : 2)}%` }}
              transition={{ duration: 0.6, delay: i * 0.03, ease: EASE_OUT }}
              className="w-full rounded-t-md"
              style={{ backgroundColor: d.amount > 0 ? COLOR.lima : COLOR.border }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {days.map((d) => (
          <span key={d.key} className="flex-1 text-center text-[10px]" style={{ color: COLOR.muted }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Panel principal del modo tienda: lo que hay que atender hoy, las ventas, el
// stock y las publicaciones, con accesos directos a cada parte.
export default function StorePanelPage() {
  const { user, loading: authLoading } = useAuth();
  const slug = user?.storeSlug;
  const [data, setData] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    storesApi
      .fetchStoreBySlug(slug)
      .then(async (store) => {
        if (!store) throw new Error("Sin tienda");
        const [groups, posts] = await Promise.all([ordersApi.fetchStoreOrders(store.id), panelApi.fetchStorePosts(store.id).catch(() => [])]);
        return { store, groups, posts };
      })
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setError(false);
        setLoadedSlug(slug);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  const stats = useMemo(() => (data ? computeStats(data.groups) : null), [data]);

  if (authLoading) return null;

  if (!user || !slug) {
    return (
      <EmptyState icon={Store} title="Panel de tienda" subtitle="Crea tu tienda para ver tus pedidos, ventas y publicaciones en un solo lugar.">
        <Link to={user ? "/vender" : "/ingresar"} className="nexo-glow rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          {user ? "Crear mi tienda" : "Ingresar"}
        </Link>
      </EmptyState>
    );
  }

  const loaded = loadedSlug === slug && data && stats;

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

  const lowStock = loaded ? data.store.products.filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Modo tienda
            </p>
            <h1 className="text-2xl font-bold truncate" style={{ color: COLOR.hueso }}>
              {loaded ? data.store.name : "Tu panel"}
            </h1>
          </div>
          <Link
            to={`/tienda/${slug}`}
            className="shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
            style={{ border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
          >
            <Store size={14} style={{ color: COLOR.lima }} />
            Ver mi tienda
          </Link>
        </div>
      </Reveal>

      {error && !loaded ? (
        <EmptyState icon={Store} title="No pudimos cargar tu panel" subtitle="Revisa tu conexión e inténtalo de nuevo.">
          <button onClick={() => { setError(false); setReloadKey((k) => k + 1); }} className="rounded-full px-8 py-3 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Reintentar
          </button>
        </EmptyState>
      ) : !loaded ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StaggerItem>
              <Kpi icon={BellRing} label="Por atender" value={stats.toAttend.length} hint="Pagados, listos para preparar" accent={stats.toAttend.length > 0} to={`/ventas/${slug}`} />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={Banknote} label="Por cobrar" value={formatSoles(stats.payout)} hint="Después de la comisión (10%)" />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={TrendingUp} label="Ventas" value={stats.sold.length} hint={`Ticket promedio ${formatSoles(Math.round(stats.ticket * 100) / 100)}`} />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={Lock} label="En locker" value={stats.inLocker.length} hint="Esperando que el comprador recoja" to={`/ventas/${slug}`} />
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {[
                { to: "/panel/publicaciones?nueva=1", icon: Plus, label: "Nueva publicación" },
                { to: `/tienda/${slug}`, icon: Package, label: "Agregar producto" },
                { to: `/ventas/${slug}`, icon: Receipt, label: "Todos los pedidos" },
                { to: "/lockers", icon: Lock, label: "Lockers" },
              ].map((a) => (
                <motion.div key={a.label} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Link to={a.to} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}>
                    <a.icon size={14} style={{ color: COLOR.lima }} />
                    {a.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </Reveal>

          <Section title="Pedidos pendientes" icon={Receipt} action={<SeeAll to={`/ventas/${slug}`}>Ver todos</SeeAll>}>
            {stats.toAttend.length === 0 ? (
              <p className="text-sm" style={{ color: COLOR.muted }}>
                No tienes pedidos por atender. {stats.waitingPayment.length > 0 && `${stats.waitingPayment.length} esperando el pago del comprador.`}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.toAttend.slice(0, 3).map((g, i) => (
                  <OrderCard key={g.id} group={g} index={i} mode="seller" busy={busyId === g.id} onStatus={(s) => changeStatus(g, s)} />
                ))}
                {stats.toAttend.length > 3 && (
                  <p className="text-xs text-center" style={{ color: COLOR.muted }}>
                    y {stats.toAttend.length - 3} más en Pedidos
                  </p>
                )}
              </div>
            )}
          </Section>

          <div className="grid md:grid-cols-5 gap-4">
            <Section title="Estadísticas de ventas" icon={TrendingUp} className="md:col-span-3">
              {stats.sold.length === 0 ? (
                <p className="text-sm" style={{ color: COLOR.muted }}>
                  Cuando tengas ventas pagadas verás aquí tus ventas por día y tus productos más vendidos.
                </p>
              ) : (
                <SalesChart days={stats.days} />
              )}
            </Section>

            <Section title="Más vendidos" icon={ShoppingBag} className="md:col-span-2">
              {stats.top.length === 0 ? (
                <p className="text-sm" style={{ color: COLOR.muted }}>
                  Aún no hay ventas.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {stats.top.map((p, i) => (
                    <div key={p.name}>
                      <div className="flex justify-between gap-2 text-xs" style={{ color: COLOR.hueso }}>
                        <span className="truncate">{p.name}</span>
                        <span className="shrink-0" style={{ color: COLOR.muted }}>
                          {p.qty} und · {formatSoles(p.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: COLOR.border }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.qty / stats.top[0].qty) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.1 * i, ease: EASE_OUT }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLOR.lima }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {lowStock.length > 0 && (
            <Section title="Stock bajo" icon={TriangleAlert} action={<SeeAll to={`/tienda/${slug}`}>Editar productos</SeeAll>}>
              <div className="flex flex-wrap gap-2">
                {lowStock.slice(0, 8).map((p) => (
                  <span key={p.id} className="rounded-full px-3 py-1.5 text-xs" style={{ border: `1px solid ${p.stock === 0 ? COLOR.coral : COLOR.border}`, color: p.stock === 0 ? COLOR.coral : COLOR.hueso }}>
                    {p.name} · {p.stock === 0 ? "agotado" : `quedan ${p.stock}`}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section
            title="Mis publicaciones"
            icon={Clapperboard}
            action={
              <div className="flex items-center gap-4">
                <button onClick={() => setCreating(true)} className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: COLOR.lima }}>
                  <Plus size={13} />
                  Nueva
                </button>
                <SeeAll to="/panel/publicaciones">Ver todas</SeeAll>
              </div>
            }
          >
            {data.posts.length === 0 ? (
              <p className="text-sm" style={{ color: COLOR.muted }}>
                Aún no publicas nada. Sube un video o una foto con tus productos etiquetados para aparecer en el Feed.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.posts.slice(0, 4).map((p) => (
                  <PostTile key={p.id} post={p} />
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {creating && loaded && (
        <PostCreateModal
          storeId={data.store.id}
          authorId={user.id}
          accent={COLOR.lima}
          products={data.store.products}
          onCreated={() => {
            setCreating(false);
            setReloadKey((k) => k + 1);
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
