import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { BadgeCheck, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as storesApi from "../lib/storesApi";
import * as verificationApi from "../lib/sellerVerificationApi";
import { EMPTY_VERIFICATION } from "../lib/sellerVerificationApi";

import { AuthButton, AuthShell } from "./ui/AuthKit";
import VerificationFields from "./VerificationFields";

const COLOR = { negro: "#0B0A09", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378", coral: "#FF8A65" };

function StatusCard({ icon: Icon, color, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${color}` }}>
      <span className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
        <Icon size={22} style={{ color: COLOR.negro }} />
      </span>
      <p className="text-lg font-bold mt-3" style={{ color: COLOR.hueso }}>
        {title}
      </p>
      <div className="text-sm mt-1.5 leading-relaxed" style={{ color: COLOR.muted }}>
        {children}
      </div>
    </motion.div>
  );
}

// Estado de la verificación del vendedor, con el formulario para enviarla
// (o volver a enviarla si fue rechazada).
export default function SellerVerificationPage() {
  const { user, loading } = useAuth();
  const [value, setValue] = useState(EMPTY_VERIFICATION);
  const [data, setData] = useState(null); // { store, verification }
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const slug = user?.storeSlug;
  const userId = user?.id;

  useEffect(() => {
    if (!slug || !userId) return;
    let cancelled = false;
    Promise.all([storesApi.fetchStoreBySlug(slug), verificationApi.fetchMyVerification(userId)])
      .then(([store, verification]) => {
        if (cancelled) return;
        setData({ store, verification });
        setLoadedFor(slug);
      })
      .catch(() => !cancelled && setLoadedFor(slug));
    return () => {
      cancelled = true;
    };
  }, [slug, userId, reloadKey]);

  if (loading) return null;

  if (!user || !slug) {
    return (
      <AuthShell title="Verificación de vendedor" subtitle="Primero crea tu tienda para poder verificarla.">
        <Link to={user ? "/vender" : "/ingresar"} className="nexo-glow block text-center rounded-full py-3.5 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
          {user ? "Crear mi tienda" : "Ingresar"}
        </Link>
      </AuthShell>
    );
  }

  if (loadedFor !== slug) return null;

  const store = data?.store;
  const verification = data?.verification;
  const verified = Boolean(store?.verified);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const problem = verificationApi.validateVerification(value);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    try {
      await verificationApi.submitVerification({ ownerId: userId, storeId: store.id, ...value });
      setValue(EMPTY_VERIFICATION);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err?.code === "DOC_DUPLICADO" ? err.message : "No se pudo enviar tu verificación. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const status = verified ? "verificado" : verification?.status ?? "ninguna";

  return (
    <AuthShell title="Verificación de vendedor" subtitle={`Tienda: ${store?.name ?? slug}`}>
      {status === "verificado" && (
        <StatusCard icon={BadgeCheck} color={COLOR.lima} title="¡Tu identidad está verificada!">
          <p>Tu tienda ya puede publicar y recibir pedidos, y muestra la insignia de verificada.</p>
          <Link to="/panel" className="inline-block mt-4 rounded-full px-6 py-2.5 text-sm font-semibold" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
            Ir al panel
          </Link>
        </StatusCard>
      )}

      {status === "pendiente" && (
        <StatusCard icon={Clock} color="#F5C242" title="Estamos revisando tus datos">
          <p>
            Recibimos tu {verificationApi.DOC_LABEL[verification.docType]} ({verification.docNumber}). Mientras lo revisamos puedes preparar tu catálogo, pero aún no puedes publicar ni recibir pedidos.
          </p>
        </StatusCard>
      )}

      {(status === "rechazado" || status === "ninguna") && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {status === "rechazado" && (
            <StatusCard icon={ShieldAlert} color={COLOR.coral} title="Tu verificación fue rechazada">
              <p>{verification.rejectReason || "No pudimos validar tus datos."} Corrige la información y vuelve a enviarla.</p>
            </StatusCard>
          )}
          <VerificationFields value={value} onChange={setValue} />
          {error && (
            <p className="text-xs" style={{ color: COLOR.coral }}>
              {error}
            </p>
          )}
          <AuthButton type="submit" loading={submitting}>
            {submitting ? "Enviando..." : "Enviar para verificación"}
          </AuthButton>
          <p className="flex items-center gap-1.5 text-[11px] justify-center" style={{ color: COLOR.muted }}>
            <ShieldCheck size={12} />
            Tus datos se guardan de forma privada.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
