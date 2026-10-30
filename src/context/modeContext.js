import { createContext, useContext } from "react";

// Modo de uso: "comprador" (por defecto) o "tienda" (solo para quien tiene una).
export const ModeContext = createContext({ storeMode: false, hasStore: false, setStoreMode: () => {} });

export function useMode() {
  return useContext(ModeContext);
}
