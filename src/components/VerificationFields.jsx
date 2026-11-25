import { motion } from "motion/react";
import { ImagePlus, ShieldCheck, Check } from "lucide-react";
import { AuthField } from "./ui/AuthKit";
import { DOC_LABEL } from "../lib/sellerVerificationApi";

const COLOR = { negro: "#0B0A09", surface: "#151311", border: "#2A2622", lima: "#53FC63", hueso: "#FBF6EF", muted: "#8A8378" };

function PhotoPick({ label, file, onChange, required }) {
  return (
    <label
      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition hover:border-[#53FC63]"
      style={{ backgroundColor: COLOR.negro, border: `1px dashed ${file ? COLOR.lima : COLOR.border}` }}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: file ? COLOR.lima : "rgba(83,252,99,0.08)" }}>
        {file ? <Check size={17} style={{ color: COLOR.negro }} /> : <ImagePlus size={17} style={{ color: COLOR.lima }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium" style={{ color: COLOR.hueso }}>
          {label}
          {!required && <span style={{ color: COLOR.muted }}> (opcional)</span>}
        </span>
        <span className="block text-[11px] truncate" style={{ color: COLOR.muted }}>
          {file ? file.name : "JPG, PNG o WEBP · máximo 5 MB"}
        </span>
      </span>
      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

// Campos para identificarse como vendedor con DNI o RUC. Es un componente
// controlado: `value` es { docType, docNumber, legalName, front, back }.
export default function VerificationFields({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const isRuc = value.docType === "ruc";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-2.5 rounded-xl p-3" style={{ backgroundColor: "rgba(83,252,99,0.06)", border: "1px solid rgba(83,252,99,0.2)" }}>
        <ShieldCheck size={17} className="shrink-0 mt-0.5" style={{ color: COLOR.lima }} />
        <p className="text-xs leading-relaxed" style={{ color: COLOR.hueso }}>
          Para vender necesitamos confirmar tu identidad. Tus datos se guardan de forma privada, solo el equipo de Nexo los revisa y nunca se muestran a otros usuarios. Hasta que los aprobemos podrás preparar tu tienda, pero no publicar ni recibir pedidos.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium" style={{ color: COLOR.muted }}>
          Tipo de documento
        </label>
        <div className="flex gap-2 mt-1.5">
          {Object.entries(DOC_LABEL).map(([id, label]) => {
            const on = value.docType === id;
            return (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => set({ docType: id })}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={on ? { backgroundColor: COLOR.lima, color: COLOR.negro } : { border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AuthField
        label={isRuc ? "Número de RUC (11 dígitos)" : "Número de DNI (8 dígitos)"}
        inputMode="numeric"
        maxLength={isRuc ? 11 : 8}
        value={value.docNumber}
        onChange={(e) => set({ docNumber: e.target.value.replace(/\D/g, "") })}
      />
      <AuthField
        label={isRuc ? "Razón social o nombre del titular" : "Nombre completo (como figura en tu DNI)"}
        value={value.legalName}
        onChange={(e) => set({ legalName: e.target.value })}
      />

      <PhotoPick label={isRuc ? "Foto del DNI del titular (frente)" : "Foto de tu DNI (frente)"} file={value.front} required onChange={(f) => set({ front: f })} />
      <PhotoPick label="Foto del DNI (reverso)" file={value.back} onChange={(f) => set({ back: f })} />
    </div>
  );
}
