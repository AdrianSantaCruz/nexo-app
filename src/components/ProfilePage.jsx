import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, Sparkles, Store, LogOut, Pencil, ImagePlus, UserPlus, UserCheck, Users } from "lucide-react";
import { useAuth } from "../context/authContext";
import * as profilesApi from "../lib/profilesApi";
import FollowListModal from "./FollowListModal";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  lima: "#C8FF4D",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function StatButton({ icon: Icon, label, value, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="flex-1 rounded-xl p-4 text-left"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <Icon size={16} style={{ color: COLOR.lima }} />
      <p className="text-lg font-semibold mt-2" style={{ color: COLOR.hueso }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: COLOR.muted }}>
        {label}
      </p>
    </Comp>
  );
}

function ImageUploadField({ label, imageUrl, uploading, error, round, onUpload, onRemove }) {
  return (
    <div>
      <label className="text-xs" style={{ color: COLOR.muted }}>
        {label}
      </label>
      <label
        className={`mt-1 flex items-center justify-center cursor-pointer overflow-hidden ${round ? "rounded-full w-20 h-20" : "w-full rounded-lg"}`}
        style={{ height: round ? undefined : 96, backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ImagePlus size={18} style={{ color: COLOR.muted }} />
            {!round && (
              <span className="text-[11px]" style={{ color: COLOR.muted }}>
                {uploading ? "Subiendo..." : "Subir foto"}
              </span>
            )}
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
      </label>
      {imageUrl && (
        <button type="button" onClick={onRemove} className="text-[11px] mt-1" style={{ color: COLOR.muted }}>
          Quitar foto
        </button>
      )}
      {error && (
        <p className="text-[11px] mt-1" style={{ color: "#FF8A65" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ProfileEditor({ profile, userId, onSave, onCancel }) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadError, setUploadError] = useState({});
  const [saving, setSaving] = useState(false);

  const handleUpload = async (kind, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError((prev) => ({ ...prev, [kind]: "" }));
    setUploadingField(kind);
    try {
      const url = await profilesApi.uploadProfileImage(userId, file, kind);
      if (kind === "avatar") setAvatarUrl(url);
      else setBannerUrl(url);
    } catch (err) {
      setUploadError((prev) => ({ ...prev, [kind]: err?.message || "No se pudo subir la imagen." }));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), bio: bio.trim(), avatarUrl, bannerUrl });
    setSaving(false);
  };

  return (
    <div className="pt-11 md:pt-12 pb-2 flex flex-col gap-3 max-w-lg">
      <p className="text-xs font-medium" style={{ color: COLOR.muted }}>
        Personaliza tu perfil
      </p>
      <ImageUploadField
        label="Foto de portada"
        imageUrl={bannerUrl}
        uploading={uploadingField === "banner"}
        error={uploadError.banner}
        onUpload={(e) => handleUpload("banner", e)}
        onRemove={() => setBannerUrl("")}
      />
      <ImageUploadField
        label="Foto de perfil"
        imageUrl={avatarUrl}
        uploading={uploadingField === "avatar"}
        error={uploadError.avatar}
        round
        onUpload={(e) => handleUpload("avatar", e)}
        onRemove={() => setAvatarUrl("")}
      />
      <div>
        <label className="text-xs" style={{ color: COLOR.muted }}>
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
        />
      </div>
      <div>
        <label className="text-xs" style={{ color: COLOR.muted }}>
          Biografía
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntanos algo sobre ti..."
          className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
        />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={uploadingField !== null || saving}
          className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button onClick={onCancel} className="rounded-full px-4 py-2 text-sm" style={{ color: COLOR.muted }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ review }) {
  return (
    <Link
      to={review.storeSlug && review.productId ? `/tienda/${review.storeSlug}/producto/${review.productId}` : "#"}
      className="flex gap-3 rounded-xl p-3"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: COLOR.negro }}>
        {review.productImageUrl && <img src={review.productImageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-snug" style={{ color: COLOR.hueso }}>
          &ldquo;{review.quote}&rdquo;
        </p>
        <p className="text-[11px] mt-1 truncate" style={{ color: COLOR.lima }}>
          {review.productName} · {review.storeName}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: COLOR.muted }}>
          {formatDate(review.createdAt)}
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Perfil social del comprador — mismo componente para "Mi cuenta" (/cuenta,
// sin userId en la URL, siempre el usuario logueado) y para ver el perfil de
// cualquier otra persona (/perfil/:userId): banner, foto, biografía, score
// de reseñador, puntos, reseñas que ha escrito, y seguidores/seguidos.
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading, logout, refreshUser } = useAuth();

  const targetUserId = paramUserId ?? currentUser?.id;
  const isOwnProfile = Boolean(currentUser) && Boolean(targetUserId) && targetUserId === currentUser.id;

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalPeople, setModalPeople] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [amFollowing, setAmFollowing] = useState(false);
  const [loadedFollowKey, setLoadedFollowKey] = useState(null);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    Promise.all([
      profilesApi.fetchProfile(targetUserId),
      profilesApi.fetchProfileReviews(targetUserId),
      profilesApi.fetchFollowCounts(targetUserId),
    ]).then(([p, r, c]) => {
      setProfile(p);
      setReviews(r);
      setCounts(c);
      setLoadedUserId(targetUserId);
    });
  }, [targetUserId]);

  const followKey = currentUser && targetUserId ? `${currentUser.id}:${targetUserId}` : null;
  useEffect(() => {
    if (!followKey || isOwnProfile) return;
    profilesApi.isFollowing(currentUser.id, targetUserId).then((v) => {
      setAmFollowing(v);
      setLoadedFollowKey(followKey);
    });
  }, [followKey, isOwnProfile, currentUser, targetUserId]);

  if (authLoading) return null;

  if (!targetUserId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm mb-4" style={{ color: COLOR.muted }}>
            Inicia sesión para ver tu cuenta, tus puntos y tus reseñas.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link to="/ingresar" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: COLOR.lima, color: COLOR.negro }}>
              Ingresar
            </Link>
            <Link to="/registro" className="rounded-full px-5 py-2.5 text-sm font-medium border" style={{ borderColor: COLOR.border, color: COLOR.hueso }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const loading = loadedUserId !== targetUserId;
  if (loading) return null;

  if (!profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <p className="text-sm" style={{ color: COLOR.muted }}>
          No se encontró este perfil.
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSaveProfile = async (patch) => {
    await profilesApi.updateProfile(currentUser.id, patch);
    setProfile((prev) => ({ ...prev, ...patch }));
    setIsEditing(false);
    refreshUser();
  };

  const openModal = (type) => {
    setModalType(type);
    setModalLoading(true);
    const fetcher = type === "followers" ? profilesApi.fetchFollowers : profilesApi.fetchFollowing;
    fetcher(targetUserId).then((data) => {
      setModalPeople(data);
      setModalLoading(false);
    });
  };

  const toggleFollow = async () => {
    if (!currentUser || followBusy || loadedFollowKey !== followKey) return;
    setFollowBusy(true);
    try {
      if (amFollowing) {
        await profilesApi.unfollowUser(currentUser.id, targetUserId);
        setAmFollowing(false);
        setCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      } else {
        await profilesApi.followUser(currentUser.id, targetUserId);
        setAmFollowing(true);
        setCounts((c) => ({ ...c, followers: c.followers + 1 }));
      }
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="h-32 md:h-48 relative md:mt-6 md:rounded-2xl" style={{ backgroundColor: COLOR.surface }}>
        {profile.bannerUrl && (
          <div className="absolute inset-0 overflow-hidden md:rounded-2xl">
            <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {isOwnProfile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute right-3 top-3 md:right-4 md:top-4 flex items-center gap-1 rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <Pencil size={12} style={{ color: COLOR.lima }} />
            <span className="text-[11px]" style={{ color: COLOR.lima }}>
              Editar perfil
            </span>
          </button>
        )}
        <div
          className="absolute left-4 md:left-6 -bottom-8 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-semibold text-xl overflow-hidden z-10"
          style={{ backgroundColor: COLOR.lima, border: `3px solid ${COLOR.negro}`, color: COLOR.negro }}
        >
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : profile.initials}
        </div>
      </div>

      <div className="px-4 md:px-6">
        {isEditing ? (
          <ProfileEditor profile={profile} userId={currentUser.id} onSave={handleSaveProfile} onCancel={() => setIsEditing(false)} />
        ) : (
          <>
            <div className="pt-11 md:pt-12">
              <h1 className="text-lg font-semibold" style={{ color: COLOR.hueso }}>
                {profile.name}
              </h1>
              {isOwnProfile && (
                <p className="text-xs" style={{ color: COLOR.muted }}>
                  {currentUser.email}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm mt-2 leading-snug" style={{ color: COLOR.hueso }}>
                  {profile.bio}
                </p>
              )}
            </div>

            {!isOwnProfile && currentUser && (
              <button
                onClick={toggleFollow}
                disabled={followBusy}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-full py-2.5 px-5 text-sm font-medium disabled:opacity-60"
                style={amFollowing ? { border: `1px solid ${COLOR.border}`, color: COLOR.hueso } : { backgroundColor: COLOR.lima, color: COLOR.negro }}
              >
                {amFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                {amFollowing ? "Siguiendo" : "Seguir"}
              </button>
            )}

            <div className="flex gap-3 mt-5">
              <StatButton icon={Star} label="Score de reseñador" value={profile.reviewerScore ? profile.reviewerScore.toFixed(1) : "—"} />
              <StatButton icon={Sparkles} label="Puntos Nexo" value={profile.points} />
            </div>
            <div className="flex gap-3 mt-3">
              <StatButton icon={Users} label="Seguidores" value={counts.followers} onClick={() => openModal("followers")} />
              <StatButton icon={Users} label="Siguiendo" value={counts.following} onClick={() => openModal("following")} />
            </div>

            {isOwnProfile &&
              (currentUser.storeSlug ? (
                <Link
                  to={`/tienda/${currentUser.storeSlug}`}
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
              ))}

            <div className="mt-7">
              <h2 className="text-sm font-semibold mb-2.5" style={{ color: COLOR.hueso }}>
                Reseñas
              </h2>
              {reviews.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {reviews.map((r) => (
                    <ReviewRow key={r.id} review={r} />
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: COLOR.muted }}>
                  {isOwnProfile ? "Todavía no has escrito reseñas." : "Todavía no ha escrito reseñas."}
                </p>
              )}
            </div>

            {isOwnProfile && (
              <button onClick={handleLogout} className="flex items-center gap-2 mt-7 text-sm" style={{ color: COLOR.muted }}>
                <LogOut size={15} />
                Cerrar sesión
              </button>
            )}
          </>
        )}
      </div>

      {modalType && (
        <FollowListModal
          title={modalType === "followers" ? "Seguidores" : "Siguiendo"}
          people={modalPeople}
          loading={modalLoading}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}
