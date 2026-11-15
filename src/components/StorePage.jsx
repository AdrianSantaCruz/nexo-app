import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, animate, motion, useScroll, useTransform } from "motion/react";
import { BadgeCheck, Pencil, X, MessageCircleQuestion, ShoppingCart, Minus, Plus, Trash2, ImagePlus, Check, Film, Flag, Banknote, ShieldAlert, ArrowUpRight, Flame, LayoutDashboard, Package, Quote, Search, Share2, Sparkles } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import * as storesApi from "../lib/storesApi";
import * as chatApi from "../lib/chatApi";
import * as cartApi from "../lib/cartApi";
import ProductEditModal from "./ProductEditModal";
import PostCreateModal from "./PostCreateModal";
import ReportModal from "./ReportModal";
import * as reviewsApi from "../lib/reviewsApi";
import { EASE_OUT, SPRING, SPRING_BOUNCY, SPRING_SOFT } from "../lib/motionConfig";
import { Reveal } from "./ui/Motion";

// ---------------------------------------------------------------------------
// Paleta de marca (Nexo — Nero Labs): el negro es fijo (identidad de la app).
// El color de acento SÍ lo elige cada tienda.
// ---------------------------------------------------------------------------
const COLOR = {
  negro: "#0B0A09",
  surface: "#151311",
  border: "#2A2622",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

const PRESET_ACCENTS = [
  { id: "lima", value: "#C8FF4D" },
  { id: "coral", value: "#FF8A65" },
  { id: "aqua", value: "#4DD9C8" },
  { id: "oro", value: "#F5C242" },
  { id: "rosa", value: "#FF6FA8" },
];

const AccentContext = createContext(PRESET_ACCENTS[0].value);
const useAccent = () => useContext(AccentContext);

// ---------------------------------------------------------------------------
function AccentPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap mt-1.5">
      {PRESET_ACCENTS.map((a) => {
        const selected = a.value === value;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.value)}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: a.value,
              boxShadow: selected ? `0 0 0 2px ${COLOR.negro}, 0 0 0 4px ${a.value}` : "none",
            }}
          >
            {selected && <Check size={13} style={{ color: COLOR.negro }} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

// Número que sube animado desde 0 (estadísticas de la portada).
function CountUp({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE_OUT,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value]);
  return <span ref={ref}>0</span>;
}

// Pestañas pegadas arriba al hacer scroll, con una píldora que se desliza.
function SectionTabs({ active, onChange, counts }) {
  const accent = useAccent();
  const tabs = [
    { id: "productos", label: "Productos", icon: Package },
    { id: "resenas", label: "Reseñas", icon: Sparkles },
  ];
  return (
    <div
      className="sticky top-0 z-30 px-4 md:px-8 py-3"
      style={{ backgroundColor: "rgba(11,10,9,0.82)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${COLOR.border}` }}
    >
      <div className="flex gap-1 p-1 rounded-full w-fit" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
        {tabs.map((t) => {
          const isActive = active === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} className="relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold">
              {isActive && <motion.span layoutId="store-tab-pill" transition={SPRING} className="absolute inset-0 rounded-full" style={{ backgroundColor: accent }} />}
              <span className="relative flex items-center gap-1.5" style={{ color: isActive ? COLOR.negro : COLOR.hueso }}>
                <Icon size={13} />
                {t.label}
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: isActive ? "rgba(11,10,9,0.15)" : COLOR.border, color: isActive ? COLOR.negro : COLOR.muted }}
                >
                  {counts[t.id]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ product, onOpen, size = "normal", isOwner, onEdit, onDelete, index = 0 }) {
  const accent = useAccent();
  const isSmall = size === "small";
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.045, ease: EASE_OUT }}
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      className={`group relative ${isSmall ? "shrink-0 w-44 md:w-52" : "w-full"}`}
    >
      <motion.div
        variants={{ hover: { y: -6 } }}
        transition={SPRING_SOFT}
        className="relative rounded-2xl overflow-hidden text-left h-full"
        style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, transition: "box-shadow .3s, border-color .3s" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accent}88`;
          e.currentTarget.style.boxShadow = `0 22px 44px rgba(0,0,0,0.55), 0 0 0 1px ${accent}22, 0 0 28px ${accent}1f`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = COLOR.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {isOwner && (
          <div className="absolute top-2 right-2 z-10 flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              aria-label="Editar producto"
              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110"
              style={{ backgroundColor: "rgba(11,10,9,0.7)" }}
            >
              <Pencil size={13} style={{ color: COLOR.hueso }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
              }}
              aria-label="Eliminar producto"
              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110"
              style={{ backgroundColor: "rgba(11,10,9,0.7)" }}
            >
              <Trash2 size={13} style={{ color: "#FF8A65" }} />
            </button>
          </div>
        )}
        <button onClick={() => onOpen(product)} className="w-full text-left block">
          <div className="relative overflow-hidden aspect-[4/5]" style={{ backgroundColor: product.color }}>
            {product.imageUrl && (
              <motion.img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                variants={{ hover: { scale: 1.08 } }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(11,10,9,0.78), transparent)" }} />

            {product.stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]" style={{ backgroundColor: "rgba(11,10,9,0.62)" }}>
                <span className="text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1" style={{ color: COLOR.hueso, border: `1px solid ${COLOR.hueso}55` }}>
                  Agotado
                </span>
              </div>
            )}
            {product.isOffer && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: accent, boxShadow: `0 4px 14px ${accent}66` }}>
                <Flame size={11} style={{ color: COLOR.negro }} />
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLOR.negro }}>
                  Oferta
                </span>
              </div>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="absolute bottom-2.5 left-2.5 rounded-full px-2 py-0.5 backdrop-blur-md" style={{ backgroundColor: "rgba(11,10,9,0.7)", border: "1px solid #FF8A65" }}>
                <span className="text-[10px] font-semibold" style={{ color: "#FF8A65" }}>
                  ¡Quedan {product.stock}!
                </span>
              </div>
            )}
            {/* Aparece al pasar el mouse */}
            <motion.span
              variants={{ hover: { opacity: 1, y: 0 } }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-2.5 right-2.5 hidden md:flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ backgroundColor: COLOR.hueso, color: COLOR.negro }}
            >
              Ver producto
              <ArrowUpRight size={12} />
            </motion.span>
          </div>
          <div className="px-3.5 py-3">
            <p className="text-[13px] leading-snug line-clamp-2 min-h-[2.2rem]" style={{ color: COLOR.hueso }}>
              {product.name}
            </p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-base font-bold" style={{ color: accent }}>
                {product.price}
              </p>
              {product.originalPrice && (
                <p className="text-[11px] line-through" style={{ color: COLOR.muted }}>
                  {product.originalPrice}
                </p>
              )}
            </div>
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}

function AddProductTile({ onClick }) {
  const accent = useAccent();
  return (
    <motion.button
      whileHover={{ y: -4, borderColor: accent }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-10"
      style={{ backgroundColor: "transparent", border: `1.5px dashed ${COLOR.border}`, minHeight: 240 }}
    >
      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}1a` }}>
        <Plus size={20} style={{ color: accent }} />
      </span>
      <span className="text-xs font-medium" style={{ color: COLOR.muted }}>
        Agregar producto
      </span>
    </motion.button>
  );
}

function ReviewCard({ review, productName, index = 0 }) {
  const accent = useAccent();
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05, ease: EASE_OUT }}
      whileHover={{ y: -3 }}
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <Quote size={38} className="absolute -top-1 right-3 opacity-[0.07]" style={{ color: accent }} />
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: accent, color: COLOR.negro }}>
          {review.initials}
        </div>
        <span className="text-xs font-medium" style={{ color: COLOR.hueso }}>
          {review.buyer}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: COLOR.hueso }}>
        &ldquo;{review.quote}&rdquo;
      </p>
      {productName && (
        <p className="text-[11px] mt-3 font-medium" style={{ color: accent }}>
          sobre {productName}
        </p>
      )}
    </motion.div>
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
        style={{ height: round ? undefined : 96, backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
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

function ProfileEditor({ store, accent, onSave, onCancel }) {
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description);
  const [accentValue, setAccentValue] = useState(accent);
  const [avatarUrl, setAvatarUrl] = useState(store.avatarUrl ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(store.bannerImageUrl ?? "");
  const [uploadingField, setUploadingField] = useState(null); // "avatar" | "banner" | null
  const [uploadError, setUploadError] = useState({});

  const handleUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError((prev) => ({ ...prev, [field]: "" }));
    setUploadingField(field);
    try {
      const url = await storesApi.uploadStoreImage(store.id, field, file);
      if (field === "avatar") setAvatarUrl(url);
      else setBannerImageUrl(url);
    } catch (err) {
      setUploadError((prev) => ({ ...prev, [field]: err?.message || "No se pudo subir la imagen." }));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const preset = PRESET_ACCENTS.find((a) => a.value === accentValue);
    onSave({
      name: name.trim(),
      description: description.trim(),
      accentId: preset?.id,
      accentValue,
      avatarUrl,
      bannerImageUrl,
    });
  };

  return (
    <div className="px-4 md:px-8 pt-6 pb-2 flex flex-col gap-3 max-w-lg">
      <p className="text-xs font-medium" style={{ color: COLOR.muted }}>
        Personaliza tu tienda
      </p>
      <ImageUploadField
        label="Foto de portada"
        imageUrl={bannerImageUrl}
        uploading={uploadingField === "banner"}
        error={uploadError.banner}
        onUpload={(e) => handleUpload("banner", e)}
        onRemove={() => setBannerImageUrl("")}
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
          Nombre de la tienda
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
          Descripción
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
        />
      </div>
      <div>
        <label className="text-xs" style={{ color: COLOR.muted }}>
          Color de acento
        </label>
        <AccentPicker value={accentValue} onChange={setAccentValue} />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={uploadingField !== null}
          className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: accent, color: COLOR.negro }}
        >
          Guardar cambios
        </button>
        <button onClick={onCancel} className="rounded-full px-4 py-2 text-sm" style={{ color: COLOR.muted }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista principal de la tienda: portada con parallax, identidad, estadísticas,
// pestañas fijas, ofertas, catálogo con búsqueda y reseñas. Esto es TODO lo
// que ve un comprador en la portada — cuando el usuario es dueño, además ve
// controles para personalizar su perfil y gestionar su catálogo aquí mismo.
// ---------------------------------------------------------------------------
function Blob({ color, className, delay = 0 }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={{ backgroundColor: color, opacity: 0.22 }}
      animate={{ x: [0, 40, -20, 0], y: [0, -24, 18, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function StatPill({ value, label, delay }) {
  const accent = useAccent();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      className="flex items-baseline gap-1.5 rounded-2xl px-4 py-2.5"
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <span className="text-xl font-bold leading-none" style={{ color: accent }}>
        <CountUp value={value} />
      </span>
      <span className="text-xs" style={{ color: COLOR.muted }}>
        {label}
      </span>
    </motion.div>
  );
}

function StoreHome({ store, isOwner, accent, userId, onOpenProduct, onAskQuestion, onSaveProfile, onAddProduct, onEditProduct, onDeleteProduct }) {
  const [activeSection, setActiveSection] = useState("productos");
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postConfirmation, setPostConfirmation] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 500], [0, 120]);
  const bannerScale = useTransform(scrollY, [0, 500], [1.04, 1.16]);
  const heroContentOpacity = useTransform(scrollY, [0, 260], [1, 0.4]);

  const q = query.trim().toLowerCase();
  const matches = (p) => !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
  const offers = store.products.filter((p) => p.isOffer && matches(p));
  const catalog = store.products.filter((p) => !p.isOffer && matches(p));
  const totalOffers = store.products.filter((p) => p.isOffer).length;

  const handleSaveProfile = (patch) => {
    onSaveProfile(patch);
    setIsEditingProfile(false);
  };

  const handlePostCreated = () => {
    setIsCreatingPost(false);
    setPostConfirmation(true);
    setTimeout(() => setPostConfirmation(false), 3000);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia el enlace de la tienda:", window.location.href);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto w-full pb-6">
      {!store.verified && (
        <div
          className="mx-4 md:mx-8 mt-4 flex items-start gap-2.5 rounded-2xl p-3.5"
          style={{ backgroundColor: "rgba(245,194,66,0.08)", border: "1px solid rgba(245,194,66,0.3)" }}
        >
          <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: "#F5C242" }} />
          <p className="text-xs leading-relaxed" style={{ color: COLOR.hueso }}>
            {isOwner ? (
              <>
                Tu tienda aún no está verificada: no puedes publicar ni recibir pedidos.{" "}
                <Link to="/verificacion" className="font-semibold underline" style={{ color: "#F5C242" }}>
                  Ver el estado de mi verificación
                </Link>
              </>
            ) : (
              "Esta tienda está en proceso de verificación de identidad. Todavía no se pueden hacer compras en ella."
            )}
          </p>
        </div>
      )}

      {/* PORTADA con parallax */}
      <div className="relative h-56 md:h-80 overflow-hidden rounded-b-3xl md:rounded-3xl md:mt-5 md:mx-8" style={{ backgroundColor: store.bannerColor }}>
        {store.bannerImageUrl ? (
          <motion.img src={store.bannerImageUrl} alt="" style={{ y: bannerY, scale: bannerScale }} className="absolute inset-0 w-full h-full object-cover will-change-transform" />
        ) : (
          <>
            <Blob color={accent} className="w-72 h-72 -top-20 -left-10" />
            <Blob color={accent} className="w-96 h-96 -bottom-40 right-0" delay={3} />
          </>
        )}
        <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 85% 0%, ${accent}33, transparent 55%)` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,10,9,0.92) 0%, rgba(11,10,9,0.15) 55%, transparent 100%)" }} />
        <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

        {isOwner && !isEditingProfile && (
          <motion.div style={{ opacity: heroContentOpacity }} className="absolute right-3 top-3 md:right-6 md:top-6 flex items-center gap-2 z-10">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (store.verified ? setIsCreatingPost(true) : navigate("/verificacion"))}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 backdrop-blur-md"
              style={{ backgroundColor: accent, color: COLOR.negro, opacity: store.verified ? 1 : 0.6 }}
              title={store.verified ? undefined : "Verifica tu identidad para publicar"}
            >
              <Film size={13} />
              <span className="text-xs font-semibold">Nueva publicación</span>
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 backdrop-blur-md"
              style={{ backgroundColor: "rgba(11,10,9,0.55)", border: `1px solid ${COLOR.border}` }}
            >
              <Pencil size={13} style={{ color: COLOR.hueso }} />
              <span className="text-xs font-medium" style={{ color: COLOR.hueso }}>
                Editar perfil
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {isEditingProfile ? (
        <ProfileEditor store={store} accent={accent} onSave={handleSaveProfile} onCancel={() => setIsEditingProfile(false)} />
      ) : (
        <div className="px-4 md:px-12 -mt-14 md:-mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={SPRING_BOUNCY}
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-full shrink-0"
            >
              <span className="absolute inset-0 rounded-full nexo-glow-pulse" style={{ boxShadow: `0 0 0 3px ${accent}` }} />
              <div
                className="relative w-full h-full rounded-full flex items-center justify-center font-bold text-3xl md:text-4xl overflow-hidden"
                style={{ backgroundColor: accent, border: `5px solid ${COLOR.negro}`, color: COLOR.negro }}
              >
                {store.avatarUrl ? <img src={store.avatarUrl} alt="" className="w-full h-full object-cover" /> : store.initials}
              </div>
            </motion.div>

            <div className="flex-1 min-w-0 md:pb-2">
              <Reveal delay={0.1} y={12}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tight" style={{ color: COLOR.hueso }}>
                    {store.name}
                  </h1>
                  {store.verified && (
                    <motion.span
                      initial={{ scale: 0, rotate: -40 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ ...SPRING_BOUNCY, delay: 0.45 }}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1"
                      style={{ backgroundColor: `${accent}1f`, border: `1px solid ${accent}55` }}
                    >
                      <BadgeCheck size={14} style={{ color: accent }} />
                      <span className="text-[11px] font-semibold" style={{ color: accent }}>
                        Verificada
                      </span>
                    </motion.span>
                  )}
                </div>
                {store.description && (
                  <p className="text-sm md:text-[15px] mt-2 leading-relaxed md:max-w-2xl" style={{ color: COLOR.muted }}>
                    {store.description}
                  </p>
                )}
              </Reveal>
            </div>

            <Reveal delay={0.2} y={12} className="md:pb-3">
              {isOwner ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/ventas/${store.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold nexo-glow"
                    style={{ backgroundColor: accent, color: COLOR.negro }}
                  >
                    <Banknote size={15} />
                    Ver mis ventas
                  </Link>
                  <Link to="/panel" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium" style={{ border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}>
                    <LayoutDashboard size={15} />
                    Panel
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onAskQuestion}
                    className="nexo-glow flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold"
                    style={{ backgroundColor: accent, color: COLOR.negro }}
                  >
                    <MessageCircleQuestion size={16} />
                    Preguntar
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={share}
                    className="h-10 rounded-full px-3.5 flex items-center gap-1.5 text-xs font-medium"
                    style={{ border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
                    aria-label="Copiar enlace de la tienda"
                  >
                    {copied ? <Check size={15} style={{ color: accent }} /> : <Share2 size={15} />}
                    <span className="hidden sm:inline">{copied ? "Copiado" : "Compartir"}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setReportTarget({ type: "store", id: store.id })}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ border: `1px solid ${COLOR.border}` }}
                    aria-label="Reportar tienda"
                  >
                    <Flag size={15} style={{ color: COLOR.muted }} />
                  </motion.button>
                </div>
              )}
            </Reveal>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <StatPill value={store.products.length} label="productos" delay={0.25} />
            <StatPill value={totalOffers} label="en oferta" delay={0.31} />
            <StatPill value={store.reviews.length} label="reseñas" delay={0.37} />
          </div>
        </div>
      )}

      <div className="mt-6">
        <SectionTabs active={activeSection} onChange={setActiveSection} counts={{ productos: store.products.length, resenas: store.reviews.length }} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {activeSection === "productos" && (
          <motion.div key="productos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="px-4 md:px-8 pt-5">
              <div
                className="flex items-center gap-2.5 rounded-full px-4 py-2.5 max-w-md transition-colors focus-within:border-[var(--accent)]"
                style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, "--accent": accent }}
              >
                <Search size={15} style={{ color: COLOR.muted }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Buscar en ${store.name}`}
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: COLOR.hueso }}
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
                    <X size={14} style={{ color: COLOR.muted }} />
                  </button>
                )}
              </div>
            </div>

            {offers.length > 0 && (
              <div className="px-4 md:px-8 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}22` }}>
                    <Flame size={15} style={{ color: accent }} />
                  </span>
                  <p className="text-base md:text-lg font-bold" style={{ color: COLOR.hueso }}>
                    Ofertas
                  </p>
                </div>
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x" style={{ scrollbarWidth: "none" }}>
                  {offers.map((p, i) => (
                    <div key={p.id} className="snap-start shrink-0">
                      <ProductCard product={p} onOpen={onOpenProduct} size="small" isOwner={isOwner} onEdit={onEditProduct} onDelete={onDeleteProduct} index={i} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 md:px-8 pt-6">
              {(catalog.length > 0 || offers.length > 0) && !q && offers.length > 0 && (
                <p className="text-base md:text-lg font-bold mb-3" style={{ color: COLOR.hueso }}>
                  Todo el catálogo
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                {catalog.map((p, i) => (
                  <ProductCard key={p.id} product={p} onOpen={onOpenProduct} isOwner={isOwner} onEdit={onEditProduct} onDelete={onDeleteProduct} index={i} />
                ))}
                {isOwner && !q && <AddProductTile onClick={onAddProduct} />}
              </div>
              {catalog.length === 0 && offers.length === 0 && (
                <div className="text-center py-14">
                  <Package size={30} className="mx-auto mb-3" style={{ color: COLOR.muted }} />
                  <p className="text-sm" style={{ color: COLOR.muted }}>
                    {q ? `No encontramos productos para “${query.trim()}”.` : "Esta tienda aún no tiene productos."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSection === "resenas" && (
          <motion.div key="resenas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="px-4 md:px-8 pt-5">
            {store.reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {store.reviews.map((r, i) => (
                  <ReviewCard key={r.id} review={r} index={i} productName={store.products.find((p) => p.id === r.productId)?.name} />
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <Sparkles size={30} className="mx-auto mb-3" style={{ color: COLOR.muted }} />
                <p className="text-sm" style={{ color: COLOR.muted }}>
                  Todavía no hay publicaciones de compradores sobre esta tienda.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isOwner && (
        <p className="text-[11px] text-center mt-8" style={{ color: COLOR.muted }}>
          Esta es la vista pública de tu tienda.
        </p>
      )}

      {isCreatingPost && (
        <PostCreateModal
          storeId={store.id}
          authorId={userId}
          accent={accent}
          products={store.products}
          onCreated={handlePostCreated}
          onClose={() => setIsCreatingPost(false)}
        />
      )}

      {reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />}

      <AnimatePresence>
        {postConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={SPRING}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 text-sm font-semibold"
            style={{ backgroundColor: accent, color: COLOR.negro, boxShadow: `0 10px 30px ${accent}55` }}
          >
            Publicado ✓ — ya aparece en el Feed
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detalle de producto: nombre, descripción, opciones (solo si existen),
// reseñas de ESE producto, y botón para preguntar por él puntualmente.
// ---------------------------------------------------------------------------
// Ventana flotante (no ocupa toda la pantalla): nombre, descripción,
// opciones (solo si existen), reseñas de ESE producto, y botón para
// preguntar por él puntualmente — salvo que seas tú mismo el vendedor.
function ProductDetail({ product, reviews, accent, onBack, onAskQuestion, isOwner, onEditProduct, storeVerified = true }) {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [customizationNote, setCustomizationNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState("");
  const [extraReviews, setExtraReviews] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [sendingReview, setSendingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reporting, setReporting] = useState(false);
  const productReviews = [...reviews.filter((r) => r.productId === product.id), ...extraReviews];
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    reviewsApi
      .fetchReviewEligibility(userId, product.id)
      .then((e) => !cancelled && setEligibility({ key: `${userId}:${product.id}`, ...e }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId, product.id]);

  const canReview = Boolean(eligibility && eligibility.key === `${userId}:${product.id}` && eligibility.purchased && !eligibility.reviewed);

  const submitReview = async () => {
    const text = reviewText.trim();
    if (!text || !userId) return;
    setReviewError("");
    setSendingReview(true);
    try {
      await reviewsApi.addReview(product.id, userId, text);
      setExtraReviews((prev) => [...prev, { id: `new-${Date.now()}`, productId: product.id, buyer: user.name, initials: user.initials, quote: text }]);
      setEligibility((prev) => (prev ? { ...prev, reviewed: true } : prev));
      setReviewText("");
    } catch {
      setReviewError("No se pudo publicar tu reseña. Inténtalo de nuevo.");
    } finally {
      setSendingReview(false);
    }
  };
  const hasOptions = product.options && Object.keys(product.options).length > 0;

  // Si el comprador ya eligió un valor para CADA opción, buscamos si esa
  // combinación exacta tiene un precio propio (ej. Talla=XL más cara).
  const optionGroupNames = hasOptions ? Object.keys(product.options) : [];
  const allOptionsSelected = optionGroupNames.length > 0 && optionGroupNames.every((g) => selectedOptions[g]);
  const matchedVariant =
    allOptionsSelected && product.variants?.length
      ? product.variants.find((v) => optionGroupNames.every((g) => v.optionValues[g] === selectedOptions[g]))
      : null;
  const displayPrice = matchedVariant?.price ?? product.price;

  // Si el valor elegido en alguna opción tiene su propia foto (ej. Color:
  // Rojo), la mostramos en vez de la foto principal del producto.
  let optionImageUrl;
  for (const group of optionGroupNames) {
    const value = selectedOptions[group];
    const url = value && product.optionImages?.[`${group}:${value}`];
    if (url) {
      optionImageUrl = url;
      break;
    }
  }
  const displayImageUrl = optionImageUrl || product.imageUrl;
  const outOfStock = product.stock === 0;
  const effectiveQuantity = Math.max(1, Math.min(quantity, product.stock));
  const canAddToCart = (!hasOptions || allOptionsSelected) && !outOfStock && storeVerified;

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/ingresar");
      return;
    }
    setCartError("");
    setAdding(true);
    try {
      await cartApi.addToCart({
        buyerId: user.id,
        productId: product.id,
        quantity: effectiveQuantity,
        selectedOptions: hasOptions ? selectedOptions : undefined,
        customizationNote: product.isCustomizable ? customizationNote.trim() : undefined,
      });
      await cart.refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setCartError("No se pudo agregar al carrito. Intenta de nuevo.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="nexo-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onBack}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nexo-modal w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
      >
        <div
          className="relative w-full flex items-center justify-center shrink-0"
          style={{ height: 280, backgroundColor: COLOR.surface }}
        >
          {displayImageUrl && (
            <img src={displayImageUrl} alt={product.name} className="w-full h-full object-contain" />
          )}
          <button
            onClick={onBack}
            className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(11,10,9,0.65)" }}
          >
            <X size={16} style={{ color: COLOR.hueso }} />
          </button>
          {!isOwner && (
            <button
              onClick={() => setReporting(true)}
              className="absolute left-3 top-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(11,10,9,0.65)" }}
              aria-label="Reportar producto"
            >
              <Flag size={14} style={{ color: COLOR.hueso }} />
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => onEditProduct(product)}
              className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-3 py-1.5"
              style={{ backgroundColor: "rgba(11,10,9,0.65)" }}
            >
              <Pencil size={12} style={{ color: COLOR.hueso }} />
              <span className="text-[11px]" style={{ color: COLOR.hueso }}>
                Editar
              </span>
            </button>
          )}
        </div>

        <div className="px-4 pt-4">
          <h2 className="text-lg font-semibold" style={{ color: COLOR.hueso }}>
            {product.name}
          </h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-semibold" style={{ color: accent }}>
              {displayPrice}
            </span>
            {!matchedVariant && product.originalPrice && (
              <span className="text-xs line-through" style={{ color: COLOR.muted }}>
                {product.originalPrice}
              </span>
            )}
          </div>
          {hasOptions && product.variants?.length > 0 && !allOptionsSelected && (
            <p className="text-[11px] mt-1" style={{ color: COLOR.muted }}>
              Elige {optionGroupNames.join(" y ")} para confirmar el precio final.
            </p>
          )}
          <p
            className="text-xs font-medium mt-1.5"
            style={{ color: product.stock === 0 ? "#FF8A65" : product.stock <= 5 ? "#FF8A65" : accent }}
          >
            {product.stock === 0 ? "Agotado" : product.stock <= 5 ? `¡Últimas ${product.stock} unidades!` : `${product.stock} disponibles`}
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: COLOR.muted }}>
            {product.description}
          </p>
        </div>

        {hasOptions && (
          <div className="px-4 pt-4">
            {Object.entries(product.options).map(([groupName, values]) => (
              <div key={groupName} className="mb-3">
                <p className="text-xs font-medium mb-1.5" style={{ color: COLOR.hueso }}>
                  {groupName}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {values.map((v) => {
                    const selected = selectedOptions[groupName] === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [groupName]: v }))}
                        className="rounded-full px-3 py-1.5 text-xs"
                        style={
                          selected
                            ? { backgroundColor: accent, color: COLOR.negro, fontWeight: 600 }
                            : { border: `1px solid ${COLOR.border}`, color: COLOR.hueso }
                        }
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isOwner && product.isCustomizable && (
          <div className="px-4 pt-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: COLOR.hueso }}>
              {product.customizationLabel || "Nota de personalización"}
            </label>
            <textarea
              rows={2}
              value={customizationNote}
              onChange={(e) => setCustomizationNote(e.target.value)}
              placeholder="Escribe aquí lo que quieres personalizar..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>
        )}

        {!isOwner && (
          <div className="px-4 pt-4 flex flex-col gap-2.5">
            {hasOptions && !allOptionsSelected && (
              <p className="text-[11px]" style={{ color: "#FF8A65" }}>
                Elige {optionGroupNames.join(" y ")} antes de agregar al carrito.
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: COLOR.muted }}>
                Cantidad
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${COLOR.border}` }}
                >
                  <Minus size={12} style={{ color: COLOR.hueso }} />
                </button>
                <span className="text-sm w-4 text-center" style={{ color: COLOR.hueso }}>
                  {effectiveQuantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={effectiveQuantity >= product.stock}
                  className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                  style={{ border: `1px solid ${COLOR.border}` }}
                >
                  <Plus size={12} style={{ color: COLOR.hueso }} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || adding}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: accent, color: COLOR.negro }}
              >
                <ShoppingCart size={15} />
                {!storeVerified ? "Tienda en verificación" : outOfStock ? "Agotado" : added ? "Agregado ✓" : adding ? "Agregando..." : "Agregar al carrito"}
              </button>
              <button
                onClick={onAskQuestion}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium border"
                style={{ borderColor: accent, color: accent }}
              >
                <MessageCircleQuestion size={15} />
                Preguntar
              </button>
            </div>
            {cartError && (
              <p className="text-[11px]" style={{ color: "#FF8A65" }}>
                {cartError}
              </p>
            )}
          </div>
        )}

        <div className="px-4 pt-5 pb-6">
          <p className="text-sm font-medium mb-2" style={{ color: COLOR.hueso }}>
            Reseñas de este producto
          </p>
          {canReview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 mb-3"
              style={{ backgroundColor: COLOR.surface, border: "1px solid rgba(200,255,77,0.25)" }}
            >
              <p className="text-[11px] mb-2" style={{ color: COLOR.muted }}>
                Compraste este producto — cuéntanos qué tal
              </p>
              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={400}
                placeholder="Escribe tu reseña..."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
              />
              {reviewError && (
                <p className="text-[11px] mt-1" style={{ color: "#FF8A65" }}>
                  {reviewError}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={submitReview}
                disabled={!reviewText.trim() || sendingReview}
                className="w-full rounded-full py-2 text-sm font-semibold mt-2 disabled:opacity-50"
                style={{ backgroundColor: accent, color: COLOR.negro }}
              >
                {sendingReview ? "Publicando..." : "Publicar reseña"}
              </motion.button>
            </motion.div>
          )}
          {productReviews.length > 0 ? (
            <div className="flex flex-col gap-2">
              {productReviews.map((r) => (
                <div key={r.id} className="rounded-xl p-3" style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                      style={{ backgroundColor: accent, color: COLOR.negro }}
                    >
                      {r.initials}
                    </div>
                    <span className="text-[10px]" style={{ color: COLOR.muted }}>
                      {r.buyer}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: COLOR.hueso }}>
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: COLOR.muted }}>
              Todavía no hay reseñas para este producto.
            </p>
          )}
        </div>
      </div>
      {reporting && <ReportModal target={{ type: "product", id: product.id }} onClose={() => setReporting(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function StorePage() {
  const { storeSlug, productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const [accent, setAccent] = useState(PRESET_ACCENTS[0].value);
  const [editingProduct, setEditingProduct] = useState(null); // null closed, {} new, product = edit
  const [productPendingDelete, setProductPendingDelete] = useState(null);

  const loading = loadedSlug !== storeSlug;
  const isOwner = Boolean(user && store && user.id === store.ownerId);

  useEffect(() => {
    let cancelled = false;
    storesApi.fetchStoreBySlug(storeSlug).then((data) => {
      if (cancelled) return;
      setStore(data);
      setAccent(data ? PRESET_ACCENTS.find((a) => a.id === data.accentId)?.value ?? PRESET_ACCENTS[0].value : PRESET_ACCENTS[0].value);
      setLoadedSlug(storeSlug);
    });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const storeId = store?.id;
  useEffect(() => {
    if (!storeId) return;
    return storesApi.subscribeToStoreStock(storeId, (productId, stock) => {
      setStore((prev) =>
        prev ? { ...prev, products: prev.products.map((p) => (p.id === productId ? { ...p, stock } : p)) } : prev
      );
    });
  }, [storeId]);

  if (loading) return null;

  if (!store) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <p className="text-sm" style={{ color: COLOR.muted }}>
          Esta tienda no existe o fue movida.
        </p>
      </div>
    );
  }

  const selectedProduct = productId ? store.products.find((p) => String(p.id) === productId) : null;

  const handleOpenProduct = (product) => navigate(`/tienda/${store.slug}/producto/${product.id}`);
  const handleBack = () => navigate(`/tienda/${store.slug}`);

  const handleAskQuestion = async () => {
    if (!user) {
      navigate("/ingresar");
      return;
    }
    const conversationId = await chatApi.getOrCreateConversation(user.id, store.id);
    navigate(`/chats/${conversationId}`);
  };

  const handleSaveProfile = async ({ accentValue, ...patch }) => {
    if (accentValue) setAccent(accentValue);
    setStore((prev) => ({ ...prev, ...patch }));
    await storesApi.updateStoreProfile(store.id, patch);
  };

  const confirmDeleteProduct = async () => {
    const product = productPendingDelete;
    setProductPendingDelete(null);
    setStore((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== product.id) }));
    await storesApi.deleteProduct(product.id);
  };

  const handleSaveProduct = async (data) => {
    if (editingProduct && editingProduct.id) {
      const updated = await storesApi.updateProduct(editingProduct.id, data);
      setStore((prev) => ({ ...prev, products: prev.products.map((p) => (p.id === updated.id ? updated : p)) }));
    } else {
      const created = await storesApi.addProduct(store.id, data);
      setStore((prev) => ({ ...prev, products: [...prev.products, created] }));
    }
    setEditingProduct(null);
  };

  return (
    <AccentContext.Provider value={accent}>
      <StoreHome
        store={store}
        isOwner={isOwner}
        accent={accent}
        userId={user?.id}
        onOpenProduct={handleOpenProduct}
        onAskQuestion={handleAskQuestion}
        onSaveProfile={handleSaveProfile}
        onAddProduct={() => setEditingProduct({})}
        onEditProduct={setEditingProduct}
        onDeleteProduct={setProductPendingDelete}
      />

      {selectedProduct && (
        <ProductDetail
          storeVerified={store.verified}
          product={selectedProduct}
          reviews={store.reviews}
          accent={accent}
          onBack={handleBack}
          onAskQuestion={handleAskQuestion}
          isOwner={isOwner}
          onEditProduct={setEditingProduct}
        />
      )}

      {editingProduct && (
        <ProductEditModal
          product={editingProduct.id ? editingProduct : null}
          accent={accent}
          storeId={store.id}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {productPendingDelete && (
        <div
          className="nexo-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setProductPendingDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="nexo-modal w-full max-w-xs rounded-2xl p-5"
            style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
          >
            <p className="text-sm" style={{ color: COLOR.hueso }}>
              ¿Eliminar &ldquo;{productPendingDelete.name}&rdquo; de tu catálogo?
            </p>
            <p className="text-xs mt-1" style={{ color: COLOR.muted }}>
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 rounded-full py-2 text-sm font-medium"
                style={{ backgroundColor: "#FF8A65", color: COLOR.negro }}
              >
                Eliminar
              </button>
              <button
                onClick={() => setProductPendingDelete(null)}
                className="flex-1 rounded-full py-2 text-sm"
                style={{ border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AccentContext.Provider>
  );
}