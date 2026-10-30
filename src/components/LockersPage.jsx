import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, MapPin, PackageCheck, KeyRound, Store } from "lucide-react";
import * as pickupApi from "../lib/pickupApi";
import { LockerCard } from "./PickupPicker";
import { EmptyState, Reveal, Skeleton, Stagger, StaggerItem } from "./ui/Motion";

const COLOR = { negro: "#0B0A09", surface: "#151311", border: "#2A2622", lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

const STEPS = [
  { icon: Store, title: "La tienda deja tu pedido", text: "Cuando está listo, lo guarda en el locker que elegiste." },
  { icon: KeyRound, title: "Recibes un código", text: "Aparece en Mis pedidos. Solo tú puedes verlo." },
  { icon: PackageCheck, title: "Lo recoges cuando quieras", text: "Abres el locker con tu código y confirmas la entrega." },
];

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
