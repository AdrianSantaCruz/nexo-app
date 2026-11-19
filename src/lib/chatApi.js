import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Chat comprador-vendedor real, con Supabase Realtime. Una `conversation` es
// única por (comprador, tienda). Un mismo usuario puede aparecer en la lista
// como comprador (hablando con otras tiendas) y como vendedor (respondiendo
// a compradores de su propia tienda) — `mapConversation` calcula quién es
// "la otra persona" según el punto de vista de quien mira.
//
// Tiempo real:
//  - `subscribeToInbox`: mensajes nuevos / vistos y conversaciones nuevas de
//    TODAS las conversaciones del usuario (Realtime respeta las políticas RLS,
//    así que solo llegan filas que esta persona puede leer).
//  - `joinChatRoom`: "escribiendo…" y "en línea" de una conversación abierta.
// ---------------------------------------------------------------------------

function mapMessage(row) {
  return { id: row.id, senderId: row.sender_id, text: row.text, createdAt: row.created_at, readAt: row.read_at ?? null, conversationId: row.conversation_id };
}

function mapConversation(row, myUserId) {
  const isBuyer = row.buyer_id === myUserId;
  const messages = (row.messages ?? []).map(mapMessage).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return {
    id: row.id,
    storeId: row.store_id,
    storeSlug: row.stores?.slug,
    storeName: row.stores?.name,
    buyerId: row.buyer_id,
    isBuyer,
    otherName: isBuyer ? row.stores?.name ?? "Tienda" : row.profiles?.name ?? "Comprador",
    otherInitials: isBuyer ? row.stores?.initials ?? "T" : row.profiles?.initials ?? "U",
    otherAvatarUrl: isBuyer ? row.stores?.avatar_url ?? undefined : undefined,
    createdAt: row.created_at,
    messages,
    lastMessage: messages[messages.length - 1],
  };
}

// Con `read_at` (migration_19) y sin él, para que la web siga funcionando
// aunque esa migración todavía no se haya corrido.
const SELECT_V19 = "*, stores(name, slug, initials, avatar_url), profiles(name, initials), messages(id, conversation_id, sender_id, text, created_at, read_at)";
const SELECT_BASE = "*, stores(name, slug, initials, avatar_url), profiles(name, initials), messages(id, conversation_id, sender_id, text, created_at)";

async function selectConversations(build) {
  const first = await build(SELECT_V19);
  if (!first.error) return first;
  return build(SELECT_BASE);
}

export function unreadCount(conversation, myUserId) {
  return conversation.messages.filter((m) => m.senderId !== myUserId && !m.readAt).length;
}

export function activityStamp(conversation) {
  return new Date(conversation.lastMessage?.createdAt ?? conversation.createdAt).getTime();
}

// Trae TODAS las conversaciones donde el usuario participa, ya sea como
// comprador o como dueño de alguna tienda involucrada — un solo inbox.
export async function fetchConversations(userId) {
  const { data, error } = await selectConversations((sel) => supabase.from("conversations").select(sel));
  if (error) throw error;
  return (data ?? []).map((row) => mapConversation(row, userId)).sort((a, b) => activityStamp(b) - activityStamp(a));
}

export async function fetchConversation(conversationId, userId) {
  const { data, error } = await selectConversations((sel) => supabase.from("conversations").select(sel).eq("id", conversationId).maybeSingle());
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

// Marca como vistos los mensajes que la otra persona te escribió. Si la
// migración 19 aún no está aplicada, no hace nada (no es un error para el usuario).
export async function markConversationRead(conversationId) {
  const { error } = await supabase.rpc("mark_conversation_read", { p_conversation: conversationId });
  return !error;
}

// Nombre de canal único: la librería de Supabase REUTILIZA un canal si ya existe
// otro con el mismo nombre, y entonces falla al agregarle escuchas. Con un sufijo
// aleatorio cada suscripción tiene su propio canal (importa al volver rápido a
// una pantalla y en modo desarrollo, donde React monta dos veces).
const uniqueName = (base) => `${base}-${Math.random().toString(36).slice(2, 8)}`;

// Escucha TODO el chat del usuario en vivo: mensajes nuevos, mensajes vistos y
// conversaciones nuevas. Devuelve la función para dejar de escuchar.
export function subscribeToInbox(userId, { onMessage, onMessageUpdate, onConversation }) {
  const channel = supabase
    .channel(uniqueName(`inbox-${userId}`))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => onMessage?.(mapMessage(payload.new)))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => onMessageUpdate?.(mapMessage(payload.new)))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => onConversation?.(payload.new.id))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// Sala en vivo de una conversación abierta: avisa cuando la otra persona está
// escribiendo y si está en línea (presencia). La sala debe tener el MISMO nombre
// para las dos personas, así que antes de crearla se cierra cualquier canal viejo
// con ese nombre. Devuelve { notifyTyping, leave }.
export function joinChatRoom(conversationId, userId, { onTyping, onPresence }) {
  const topic = `realtime:chat-room-${conversationId}`;
  let channel = null;
  let closed = false;
  let lastSent = 0;

  const start = async () => {
    const stale = supabase.getChannels().find((c) => c.topic === topic);
    if (stale) await supabase.removeChannel(stale);
    if (closed) return;
    channel = supabase.channel(`chat-room-${conversationId}`, { config: { presence: { key: userId }, broadcast: { self: false } } });
    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId && payload.userId !== userId) onTyping?.(Boolean(payload.typing));
      })
      .on("presence", { event: "sync" }, () => {
        const others = Object.keys(channel.presenceState()).filter((key) => key !== userId);
        onPresence?.(others.length > 0);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") channel.track({ at: Date.now() });
      });
  };
  // Si algo falla aquí, el chat sigue funcionando (solo se pierde "escribiendo…" y "en línea").
  start().catch(() => undefined);

  return {
    // Se limita a un aviso cada 2 s mientras la persona sigue tecleando.
    notifyTyping(typing = true) {
      const now = Date.now();
      if (!channel || (typing && now - lastSent < 2000)) return;
      lastSent = typing ? now : 0;
      channel.send({ type: "broadcast", event: "typing", payload: { userId, typing } }).catch?.(() => undefined);
    },
    leave() {
      closed = true;
      if (channel) supabase.removeChannel(channel);
    },
  };
}
