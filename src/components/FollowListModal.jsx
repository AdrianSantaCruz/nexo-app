import { Link } from "react-router-dom";
import { X } from "lucide-react";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

export default function FollowListModal({ title, people, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full md:max-w-sm max-h-[75vh] md:max-h-[60vh] rounded-t-2xl md:rounded-2xl flex flex-col"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
          <span className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
            {title}
          </span>
          <button onClick={onClose}>
            <X size={18} style={{ color: COLOR.muted }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <p className="text-xs px-4 py-4" style={{ color: COLOR.muted }}>
              Cargando...
            </p>
          ) : people.length === 0 ? (
            <p className="text-xs px-4 py-4" style={{ color: COLOR.muted }}>
              Todavía no hay nadie aquí.
            </p>
          ) : (
            people.map((p) => (
              <Link
                key={p.id}
                to={`/perfil/${p.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden"
                  style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
                >
                  {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : p.initials}
                </div>
                <span className="text-sm truncate" style={{ color: COLOR.hueso }}>
                  {p.name}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
