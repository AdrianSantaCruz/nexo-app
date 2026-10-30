import { useCallback, useMemo, useState } from "react";
import { useAuth } from "./authContext";
import { ModeContext } from "./modeContext";

const STORAGE_KEY = "nexo:storeMode";

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// Recuerda en este navegador si el usuario eligió el "modo tienda". Solo se
// activa de verdad si la cuenta tiene una tienda.
export function ModeProvider({ children }) {
  const { user } = useAuth();
  const [wanted, setWanted] = useState(readStored);
  const hasStore = Boolean(user?.storeSlug);

  const setStoreMode = useCallback((on) => {
    setWanted(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      // sin almacenamiento: el modo vale solo para esta sesión
    }
  }, []);

  const value = useMemo(() => ({ storeMode: wanted && hasStore, hasStore, setStoreMode }), [wanted, hasStore, setStoreMode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}
