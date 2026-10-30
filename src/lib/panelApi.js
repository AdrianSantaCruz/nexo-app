import { supabase } from "./supabaseClient";

// Datos del panel de la tienda: publicaciones propias con sus números reales.

function count(rel) {
  return rel?.[0]?.count ?? 0;
}

export async function fetchStorePosts(storeId) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, caption, media_url, media_type, created_at, post_likes(count), post_comments(count), post_products(products(name))")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    caption: row.caption,
    mediaUrl: row.media_url ?? undefined,
    mediaType: row.media_type ?? undefined,
    createdAt: row.created_at,
    likes: count(row.post_likes),
    comments: count(row.post_comments),
    tagged: (row.post_products ?? []).map((pp) => pp.products?.name).filter(Boolean),
  }));
}
