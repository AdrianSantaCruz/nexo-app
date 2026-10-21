import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthButton, AuthField, AuthShell } from "./ui/AuthKit";
import { useAuth } from "../context/authContext";
import { createStore, isSlugAvailable } from "../lib/storesApi";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CreateStorePage() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.storeSlug) navigate(`/tienda/${user.storeSlug}`, { replace: true });
  }, [user, navigate]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm mb-4" style={{ color: COLOR.muted }}>
            Inicia sesión para crear tu tienda en Nexo.
          </p>
          <Link to="/ingresar" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  const handleNameChange = (value) => {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanSlug = slugify(slug);
    if (!name.trim() || !cleanSlug) {
      setError("Completa el nombre de tu tienda.");
      return;
    }
    setSubmitting(true);
    try {
      const available = await isSlugAvailable(cleanSlug);
      if (!available) {
        setError("Ese enlace ya está en uso, prueba con otro nombre.");
        setSubmitting(false);
        return;
      }
      await createStore({ ownerId: user.id, name: name.trim(), description: description.trim(), slug: cleanSlug });
      await refreshUser();
      navigate(`/tienda/${cleanSlug}`);
    } catch {
      setError("No se pudo crear la tienda. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Crea tu tienda" subtitle="Tendrás tu propia página para vender productos y publicar videos.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label="Nombre de tu tienda" delay={0.03} type="text" required value={name} onChange={(e) => handleNameChange(e.target.value)} />

        <div>
          <label className="text-xs font-medium" style={{ color: COLOR.muted }}>
            Enlace de tu tienda
          </label>
          <div
            className="flex items-center gap-1 mt-1.5 rounded-xl px-4 py-3 border border-[#2A2622] bg-[#0B0A09] transition focus-within:border-[#C8FF4D] focus-within:shadow-[0_0_0_3px_rgba(200,255,77,0.12)]"
          >
            <span className="text-xs shrink-0" style={{ color: COLOR.muted }}>
              nexo.app/tienda/
            </span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: COLOR.hueso }}
            />
          </div>
        </div>

        <AuthField label="Descripción" delay={0.1} as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

        {error && (
          <p className="text-xs" style={{ color: "#FF8A65" }}>
            {error}
          </p>
        )}

        <AuthButton type="submit" loading={submitting}>
          {submitting ? "Creando..." : "Crear tienda"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
