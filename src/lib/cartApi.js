import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Carrito y checkout. El "pedido" que se crea al pagar queda en estado
// "pendiente" porque todavía no hay una pasarela de pagos conectada (ver
// nota en supabase/migration_02_orders.sql) — es un registro real del
// pedido, útil para coordinar el pago con la tienda por chat mientras tanto.
// ---------------------------------------------------------------------------

const COMMISSION_RATE = 0.1; // 10% de comisión de Nexo — ajustable a futuro

function mapCartItem(row) {
  const p = row.products;
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    selectedOptions: row.selected_options ?? undefined,
    customizationNote: row.customization_note ?? undefined,
    product: p
      ? {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          imageUrl: p.image_url ?? undefined,
          storeId: p.store_id,
          storeName: p.stores?.name,
          storeSlug: p.stores?.slug,
        }
      : null,
  };
}

const CART_SELECT = "*, products(id, name, price, image_url, store_id, stores(name, slug))";

export async function fetchCart(buyerId) {
  const { data, error } = await supabase.from("cart_items").select(CART_SELECT).eq("buyer_id", buyerId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCartItem);
}

export async function addToCart({ buyerId, productId, quantity = 1, selectedOptions, customizationNote }) {
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      buyer_id: buyerId,
      product_id: productId,
      quantity,
      selected_options: selectedOptions && Object.keys(selectedOptions).length > 0 ? selectedOptions : null,
      customization_note: customizationNote || null,
    })
    .select(CART_SELECT)
    .single();
  if (error) throw error;
  return mapCartItem(data);
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  if (quantity <= 0) return removeCartItem(cartItemId);
  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
  if (error) throw error;
}

export async function removeCartItem(cartItemId) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

// Crea el pedido a partir del carrito: un `order` general + un `order_group`
// por cada tienda involucrada (con su comisión calculada) + sus
// `order_items`, y vacía el carrito.
export async function checkout(buyerId, cartItems) {
  const byStore = new Map();
  for (const item of cartItems) {
    const storeId = item.product.storeId;
    if (!byStore.has(storeId)) byStore.set(storeId, []);
    byStore.get(storeId).push(item);
  }

  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ buyer_id: buyerId, status: "pendiente", total_amount: total })
    .select()
    .single();
  if (orderError) throw orderError;

  for (const [storeId, items] of byStore) {
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const commission = Math.round(subtotal * COMMISSION_RATE * 100) / 100;

    const { data: group, error: groupError } = await supabase
      .from("order_groups")
      .insert({ order_id: order.id, store_id: storeId, subtotal, commission_amount: commission, payout_amount: subtotal - commission })
      .select()
      .single();
    if (groupError) throw groupError;

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_group_id: group.id,
        product_id: i.productId,
        product_name: i.product.name,
        unit_price: i.product.price,
        quantity: i.quantity,
        selected_options: i.selectedOptions ?? null,
        customization_note: i.customizationNote ?? null,
      }))
    );
    if (itemsError) throw itemsError;
  }

  await supabase.from("cart_items").delete().eq("buyer_id", buyerId);

  return order;
}
