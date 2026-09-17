import { Link, useNavigate } from "react-router-dom";
import { Star, Sparkles, Store, LogOut } from "lucide-react";
import { useAuth } from "../context/authContext";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex-1 rounded-xl p-4" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
      <Icon size={16} style={{ color: COLOR.lima }} />
      <p className="text-lg font-semibold mt-2" style={{ color: COLOR.hueso }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: COLOR.muted }}>
        {label}
      </p>
    </div>
  );
}

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm mb-4" style={{ color: COLOR.muted }}>
            Inicia sesión para ver tu cuenta, tus puntos y tus reseñas.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link
              to="/ingresar"
              className="rounded-full px-5 py-2.5 text-sm font-medium"
              style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
            >
              Ingresar
            </Link>
            <Link
              to="/registro"
              className="rounded-full px-5 py-2.5 text-sm font-medium border"
              style={{ borderColor: COLOR.border, color: COLOR.hueso }}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold shrink-0"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          {user.initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate" style={{ color: COLOR.hueso }}>
            {user.name}
          </h1>
          <p className="text-xs truncate" style={{ color: COLOR.muted }}>
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <StatCard icon={Star} label="Score de reseñador" value={user.reviewerScore ? user.reviewerScore.toFixed(1) : "—"} />
        <StatCard icon={Sparkles} label="Puntos Nexo" value={user.points} />
      </div>

      {user.storeSlug ? (
        <Link
          to={`/tienda/${user.storeSlug}`}
          className="flex items-center gap-3 mt-3 rounded-xl p-4"
          style={{ backgroundColor: "rgba(200,255,77,0.08)", border: `1px solid ${COLOR.border}` }}
        >
          <Store size={18} style={{ color: COLOR.lima }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium" style={{ color: COLOR.hueso }}>
              Panel de vendedor
            </p>
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Gestiona tu catálogo y personaliza tu tienda.
            </p>
          </div>
        </Link>
      ) : (
        <Link
          to="/vender"
          className="flex items-center gap-3 mt-3 rounded-xl p-4"
          style={{ backgroundColor: COLOR.surface, border: `1px dashed ${COLOR.border}` }}
        >
          <Store size={18} style={{ color: COLOR.muted }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium" style={{ color: COLOR.hueso }}>
              Crea tu tienda
            </p>
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Empieza a vender tus productos en Nexo.
            </p>
          </div>
        </Link>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 mt-6 text-sm"
        style={{ color: COLOR.muted }}
      >
        <LogOut size={15} />
        Cerrar sesión
      </button>
    </div>
  );
}
