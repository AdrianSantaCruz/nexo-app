import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "../context/authContext";
import { AuthButton, AuthField, AuthShell } from "./ui/AuthKit";

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
      <AuthShell title="Revisa tu correo" subtitle={`Te enviamos un enlace de confirmación a ${email}. Confírmalo para poder ingresar.`}>
        <div className="flex justify-center">
          <MailCheck size={30} style={{ color: "#C8FF4D" }} />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Compra, vende y descubre emprendimientos peruanos."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/ingresar" className="font-semibold hover:underline" style={{ color: "#C8FF4D" }}>
            Ingresar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label="Nombre" delay={0.03} type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <AuthField label="Correo" delay={0.07} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField label="Contraseña" delay={0.11} type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p className="text-xs" style={{ color: "#FF8A65" }}>
            {error}
          </p>
        )}
        <AuthButton type="submit" loading={submitting}>
          {submitting ? "Creando..." : "Crear cuenta"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
