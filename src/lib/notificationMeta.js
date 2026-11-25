import { BadgeCheck, Bell, Heart, MessageCircle, MessageSquare, Package, ShoppingBag, UserPlus } from "lucide-react";

// Ícono y color de cada tipo de notificación (compartido por la lista y los avisos emergentes).
export const NOTIFICATION_META = {
  mensaje: { icon: MessageCircle, color: "#53FC63" },
  pedido_nuevo: { icon: ShoppingBag, color: "#53FC63" },
  pedido_estado: { icon: Package, color: "#7DD3FC" },
  verificacion: { icon: BadgeCheck, color: "#53FC63" },
  seguidor: { icon: UserPlus, color: "#C4B5FD" },
  like: { icon: Heart, color: "#FF8A65" },
  comentario: { icon: MessageSquare, color: "#F5C242" },
};

export function metaFor(type) {
  return NOTIFICATION_META[type] ?? { icon: Bell, color: "#53FC63" };
}
