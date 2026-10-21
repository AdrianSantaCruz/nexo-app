import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CreditCard, FlaskConical, Smartphone, ArrowLeftRight, X } from "lucide-react";
import { EASE_OUT, SPRING, SPRING_BOUNCY } from "../lib/motionConfig";

const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  surfaceHigh: "#1E1B18",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

const METHODS = [
  { id: "tarjeta", label: "Tarjeta", sub: "Crédito o débito", icon: CreditCard },
  { id: "yape", label: "Yape", sub: "Pago con tu celular", icon: Smartphone },
  { id: "plin", label: "Plin", sub: "Pago con tu celular", icon: ArrowLeftRight },
];

const STEPS = ["Conectando con el banco...", "Verificando tu pago...", "Registrando tu pedido..."];
const MIN_PROCESSING_MS = 1900;

function formatSoles(n) {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

// PAGO SIMULADO: no se cobra dinero real. `onPay(method)` debe registrar el
// pago de verdad en el servidor y lanzar un Error si falla.
export default function PaymentModal({ total, onPay, onClose, onDone }) {
  const [method, setMethod] = useState("tarjeta");
  const [phase, setPhase] = useState("choose");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "processing") return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 650);
    return () => clearInterval(timer);
  }, [phase]);

  const pay = async () => {
    setError("");
    setStep(0);
    setPhase("processing");
    const started = Date.now();
    try {
      await onPay(method);
      await new Promise((r) => setTimeout(r, Math.max(0, MIN_PROCESSING_MS - (Date.now() - started))));
      setPhase("success");
    } catch (err) {
      setPhase("choose");
      setError(err?.message || "No se pudo procesar el pago.");
    }
  };

  const close = () => {
    if (phase === "processing") return;
    if (phase === "success") return onDone();
    onClose();
  };

  return (
    <div className="nexo-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nexo-modal w-full max-w-sm rounded-3xl p-6 relative overflow-hidden"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
      >
        {phase !== "processing" && (
          <button onClick={close} className="absolute right-4 top-4" aria-label="Cerrar">
            <X size={18} style={{ color: COLOR.muted }} />
          </button>
        )}

        <AnimatePresence mode="wait">
          {phase === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
              <p className="text-sm text-center" style={{ color: COLOR.muted }}>
                Pagar pedido
              </p>
              <p className="text-4xl font-bold text-center mt-1" style={{ color: COLOR.hueso }}>
                {formatSoles(total)}
              </p>
              <div
                className="mx-auto mt-3 w-fit flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: "rgba(200,255,77,0.08)", border: "1px solid rgba(200,255,77,0.22)", color: COLOR.lima }}
              >
                <FlaskConical size={13} />
                Modo simulación: no se cobra dinero real
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                {METHODS.map((m, i) => {
                  const on = method === m.id;
                  const Icon = m.icon;
                  return (
                    <motion.button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3, ease: EASE_OUT }}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 rounded-2xl p-3.5 text-left"
                      style={{
                        backgroundColor: on ? "rgba(200,255,77,0.08)" : COLOR.surfaceHigh,
                        border: `1.5px solid ${on ? COLOR.lima : COLOR.border}`,
                      }}
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: on ? COLOR.lima : "rgba(200,255,77,0.08)" }}
                      >
                        <Icon size={19} style={{ color: on ? COLOR.negro : COLOR.lima }} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold" style={{ color: COLOR.hueso }}>
                          {m.label}
                        </span>
                        <span className="block text-xs" style={{ color: COLOR.muted }}>
                          {m.sub}
                        </span>
                      </span>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ border: `2px solid ${on ? COLOR.lima : COLOR.muted}` }}
                      >
                        {on && <motion.span layoutId="pay-dot" transition={SPRING} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR.lima }} />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {error && (
                <p className="text-xs text-center mt-3" style={{ color: "#FF8A65" }}>
                  {error}
                </p>
              )}

              <motion.button
                onClick={pay}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="nexo-glow w-full rounded-full py-3.5 text-sm font-semibold mt-5"
                style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
              >
                Pagar {formatSoles(total)}
              </motion.button>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10">
              <motion.div
                className="w-16 h-16 rounded-full"
                style={{ border: `4px solid ${COLOR.border}`, borderTopColor: COLOR.lima }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              />
              <AnimatePresence mode="wait">
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 text-base font-semibold"
                  style={{ color: COLOR.hueso }}
                >
                  {STEPS[step]}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs mt-2" style={{ color: COLOR.muted }}>
                No cierres esta ventana
              </p>
            </motion.div>
          )}

          {phase === "success" && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-6">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={SPRING_BOUNCY}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLOR.lima, boxShadow: "0 0 50px rgba(200,255,77,0.45)" }}
              >
                <Check size={48} strokeWidth={3.2} style={{ color: COLOR.negro }} />
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-2xl font-bold" style={{ color: COLOR.hueso }}>
                ¡Pago aprobado!
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-1.5 text-sm text-center" style={{ color: COLOR.muted }}>
                Tu pedido quedó registrado. Las tiendas ya pueden prepararlo.
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDone}
                className="w-full rounded-full py-3.5 text-sm font-semibold mt-6"
                style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
              >
                Ver mis pedidos
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
