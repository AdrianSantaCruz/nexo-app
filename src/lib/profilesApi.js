import { supabase } from "./supabaseClient";

function randomFileName(ext) {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}.${ext}`;
}

function mapProfile(row) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    bannerUrl: row.banner_image_url ?? undefined,
    reviewerScore: row.reviewer_score ?? null,
    points: row.points ?? 0,
  };
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function updateProfile(userId, { name, bio }) {
  const { error } = await supabase.from("profiles").update({ name, bio }).eq("id", userId);
  if (error) throw error;
}

// kind: "avatar" | "banner" — sube la imagen al bucket "profile-images"
// (carpeta por user id) y guarda la URL en la columna correspondiente.
export async function uploadProfileImage(userId, file, kind) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${kind}-${randomFileName(ext)}`;
  const { error } = await supabase.storage.from("profile-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("profile-images").getPublicUrl(path);

  const column = kind === "avatar" ? "avatar_url" : "banner_image_url";
  const { error: updateError } = await supabase.from("profiles").update({ [column]: data.publicUrl }).eq("id", userId);
  if (updateError) throw updateError;

  return data.publicUrl;
}

function mapReview(row) {
  const product = row.products;
  return {
    id: row.id,
    quote: row.quote,
    createdAt: row.created_at,
    productId: product?.id,
    productName: product?.name,
    productImageUrl: product?.image_url ?? undefined,
    storeName: product?.stores?.name,
    storeSlug: product?.stores?.slug,
  };
}

// Reseñas que ESTE comprador ha escrito — son sus "publicaciones" en su
// propio perfil, igual que en el Feed pero filtradas a una sola persona.
export async function fetchProfileReviews(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, quote, created_at, products(id, name, image_url, stores(name, slug))")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

export async function fetchFollowCounts(userId) {
  const [{ count: followers, error: e1 }, { count: following, error: e2 }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { followers: followers ?? 0, following: following ?? 0 };
}

function mapFollowProfile(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, initials: row.initials, avatarUrl: row.avatar_url ?? undefined };
}

// Personas que siguen a `userId`.
export async function fetchFollowers(userId) {
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follows_follower_id_fkey(id, name, initials, avatar_url)")
    .eq("following_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => mapFollowProfile(r.profiles)).filter(Boolean);
}

// Personas a las que sigue `userId`.
export async function fetchFollowing(userId) {
  const { data, error } = await supabase
    .from("follows")
    .select("profiles!follows_following_id_fkey(id, name, initials, avatar_url)")
    .eq("follower_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => mapFollowProfile(r.profiles)).filter(Boolean);
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function followUser(followerId, followingId) {
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  if (error) throw error;
}
