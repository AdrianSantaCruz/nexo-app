import { supabase } from "./supabaseClient";

function randomFileName(ext) {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}.${ext}`;
}

// Sube la foto o el video de una publicación al bucket "post-media" (misma
// carpeta por tienda que product-images/store-images) y detecta el tipo de
// medio por el archivo mismo, no por lo que el usuario diga.
export async function uploadPostMedia(storeId, file) {
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const ext = file.name.split(".").pop();
  const path = `${storeId}/${randomFileName(ext)}`;
  const { error } = await supabase.storage.from("post-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  return { url: data.publicUrl, mediaType };
}

// `productIds`: productos etiquetados en la publicación (ej. cada prenda
// del outfit del video), para que el comprador pueda ir directo a comprarlos.
export async function createPost({ storeId, authorId, caption, mediaUrl, mediaType, productIds = [] }) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      store_id: storeId,
      author_id: authorId,
      kind: "oferta",
      caption,
      media_url: mediaUrl,
      media_type: mediaType,
    })
    .select()
    .single();
  if (error) throw error;

  if (productIds.length > 0) {
    const { error: tagError } = await supabase
      .from("post_products")
      .insert(productIds.map((productId) => ({ post_id: data.id, product_id: productId })));
    if (tagError) throw tagError;
  }

  return data;
}

export async function likePost(postId, userId) {
  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function unlikePost(postId, userId) {
  const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

function mapComment(row) {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
    authorName: row.profiles?.name ?? "Usuario",
    authorInitials: row.profiles?.initials ?? "U",
  };
}

export async function fetchPostComments(postId) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, text, created_at, profiles(name, initials)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapComment);
}

export async function addComment(postId, authorId, text) {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: authorId, text })
    .select("id, text, created_at, profiles(name, initials)")
    .single();
  if (error) throw error;
  return mapComment(data);
}
