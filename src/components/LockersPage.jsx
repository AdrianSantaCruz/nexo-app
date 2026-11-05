import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, MapPin, PackageCheck, KeyRound, Store, FlaskConical } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/authContext";
import * as pickupApi from "../lib/pickupApi";
import { LockerCard } from "./PickupPicker";
import { EmptyState, Reveal, Skeleton, Stagger, StaggerItem } from "./ui/Motion";

const COLOR = { negro: "#0B0A09", surface: "#151311", border: "#2A2622", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

const STEPS = [
  { icon: Store, title: "La tienda deja tu pedido", text: "Al dejarlo en el locker, este registra que ya está listo." },
  { icon: KeyRound, title: "Tienes tu código de pedido", text: "Aparece en Mis pedidos y solo tú puedes verlo." },
  { icon: PackageCheck, title: "Lo retiras con tu código", text: "Digitas tu código en el locker y este registra la entrega." },
];

// SIMULADOR del teclado del locker: sirve para probar y mostrar el flujo
// completo mientras no existan los lockers físicos.
function LockerSimulator({ points }) {
  const { user } = useAuth();
  const [pointId, setPointId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const digits = code.replace(/\D/g, "");
  const selected = pointId || points[0]?.id || "";

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      await pickupApi.lockerWithdraw(selected, digits);
      setResult({ ok: true, text: "Locker abierto. Pedido retirado: ya figura como Recogido en Mis pedidos." });
      setCode("");
    } catch (err) {
      setResult({ ok: false, text: err?.message || "No se pudo registrar el retiro." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 mt-8" style={{ backgroundColor: COLOR.surface, border: `1px dashed ${COLOR.border}` }}>
      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLOR.hueso }}>
        <FlaskConical size={15} style={{ color: COLOR.lima }} />
        Probar un locker (simulación)
      </p>
      <p className="text-xs mt-1 leading-relaxed" style={{ color: COLOR.muted }}>
        Hasta que existan los lockers físicos, así se ve el retiro: eliges el locker, digitas el código de tu pedido y el locker registra la entrega.
      </p>
      {!user ? (
        <p className="text-xs mt-3" style={{ color: COLOR.muted }}>
          <Link to="/ingresar" className="underline" style={{ color: COLOR.lima }}>
            Inicia sesión
          </Link>{" "}
          para probarlo con tu pedido.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 mt-3">
          <select
            value={selected}
            onChange={(e) => setPointId(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
          >
            {points.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && digits.length === 6 && !busy && submit()}
              placeholder="000 000"
              className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-lg font-bold tracking-[0.3em] text-center outline-none"
              style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy || digits.length !== 6}
              onClick={submit}
              className="rounded-full px-5 text-sm font-semibold disabled:opacity-50 shrink-0"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              {busy ? "Abriendo..." : "Retirar pedido"}
            </motion.button>
          </div>
          {result && (
            <p className="text-xs" style={{ color: result.ok ? COLOR.lima : "#FF8A65" }}>
              {result.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Lista pública de los lockers de Nexo (puntos de recojo en el centro de Arequipa).
export default function LockersPage() {
  const [points, setPoints] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pickupApi
      .fetchPickupPoints()
      .then((data) => !cancelled && setPoints(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <h1 className="text-2xl font-bold" style={{ color: COLOR.hueso }}>
          Lockers Nexo
        </h1>
        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: COLOR.muted }}>
          Puntos de recojo en lugares céntricos de Arequipa. Compra, elige tu locker y recoge tu pedido cuando te convenga, sin esperar al vendedor.
        </p>
      </Reveal>

      <Stagger className="grid sm:grid-cols-3 gap-3 mt-6">
        {STEPS.map((s, i) => (
          <StaggerItem key={s.title}>
            <div className="h-full rounded-2xl p-4" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(200,255,77,0.1)" }}>
                <s.icon size={17} style={{ color: COLOR.lima }} />
              </span>
              <p className="text-sm font-semibold mt-3" style={{ color: COLOR.hueso }}>
                {i + 1}. {s.title}
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: COLOR.muted }}>
                {s.text}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <h2 className="flex items-center gap-2 text-sm font-semibold mt-8 mb-3" style={{ color: COLOR.hueso }}>
        <MapPin size={15} style={{ color: COLOR.lima }} />
        Puntos disponibles
      </h2>

      {error ? (
        <EmptyState icon={Lock} title="No pudimos cargar los lockers" subtitle="Revisa tu conexión e inténtalo de nuevo." />
      ) : points === null ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : points.length === 0 ? (
        <EmptyState icon={Lock} title="Pronto habrá lockers" subtitle="Estamos definiendo los primeros puntos en el centro de Arequipa." />
      ) : (
        <Stagger className="flex flex-col gap-2.5">
          {points.map((p) => (
            <StaggerItem key={p.id}>
              <LockerCard point={p} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {points && points.length > 0 && <LockerSimulator points={points} />}

      <p className="text-[11px] mt-4 leading-relaxed" style={{ color: COLOR.muted }}>
        Ubicaciones referenciales: las direcciones y horarios finales se confirmarán al instalar cada locker.
      </p>

      <Link
        to="/descubrir"
        className="nexo-glow mt-6 inline-flex rounded-full px-8 py-3 text-sm font-semibold"
        style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
      >
        Descubrir productos
      </Link>
    </div>
  );
}
