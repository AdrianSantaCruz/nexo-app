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

// Con forma de entrega y punto de recojo (migration 15).
const SELECT_V15 =
  "id, store_id, subtotal, commission_amount, payout_amount, fulfillment_status, created_at, stores(name, slug), orders!inner(id, status, payment_method, payment_reference, buyer_id, delivery_method, profiles(name), pickup_points(name, district, address, hours)), order_items(id, product_name, unit_price, quantity, selected_options, customization_note)";

// Con la comisión por compra segura del comprador (migration 17).
const SELECT =
  "id, store_id, subtotal, commission_amount, payout_amount, fulfillment_status, created_at, stores(name, slug), order_codes(code), orders!inner(id, status, payment_method, payment_reference, buyer_id, delivery_method, buyer_fee, profiles(name), pickup_points(name, district, address, hours)), order_items(id, product_name, unit_price, quantity, selected_options, customization_note)";

// Con el código único del pedido (migration 16). Solo el comprador puede leerlo.
const SELECT_V16 =
  "id, store_id, subtotal, commission_amount, payout_amount, fulfillment_status, created_at, stores(name, slug), order_codes(code), orders!inner(id, status, payment_method, payment_reference, buyer_id, delivery_method, profiles(name), pickup_points(name, district, address, hours)), order_items(id, product_name, unit_price, quantity, selected_options, customization_note)";

// Si las migraciones 15 y 16 todavía no se corrieron, baja a la consulta
// anterior para que "Mis pedidos" y "Ventas" sigan funcionando.
async function queryGroups(build) {
  for (const select of [SELECT, SELECT_V16, SELECT_V15]) {
    const res = await build(select);
    if (!res.error) return res;
  }
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
    buyerFee: Number(row.orders?.buyer_fee ?? 0),
    pickupPoint: row.orders?.pickup_points
      ? {
          name: row.orders.pickup_points.name,
          district: row.orders.pickup_points.district,
          address: row.orders.pickup_points.address,
          hours: row.orders.pickup_points.hours,
        }
      : undefined,
    // Código único del pedido: solo el comprador puede leerlo (la tienda recibe null por RLS).
    orderCode: (Array.isArray(row.order_codes) ? row.order_codes[0]?.code : row.order_codes?.code) ?? undefined,
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

const DELIVER_ERRORS = {
  CODIGO_INCORRECTO: "El código no es correcto. Pídeselo de nuevo al comprador.",
  PEDIDO_NO_PAGADO: "El pedido todavía no está pagado.",
  ESTADO_INVALIDO: "Primero marca el pedido como preparando.",
  ENTREGA_EN_LOCKER: "Este pedido se entrega en un locker: el locker registra el retiro.",
};

// Entrega a coordinar: el vendedor digita el código que le da el comprador.
export async function deliverWithCode(groupId, code) {
  const { error } = await supabase.rpc("deliver_with_code", { p_group: groupId, p_code: code });
  if (error) {
    const key = Object.keys(DELIVER_ERRORS).find((k) => error.message?.includes(k));
    throw new Error(key ? DELIVER_ERRORS[key] : "No se pudo confirmar la entrega. Inténtalo de nuevo.", { cause: error });
  }
}
