import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { NotificationsContext } from "./notificationsContext";
import * as api from "../lib/notificationsApi";

const BASE_TITLE = typeof document !== "undefined" ? document.title : "Nexo";

function sortDesc(list) {
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function upsert(list, n) {
  return sortDesc([n, ...list.filter((x) => x.id !== n.id)]);
}

function readPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

// Mantiene las notificaciones del usuario siempre al día (Supabase Realtime):
// lista, contadores para la campana y el chat, avisos emergentes (toasts) y,
// si la persona lo permite, avisos del navegador cuando la pestaña está oculta.
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const userId = user?.id;

  const [items, setItems] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [browserPermission, setBrowserPermission] = useState(readPermission);

  // Valores que los callbacks de tiempo real necesitan leer sin re-suscribirse.
  const pathRef = useRef(pathname);
  const navigateRef = useRef(navigate);
  useEffect(() => {
    pathRef.current = pathname;
    navigateRef.current = navigate;
  });
  const storeSlug = user?.storeSlug;
  const slugRef = useRef(storeSlug);
  useEffect(() => {
    slugRef.current = storeSlug;
  }, [storeSlug]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    api.fetchNotifications(userId).then((data) => {
      if (cancelled) return;
      setItems(data);
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const announce = useCallback((n) => {
    // Si ya estás viendo esa conversación, no hace falta avisarte.
    if (n.type === "mensaje" && pathRef.current === `/chats/${n.data?.conversation_id}`) return;

    setToasts((prev) => [{ id: n.id, notification: n, key: `${n.id}-${n.createdAt}` }, ...prev.filter((t) => t.id !== n.id)].slice(0, 3));

    if (typeof document !== "undefined" && document.hidden && readPermission() === "granted") {
      try {
        const system = new Notification(n.title, { body: n.body, tag: n.id });
        system.onclick = () => {
          window.focus();
          navigateRef.current(api.notificationPath(n, slugRef.current));
          system.close();
        };
      } catch {
        // algunos navegadores móviles no permiten crear avisos así
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    return api.subscribeToNotifications(userId, {
      onInsert: (n) => {
        setItems((prev) => upsert(prev, n));
        announce(n);
      },
      onUpdate: (n) => {
        setItems((prev) => upsert(prev, n));
        if (!n.readAt) announce(n);
        else setToasts((prev) => prev.filter((t) => t.id !== n.id));
      },
      onDelete: (id) => setItems((prev) => prev.filter((x) => x.id !== id)),
    });
  }, [userId, announce]);

  const visible = useMemo(() => (userId && loadedFor === userId ? items : []), [userId, loadedFor, items]);

  const bellCount = useMemo(() => visible.filter((n) => !n.readAt && n.type !== "mensaje").length, [visible]);
  const chatCount = useMemo(
    () => visible.filter((n) => !n.readAt && n.type === "mensaje").reduce((sum, n) => sum + (Number(n.data?.count) || 1), 0),
    [visible]
  );

  // Contador en la pestaña del navegador: "(3) Nexo".
  useEffect(() => {
    const total = bellCount + chatCount;
    document.title = total > 0 ? `(${total > 9 ? "9+" : total}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [bellCount, chatCount]);

  const dismissToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const markRead = useCallback((ids) => {
    const set = new Set(ids);
    setItems((prev) => prev.map((n) => (set.has(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setToasts((prev) => prev.filter((t) => !set.has(t.id)));
    api.markNotificationsRead(ids);
  }, []);

  const markAllRead = useCallback(() => {
    const ids = items.filter((n) => !n.readAt && n.type !== "mensaje").map((n) => n.id);
    if (ids.length === 0) return;
    markRead(ids);
  }, [items, markRead]);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    api.deleteNotification(id);
  }, []);

  const enableBrowserAlerts = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
  }, []);

  const value = useMemo(
    () => ({ items: visible, loading: Boolean(userId) && loadedFor !== userId, bellCount, chatCount, toasts: userId ? toasts : [], dismissToast, markRead, markAllRead, remove, browserPermission, enableBrowserAlerts }),
    [visible, userId, loadedFor, bellCount, chatCount, toasts, dismissToast, markRead, markAllRead, remove, browserPermission, enableBrowserAlerts]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
