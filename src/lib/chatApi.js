import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Chat comprador-vendedor real, con Supabase Realtime. Una `conversation` es
// única por (comprador, tienda). Un mismo usuario puede aparecer en la lista
// como comprador (hablando con otras tiendas) y como vendedor (respondiendo
// a compradores de su propia tienda) — `mapConversation` calcula quién es
// "la otra persona" según el punto de vista de quien mira.
// ---------------------------------------------------------------------------

function mapMessage(row) {
  return { id: row.id, senderId: row.sender_id, text: row.text, createdAt: row.created_at };
}

function mapConversation(row, myUserId) {
  const isBuyer = row.buyer_id === myUserId;
  const messages = (row.messages ?? []).map(mapMessage).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return {
    id: row.id,
    storeId: row.store_id,
    storeSlug: row.stores?.slug,
    buyerId: row.buyer_id,
    isBuyer,
    otherName: isBuyer ? row.stores?.name ?? "Tienda" : row.profiles?.name ?? "Comprador",
    otherInitials: isBuyer ? row.stores?.initials ?? "T" : row.profiles?.initials ?? "U",
    otherAvatarUrl: isBuyer ? row.stores?.avatar_url ?? undefined : undefined,
    messages,
    lastMessage: messages[messages.length - 1],
  };
}

const CONVERSATION_SELECT = "*, stores(name, slug, initials, avatar_url), profiles(name, initials), messages(id, sender_id, text, created_at)";

// Trae TODAS las conversaciones donde el usuario participa, ya sea como
// comprador o como dueño de alguna tienda involucrada — un solo inbox.
export async function fetchConversations(userId) {
  const { data, error } = await supabase.from("conversations").select(CONVERSATION_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapConversation(row, userId));
}

export async function fetchConversation(conversationId, userId) {
  const { data, error } = await supabase.from("conversations").select(CONVERSATION_SELECT).eq("id", conversationId).maybeSingle();
  if (error) throw error;
  return data ? mapConversation(data, userId) : null;
}

// Busca la conversación comprador↔tienda existente, o crea una nueva.
export async function getOrCreateConversation(buyerId, storeId) {
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({ buyer_id: buyerId, store_id: storeId })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

export async function sendMessage(conversationId, senderId, text) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, text })
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data);
}

// Escucha mensajes nuevos de una conversación en tiempo real (Supabase
// Realtime) — así si la otra persona escribe, aparece sin recargar.
export function subscribeToMessages(conversationId, onInsert) {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(mapMessage(payload.new))
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
