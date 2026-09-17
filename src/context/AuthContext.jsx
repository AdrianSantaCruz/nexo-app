import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContext";

function translateAuthError(message) {
  if (!message) return "Ocurrió un error inesperado.";
  if (message.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (message.includes("User already registered")) return "Ya existe una cuenta con este correo.";
  if (message.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  return message;
}

async function loadUser(authUser) {
  if (!authUser) return null;

  const [{ data: profile }, { data: store }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("stores").select("slug").eq("owner_id", authUser.id).maybeSingle(),
  ]);

  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name ?? authUser.email,
    initials: profile?.initials ?? "U",
    reviewerScore: profile?.reviewer_score ?? null,
    points: profile?.points ?? 0,
    storeSlug: store?.slug ?? null,
  };
}

// Autenticación real vía Supabase Auth. `profiles` se crea automáticamente
// al registrarse (trigger en la base de datos); aquí solo la leemos y la
// combinamos con si el usuario ya tiene una tienda propia.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(await loadUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const nextUser = await loadUser(session?.user ?? null);
      if (mounted) {
        setUser(nextUser);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = await loadUser(session?.user ?? null);
      if (mounted) setUser(nextUser);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  const register = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    if (!data.session) return { ok: true, needsEmailConfirmation: true };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
