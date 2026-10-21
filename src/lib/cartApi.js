import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Carrito y checkout. El pedido se crea en el SERVIDOR (función SQL
// create_order, ver supabase/migration_10_stock.sql): descuenta el stock de
// forma atómica y calcula los precios desde la base de datos. Queda en estado
// "pendiente" porque todavía no hay pasarela de pagos — es un registro real
// útil para coordinar el pago con la tienda por chat mientras tanto.
// ---------------------------------------------------------------------------

// Si el comprador eligió todas las opciones, busca si esa combinación exacta
// tiene precio propio (ej. talla XL más cara); si no, usa el precio base.
function resolveUnitPrice(product, selectedOptions) {
  const groups = product.options ? Object.keys(product.options) : [];
  if (groups.length === 0 || !selectedOptions || !groups.every((g) => selectedOptions[g])) return Number(product.price);
  const match = (product.product_variants ?? []).find((v) => groups.every((g) => v.option_values[g] === selectedOptions[g]));
  return match ? Number(match.price) : Number(product.price);
}

function mapCartItem(row) {
  const p = row.products;
  const selectedOptions = row.selected_options ?? undefined;
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    selectedOptions,
    customizationNote: row.customization_note ?? undefined,
    unitPrice: p ? resolveUnitPrice(p, selectedOptions) : 0,
    product: p
      ? {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock ?? 0,
          imageUrl: p.image_url ?? undefined,
          storeId: p.store_id,
          storeName: p.stores?.name,
          storeSlug: p.stores?.slug,
        }
      : null,
  };
}

const CART_SELECT =
  "*, products(id, name, price, stock, options, image_url, store_id, stores(name, slug), product_variants(option_values, price))";

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

// Crea el pedido del carrito del usuario. Si no alcanza el stock lanza un
// error con `code === "SIN_STOCK"` y `productName`.
export async function checkout() {
  const { data, error } = await supabase.rpc("create_order");
  if (error) {
    const match = /SIN_STOCK:(.*)/.exec(error.message ?? "");
    if (match) {
      const err = new Error("Sin stock suficiente");
      err.code = "SIN_STOCK";
      err.productName = match[1].trim();
      throw err;
    }
    throw error;
  }
  return data;
}

// PAGO SIMULADO (ver supabase/migration_13_payment_simulation.sql): marca el
// pedido como pagado en el servidor con una referencia falsa. No se cobra
// dinero real. Se reemplazará por la pasarela real (Culqi / Niubiz), que
// confirmará el pago desde el servidor.
export async function paySimulated(orderId, method) {
  const { data, error } = await supabase.rpc("pay_order_simulated", { p_order: orderId, p_method: method });
  if (error) throw error;
  return data;
}
