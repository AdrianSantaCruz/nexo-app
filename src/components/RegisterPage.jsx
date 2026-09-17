import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoMark from "./LogoMark";
import { useAuth } from "../context/authContext";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await register({ name, email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setConfirmationSent(true);
      return;
    }
    navigate("/cuenta");
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <LogoMark size={40} />
          <h1 className="text-lg font-semibold mt-3 mb-2" style={{ color: COLOR.hueso }}>
            Revisa tu correo
          </h1>
          <p className="text-sm" style={{ color: COLOR.muted }}>
            Te enviamos un enlace de confirmación a <span style={{ color: COLOR.hueso }}>{email}</span>. Confírmalo para poder ingresar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <LogoMark size={40} />
          <h1 className="text-lg font-semibold mt-3" style={{ color: COLOR.hueso }}>
            Crea tu cuenta en Nexo
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#FF8A65" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full py-2.5 text-sm font-medium mt-1 disabled:opacity-60"
            style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
          >
            {submitting ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: COLOR.muted }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/ingresar" className="hover:underline" style={{ color: COLOR.lima }}>
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
