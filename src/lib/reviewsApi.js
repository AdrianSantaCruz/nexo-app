import { supabase } from "./supabaseClient";

// ¿Este usuario compró el producto? ¿Ya lo reseñó? (el servidor además lo
// exige: solo los compradores del producto pueden reseñarlo.)
export async function fetchReviewEligibility(userId, productId) {
  const [purchase, review] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, order_groups!inner(orders!inner(buyer_id))")
      .eq("product_id", productId)
      .eq("order_groups.orders.buyer_id", userId)
      .limit(1),
    supabase.from("reviews").select("id").eq("product_id", productId).eq("buyer_id", userId).limit(1),
  ]);
  if (purchase.error) throw purchase.error;
  if (review.error) throw review.error;
  return { purchased: (purchase.data ?? []).length > 0, reviewed: (review.data ?? []).length > 0 };
}

export async function addReview(productId, buyerId, quote) {
  const { error } = await supabase.from("reviews").insert({ product_id: productId, buyer_id: buyerId, quote });
  if (error) throw error;
}
