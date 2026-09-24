import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Contenido real para Feed y Descubrir: productos recién publicados por
// tiendas reales + reseñas reales de compradores. No hay todavía un sistema
// de "me gusta"/comentarios persistente en la base de datos, así que esos
// contadores se muestran en 0 (el corazón sigue siendo interactivo en el
// feed, pero solo como afecto visual de la sesión, no se guarda).
// ---------------------------------------------------------------------------

function formatPrice(value) {
  const num = Number(value);
  return `S/ ${Number.isInteger(num) ? num : num.toFixed(2)}`;
}

function mapProductItem(row) {
  return {
    id: `producto-${row.id}`,
    kind: "producto",
    store: row.stores?.name ?? "Tienda",
    storeSlug: row.stores?.slug,
    initials: row.stores?.initials ?? "T",
    storeAvatarUrl: row.stores?.avatar_url ?? undefined,
    productId: row.id,
    caption: row.name,
    price: formatPrice(row.price),
    imageUrl: row.image_url ?? undefined,
    likes: 0,
    comments: 0,
    createdAt: row.created_at,
  };
}

function mapReviewItem(row) {
  const product = row.products;
  return {
    id: `resena-${row.id}`,
    kind: "review",
    buyer: row.profiles?.name ?? "Comprador",
    buyerId: row.profiles?.id,
    initials: row.profiles?.initials ?? "U",
    store: product?.stores?.name ?? "Tienda",
    storeSlug: product?.stores?.slug,
    storeAvatarUrl: product?.stores?.avatar_url ?? undefined,
    productId: product?.id,
    caption: row.quote,
    imageUrl: product?.image_url ?? undefined,
    likes: 0,
    comments: 0,
    createdAt: row.created_at,
  };
}

function mapPostItem(row, currentUserId) {
  const likeRows = row.post_likes ?? [];
  return {
    id: `publicacion-${row.id}`,
    postId: row.id,
    kind: "publicacion",
    store: row.stores?.name ?? "Tienda",
    storeSlug: row.stores?.slug,
    initials: row.stores?.initials ?? "T",
    storeAvatarUrl: row.stores?.avatar_url ?? undefined,
    caption: row.caption,
    imageUrl: row.media_type === "image" ? row.media_url ?? undefined : undefined,
    videoUrl: row.media_type === "video" ? row.media_url ?? undefined : undefined,
    likes: likeRows.length,
    likedByMe: currentUserId ? likeRows.some((l) => l.user_id === currentUserId) : false,
    comments: (row.post_comments ?? []).length,
    taggedProducts: (row.post_products ?? [])
      .map((pp) => pp.products)
      .filter(Boolean)
      .map((p) => ({ id: p.id, name: p.name, price: formatPrice(p.price), imageUrl: p.image_url ?? undefined })),
    createdAt: row.created_at,
  };
}

// Trae productos, reseñas y publicaciones (foto/video) reales, mezclados y
// ordenados del más nuevo al más viejo — esto alimenta tanto el Feed
// (vertical) como Descubrir (grid). `currentUserId` (opcional) se usa para
// saber si el usuario ya le dio like a cada publicación.
export async function fetchFeedItems(currentUserId) {
  const [
    { data: products, error: productsError },
    { data: reviews, error: reviewsError },
    { data: posts, error: postsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, image_url, created_at, stores(name, slug, initials, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("reviews")
      .select("id, quote, created_at, profiles(id, name, initials), products(id, image_url, stores(name, slug, avatar_url))")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("posts")
      .select(
        "id, caption, media_url, media_type, created_at, stores(name, slug, initials, avatar_url), post_likes(user_id), post_comments(id), post_products(products(id, name, price, image_url))"
      )
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (productsError) throw productsError;
  if (reviewsError) throw reviewsError;
  if (postsError) throw postsError;

  const items = [
    ...(products ?? []).map(mapProductItem),
    ...(reviews ?? []).map(mapReviewItem),
    ...(posts ?? []).map((row) => mapPostItem(row, currentUserId)),
  ];
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items;
}
