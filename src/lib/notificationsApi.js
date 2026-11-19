import { supabase } from "./supabaseClient";

// Centro de notificaciones (supabase/migration_19). Las crean los triggers de
// la base de datos; aquí solo se leen, se marcan como leídas y se escuchan en
// vivo. Si la migración aún no se aplicó, todo devuelve vacío sin romper nada.

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? "",
    data: row.data ?? {},
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(userId, limit = 60) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map(mapNotification);
}

export async function markNotificationsRead(ids = null) {
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  return !error;
}

export async function deleteNotification(id) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  return !error;
}

// Escucha en vivo las notificaciones nuevas (INSERT) y las que se actualizan
// (UPDATE: un mensaje más en la misma conversación, o se marcó como leída).
export function subscribeToNotifications(userId, { onInsert, onUpdate, onDelete }) {
  const filter = `user_id=eq.${userId}`;
  const channel = supabase
    .channel(`notifications-${userId}-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter }, (payload) => onInsert?.(mapNotification(payload.new)))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter }, (payload) => onUpdate?.(mapNotification(payload.new)))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications", filter }, (payload) => onDelete?.(payload.old?.id))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// A qué pantalla lleva cada notificación.
export function notificationPath(n, storeSlug) {
  const d = n.data ?? {};
  switch (n.type) {
    case "mensaje":
      return d.conversation_id ? `/chats/${d.conversation_id}` : "/chats";
    case "pedido_nuevo":
      return storeSlug ? `/ventas/${storeSlug}` : "/pedidos";
    case "pedido_estado":
      return d.as_store && storeSlug ? `/ventas/${storeSlug}` : "/pedidos";
    case "verificacion":
      return "/verificacion";
    case "seguidor":
      return d.profile_id ? `/perfil/${d.profile_id}` : "/cuenta";
    case "like":
    case "comentario":
      return d.profile_id ? `/perfil/${d.profile_id}` : "/";
    default:
      return "/notificaciones";
  }
}

// Texto corto "hace 5 min" para la lista.
export function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}
