import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./authContext";
import { fetchCart } from "../lib/cartApi";
import { CartContext } from "./cartContext";

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const data = await fetchCart(user.id);
    setItems(data);
    setLoadedUserId(user.id);
  }, [user]);

  useEffect(() => {
    if (!user || loadedUserId === user.id) return;
    fetchCart(user.id).then((data) => {
      setItems(data);
      setLoadedUserId(user.id);
    });
  }, [user, loadedUserId]);

  const visibleItems = user ? items : [];
  const count = visibleItems.reduce((sum, i) => sum + i.quantity, 0);

  return <CartContext.Provider value={{ items: visibleItems, count, refresh }}>{children}</CartContext.Provider>;
}
