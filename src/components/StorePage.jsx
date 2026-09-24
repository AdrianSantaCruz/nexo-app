import { useState, useEffect, createContext, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BadgeCheck, Pencil, X, MessageCircleQuestion, ShoppingCart, Minus, Plus, Trash2, ImagePlus, Check, Tag, Film } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import * as storesApi from "../lib/storesApi";
import * as chatApi from "../lib/chatApi";
import * as cartApi from "../lib/cartApi";
import ProductEditModal from "./ProductEditModal";
import PostCreateModal from "./PostCreateModal";

// ---------------------------------------------------------------------------
// Paleta de marca (Nexo — Nero Labs): el negro es fijo (identidad de la app).
// El color de acento SÍ lo elige cada tienda.
// ---------------------------------------------------------------------------
const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
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

function SectionTabs({ active, onChange }) {
  const accent = useAccent();
  const tabs = [
    { id: "productos", label: "Productos" },
    { id: "resenas", label: "Reseñas" },
  ];
  return (
    <div className="flex gap-2 px-4 md:px-8 pt-4 pb-1">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="rounded-full px-4 py-1.5 text-xs font-medium"
            style={
              isActive
                ? { backgroundColor: accent, color: COLOR.negro }
                : { backgroundColor: "transparent", color: COLOR.hueso, border: `1px solid ${COLOR.border}` }
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({ product, onOpen, size = "normal", isOwner, onEdit, onDelete }) {
  const accent = useAccent();
  const isSmall = size === "small";
  return (
    <div
      className={`relative rounded-xl overflow-hidden text-left ${isSmall ? "shrink-0 w-28 md:w-36" : "w-full"}`}
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      {isOwner && (
        <div className="absolute top-1.5 right-1.5 z-10 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(20,17,15,0.75)" }}
          >
            <Pencil size={11} style={{ color: COLOR.hueso }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product);
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(20,17,15,0.75)" }}
          >
            <Trash2 size={11} style={{ color: "#FF8A65" }} />
          </button>
        </div>
      )}
      <button onClick={() => onOpen(product)} className="w-full text-left">
        <div className="relative" style={{ height: isSmall ? 80 : 100, backgroundColor: product.color }}>
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          )}
          {product.isOffer && (
            <div
              className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: accent }}
            >
              <Tag size={9} style={{ color: COLOR.negro }} />
              <span className="text-[9px] font-semibold" style={{ color: COLOR.negro }}>
                Oferta
              </span>
            </div>
          )}
        </div>
        <div className="px-2.5 py-2">
          <p className="text-[11px] leading-tight" style={{ color: COLOR.hueso }}>
            {product.name}
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-xs font-semibold" style={{ color: accent }}>
              {product.price}
            </p>
            {product.originalPrice && (
              <p className="text-[10px] line-through" style={{ color: COLOR.muted }}>
                {product.originalPrice}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

function AddProductTile({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl flex flex-col items-center justify-center gap-1.5 py-6"
      style={{ backgroundColor: "transparent", border: `1px dashed ${COLOR.border}`, minHeight: 148 }}
    >
      <Plus size={18} style={{ color: COLOR.muted }} />
      <span className="text-[11px]" style={{ color: COLOR.muted }}>
        Agregar producto
      </span>
    </button>
  );
}

function ReviewCard({ review, productName, fullWidth = false }) {
  const accent = useAccent();
  return (
    <div
      className={fullWidth ? "rounded-xl p-3" : "shrink-0 w-44 rounded-xl p-3"}
      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
          style={{ backgroundColor: accent, color: COLOR.negro }}
        >
          {review.initials}
        </div>
        <span className="text-[10px]" style={{ color: COLOR.muted }}>
          {review.buyer}
        </span>
      </div>
      <p className="text-xs mb-1.5" style={{ color: COLOR.hueso }}>
        &ldquo;{review.quote}&rdquo;
      </p>
      {productName && (
        <p className="text-[10px]" style={{ color: accent }}>
          sobre {productName}
        </p>
      )}
    </div>
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
    <div className="px-4 md:px-8 pt-10 md:pt-14 pb-2 flex flex-col gap-3 max-w-lg">
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
// Vista principal de la tienda: banner, nombre, descripción, ofertas,
// catálogo y reseñas. Esto es TODO lo que ve un comprador en la portada —
// cuando el usuario es dueño, además ve controles para personalizar su
// perfil y gestionar su catálogo directamente aquí.
// ---------------------------------------------------------------------------
function StoreHome({ store, isOwner, accent, userId, onOpenProduct, onAskQuestion, onSaveProfile, onAddProduct, onEditProduct, onDeleteProduct }) {
  const [activeSection, setActiveSection] = useState("productos");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postConfirmation, setPostConfirmation] = useState(false);
  const offers = store.products.filter((p) => p.isOffer);
  const catalog = store.products.filter((p) => !p.isOffer);

  const handleSaveProfile = (patch) => {
    onSaveProfile(patch);
    setIsEditingProfile(false);
  };

  const handlePostCreated = () => {
    setIsCreatingPost(false);
    setPostConfirmation(true);
    setTimeout(() => setPostConfirmation(false), 3000);
  };

  return (
    <div className="max-w-[1800px] mx-auto w-full">
      <div
        className="h-32 md:h-64 relative rounded-b-2xl md:rounded-2xl md:mt-6"
        style={{ backgroundColor: store.bannerColor, borderBottom: `2px solid ${accent}` }}
      >
        {store.bannerImageUrl && (
          <div className="absolute inset-0 overflow-hidden rounded-b-2xl md:rounded-2xl">
            <img src={store.bannerImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {isOwner && !isEditingProfile && (
          <div className="absolute right-3 top-3 md:right-6 md:top-6 flex items-center gap-2 z-10">
            <button
              onClick={() => setIsCreatingPost(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2"
              style={{ backgroundColor: accent, color: COLOR.negro }}
            >
              <Film size={12} />
              <span className="text-[11px] font-medium">Nueva publicación</span>
            </button>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <Pencil size={12} style={{ color: accent }} />
              <span className="text-[11px]" style={{ color: accent }}>
                Editar perfil
              </span>
            </button>
          </div>
        )}
        <div
          className="absolute left-4 md:left-8 -bottom-7 md:-bottom-10 w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center font-semibold text-lg md:text-2xl overflow-hidden z-10"
          style={{ backgroundColor: accent, border: `3px solid ${COLOR.negro}`, color: COLOR.negro }}
        >
          {store.avatarUrl ? (
            <img src={store.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            store.initials
          )}
        </div>
      </div>

      {isEditingProfile ? (
        <ProfileEditor store={store} accent={accent} onSave={handleSaveProfile} onCancel={() => setIsEditingProfile(false)} />
      ) : (
        <div className="pt-10 md:pt-14 px-4 md:px-8 pb-1">
          <div className="flex items-center gap-1.5 md:gap-2">
            <h1 className="text-lg md:text-2xl font-semibold" style={{ color: COLOR.hueso }}>
              {store.name}
            </h1>
            {store.verified && <BadgeCheck size={16} className="md:w-5 md:h-5" style={{ color: accent }} />}
          </div>
          <p className="text-xs md:text-sm mt-1 md:mt-2 leading-snug md:max-w-xl" style={{ color: COLOR.muted }}>
            {store.description}
          </p>
        </div>
      )}

      <SectionTabs active={activeSection} onChange={setActiveSection} />

      {activeSection === "productos" && (
        <>
          {offers.length > 0 && (
            <div className="px-4 md:px-8 pt-3">
              <p className="text-sm md:text-base font-medium mb-2" style={{ color: COLOR.hueso }}>
                Ofertas
              </p>
              <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                {offers.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpen={onOpenProduct}
                    size="small"
                    isOwner={isOwner}
                    onEdit={onEditProduct}
                    onDelete={onDeleteProduct}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="px-4 md:px-8 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 md:gap-3">
              {catalog.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={onOpenProduct} isOwner={isOwner} onEdit={onEditProduct} onDelete={onDeleteProduct} />
              ))}
              {isOwner && <AddProductTile onClick={onAddProduct} />}
            </div>
          </div>
        </>
      )}

      {activeSection === "resenas" && (
        <div className="px-4 md:px-8 pt-3">
          {store.reviews.length > 0 ? (
            <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {store.reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  productName={store.products.find((p) => p.id === r.productId)?.name}
                  fullWidth
                />
              ))}
            </div>
          ) : (
            <p className="text-xs py-6 text-center" style={{ color: COLOR.muted }}>
              Todavía no hay publicaciones de compradores sobre esta tienda.
            </p>
          )}
        </div>
      )}

      <div className="px-4 md:px-8 pt-5 pb-6 md:max-w-sm">
        {isOwner ? (
          <p className="text-[11px] text-center" style={{ color: COLOR.muted }}>
            Esta es la vista pública de tu tienda.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <button className="flex-1 rounded-full py-2.5 text-sm font-medium" style={{ backgroundColor: accent, color: COLOR.negro }}>
              Seguir
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
        )}
      </div>

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

      {postConfirmation && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2.5 text-sm font-medium"
          style={{ backgroundColor: accent, color: COLOR.negro }}
        >
          Publicado ✓ — ya aparece en el Feed
        </div>
      )}
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
function ProductDetail({ product, reviews, accent, onBack, onAskQuestion, isOwner, onEditProduct }) {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [customizationNote, setCustomizationNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState("");
  const productReviews = reviews.filter((r) => r.productId === product.id);
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
  const canAddToCart = !hasOptions || allOptionsSelected;

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
        quantity,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onBack}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
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
            style={{ backgroundColor: "rgba(20,17,15,0.65)" }}
          >
            <X size={16} style={{ color: COLOR.hueso }} />
          </button>
          {isOwner && (
            <button
              onClick={() => onEditProduct(product)}
              className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-3 py-1.5"
              style={{ backgroundColor: "rgba(20,17,15,0.65)" }}
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
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
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
                {added ? "Agregado ✓" : adding ? "Agregando..." : "Agregar al carrito"}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setProductPendingDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl p-5"
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