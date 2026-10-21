import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useAuth } from "../context/authContext";
import { REPORT_REASONS, reportContent } from "../lib/moderationApi";
import { SPRING_BOUNCY } from "../lib/motionConfig";

const COLOR = {
  negro: "#0B0A09",
  surfaceHigh: "#1E1B18",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

// Reporte de contenido (publicación, comentario, perfil, tienda, producto o
// reseña). `target`: { type, id }. Se guarda en la tabla `reports`.
export default function ReportModal({ target, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!reason) return;
    if (!user) {
      onClose();
      navigate("/ingresar");
      return;
    }
    setSending(true);
    setError("");
    try {
      await reportContent({ reporterId: user.id, targetType: target.type, targetId: target.id, reason, details });
      setDone(true);
    } catch {
      setError("No se pudo enviar el reporte. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="nexo-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="nexo-modal w-full max-w-sm rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
      >
        <button onClick={onClose} className="absolute right-4 top-4" aria-label="Cerrar">
          <X size={18} style={{ color: COLOR.muted }} />
        </button>

        {done ? (
          <div className="flex flex-col items-center text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={SPRING_BOUNCY}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLOR.lima }}
            >
              <Check size={32} strokeWidth={3} style={{ color: COLOR.negro }} />
            </motion.div>
            <p className="text-lg font-bold mt-4" style={{ color: COLOR.hueso }}>
              Gracias por avisarnos
            </p>
            <p className="text-sm mt-1.5" style={{ color: COLOR.muted }}>
              Revisaremos este contenido y tomaremos medidas si incumple las normas de Nexo.
            </p>
            <button onClick={onClose} className="w-full rounded-full py-3 text-sm font-semibold mt-5" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
              Listo
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-center" style={{ color: COLOR.hueso }}>
              Reportar contenido
            </h2>
            <p className="text-sm text-center mb-4" style={{ color: COLOR.muted }}>
              ¿Qué problema encontraste?
            </p>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r) => {
                const on = reason === r;
                return (
                  <motion.button
                    key={r}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setReason(r)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-left"
                    style={{
                      backgroundColor: on ? "rgba(200,255,77,0.08)" : COLOR.surfaceHigh,
                      border: `1px solid ${on ? COLOR.lima : COLOR.border}`,
                      color: on ? COLOR.lima : COLOR.hueso,
                    }}
                  >
                    {r}
                    {on && <Check size={16} />}
                  </motion.button>
                );
              })}
            </div>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detalles (opcional)"
              className="w-full mt-3 rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: COLOR.surfaceHigh, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
            {error && (
              <p className="text-xs mt-2" style={{ color: "#FF8A65" }}>
                {error}
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!reason || sending}
              className="w-full rounded-full py-3 text-sm font-semibold mt-4 disabled:opacity-50"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              {sending ? "Enviando..." : "Enviar reporte"}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
