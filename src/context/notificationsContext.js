import { createContext, useContext } from "react";

export const NotificationsContext = createContext({
  items: [],
  loading: false,
  bellCount: 0, // avisos sin leer que no son mensajes (campana)
  chatCount: 0, // mensajes sin leer (ícono de chats)
  toasts: [],
  dismissToast: () => {},
  markRead: () => {},
  markAllRead: () => {},
  remove: () => {},
  browserPermission: "unsupported",
  enableBrowserAlerts: () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}
