import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { AuthButton, AuthField, AuthShell } from "./ui/AuthKit";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/cuenta");
  };

  return (
    <AuthShell
      title="Bienvenido a Nexo"
      subtitle="Ingresa para comprar, vender y chatear con tiendas."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-semibold hover:underline" style={{ color: "#C8FF4D" }}>
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label="Correo" delay={0.05} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField label="Contraseña" delay={0.1} type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p className="text-xs" style={{ color: "#FF8A65" }}>
            {error}
          </p>
        )}
        <AuthButton type="submit" loading={submitting}>
          {submitting ? "Ingresando..." : "Ingresar"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
