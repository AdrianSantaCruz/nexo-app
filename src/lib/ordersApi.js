import { supabase } from "./supabaseClient";

// Pedidos: "Mis compras" (comprador) y "Ventas" (vendedor), separados por
// tienda. Los cambios de estado pasan por funciones del servidor (migration
// 11 y 13), que además devuelven el stock al cancelar.

export const STATUS_LABEL = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// En pedidos de locker el estado "enviado" significa "ya está en el locker" y
// "entregado" que el comprador lo recogió.
export const LOCKER_STATUS_LABEL = { ...STATUS_LABEL, enviado: "Listo en locker", entregado: "Recogido" };

export function statusLabel(group) {
  return (group.deliveryMethod === "locker" ? LOCKER_STATUS_LABEL : STATUS_LABEL)[group.status];
}

export const METHOD_LABEL = { tarjeta: "Tarjeta", yape: "Yape", plin: "Plin" };

const BASE_SELECT =
  "id, store_id, subtotal, commission_amount, payout_amount, fulfillment_status, created_at, stores(name, slug), orders!inner(id, status, payment_method, payment_reference, buyer_id, profiles(name)), order_items(id, product_name, unit_price, quantity, selected_options, customization_note)";

// Con lockers (migration 15): forma de entrega, punto de recojo y código.
const SELECT =
  "id, store_id, subtotal, commission_amount, payout_amount, fulfillment_status, created_at, stores(name, slug), locker_codes(code), orders!inner(id, status, payment_method, payment_reference, buyer_id, delivery_method, profiles(name), pickup_points(name, district, address, hours)), order_items(id, product_name, unit_price, quantity, selected_options, customization_note)";

// Si la migración 15 todavía no se corrió, vuelve a la consulta anterior para
// que "Mis pedidos" y "Ventas" sigan funcionando.
async function queryGroups(build) {
  const first = await build(SELECT);
  if (!first.error) return first;
  return build(BASE_SELECT);
}

function mapGroup(row) {
  return {
    id: row.id,
    orderId: row.orders?.id,
    paymentStatus: row.orders?.status ?? "pendiente",
    paymentMethod: row.orders?.payment_method ?? undefined,
    paymentReference: row.orders?.payment_reference ?? undefined,
    storeId: row.store_id,
    storeName: row.stores?.name ?? "Tienda",
    storeSlug: row.stores?.slug,
    buyerName: row.orders?.profiles?.name ?? "Comprador",
    deliveryMethod: row.orders?.delivery_method ?? "coordinar",
    pickupPoint: row.orders?.pickup_points
      ? {
          name: row.orders.pickup_points.name,
          district: row.orders.pickup_points.district,
          address: row.orders.pickup_points.address,
          hours: row.orders.pickup_points.hours,
        }
      : undefined,
    // Solo el comprador puede leerlo (la tienda recibe null por RLS).
    lockerCode: (Array.isArray(row.locker_codes) ? row.locker_codes[0]?.code : row.locker_codes?.code) ?? undefined,
    subtotal: Number(row.subtotal),
    commission: Number(row.commission_amount),
    payout: Number(row.payout_amount),
    status: row.fulfillment_status,
    createdAt: row.created_at,
    lines: (row.order_items ?? []).map((i) => ({
      id: i.id,
      productName: i.product_name,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      selectedOptions: i.selected_options ?? undefined,
      customizationNote: i.customization_note ?? undefined,
    })),
  };
}

export async function fetchMyOrders(userId) {
  const { data, error } = await queryGroups((sel) =>
    supabase.from("order_groups").select(sel).eq("orders.buyer_id", userId).order("created_at", { ascending: false })
  );
  if (error) throw error;
  return (data ?? []).map(mapGroup);
}

export async function fetchStoreOrders(storeId) {
  const { data, error } = await queryGroups((sel) =>
    supabase.from("order_groups").select(sel).eq("store_id", storeId).order("created_at", { ascending: false })
  );
  if (error) throw error;
  return (data ?? []).map(mapGroup);
}

export async function setFulfillmentStatus(groupId, status) {
  const { error } = await supabase.rpc("set_fulfillment_status", { p_group: groupId, p_status: status });
  if (error) throw error;
}

export async function cancelMyOrderGroup(groupId) {
  const { error } = await supabase.rpc("cancel_my_order_group", { p_group: groupId });
  if (error) throw error;
}
