import { useState } from "react";
import { X, ImagePlus, Video, Check } from "lucide-react";
import * as postsApi from "../lib/postsApi";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

const MAX_VIDEO_MB = 50;

// Modal para que la tienda publique una foto o un video en el Feed — se
// muestra junto a los productos y reseñas reales para cualquier comprador.
// `products`: catálogo de la tienda, para poder etiquetar cuáles se ven en
// la publicación (ej. cada prenda de un outfit) y que el comprador pueda
// comprarlos directo desde ahí.
export default function PostCreateModal({ storeId, authorId, accent, products = [], onCreated, onClose }) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    const isVideo = file.type.startsWith("video/");
    if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setUploadError(`El video no puede pesar más de ${MAX_VIDEO_MB}MB.`);
      return;
    }
    if (!isVideo && !file.type.startsWith("image/")) {
      setUploadError("Sube una foto o un video.");
      return;
    }

    setUploading(true);
    try {
      const { url, mediaType: type } = await postsApi.uploadPostMedia(storeId, file);
      setMediaUrl(url);
      setMediaType(type);
    } catch (err) {
      setUploadError(err?.message ? `No se pudo subir el archivo: ${err.message}` : "No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!mediaUrl) {
      setFormError("Sube una foto o un video antes de publicar.");
      return;
    }
    if (!caption.trim()) {
      setFormError("Escribe un texto para tu publicación.");
      return;
    }
    setPosting(true);
    try {
      await postsApi.createPost({ storeId, authorId, caption: caption.trim(), mediaUrl, mediaType, productIds: selectedProductIds });
      onCreated?.();
    } catch {
      setFormError("No se pudo publicar. Intenta de nuevo.");
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
            Nueva publicación
          </h2>
          <button type="button" onClick={onClose}>
            <X size={16} style={{ color: COLOR.muted }} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Foto o video
            </label>
            <label
              className="mt-1 flex items-center justify-center rounded-lg cursor-pointer overflow-hidden"
              style={{ height: 180, backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
            >
              {mediaUrl ? (
                mediaType === "video" ? (
                  <video src={mediaUrl} className="w-full h-full object-contain" controls muted />
                ) : (
                  <img src={mediaUrl} alt="" className="w-full h-full object-contain" />
                )
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <ImagePlus size={18} style={{ color: COLOR.muted }} />
                    <Video size={18} style={{ color: COLOR.muted }} />
                  </div>
                  <span className="text-[11px]" style={{ color: COLOR.muted }}>
                    {uploading ? "Subiendo..." : `Subir foto o video (máx. ${MAX_VIDEO_MB}MB)`}
                  </span>
                </div>
              )}
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
            {mediaUrl && (
              <button
                type="button"
                onClick={() => {
                  setMediaUrl("");
                  setMediaType(null);
                }}
                className="text-[11px] mt-1"
                style={{ color: COLOR.muted }}
              >
                Quitar
              </button>
            )}
            {uploadError && (
              <p className="text-[11px] mt-1" style={{ color: "#FF8A65" }}>
                {uploadError}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Texto
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej: Nueva colección disponible, mira este detalle..."
              className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>

          {products.length > 0 && (
            <div>
              <label className="text-xs" style={{ color: COLOR.muted }}>
                Etiquetar productos (opcional)
              </label>
              <p className="text-[11px] mb-1.5" style={{ color: COLOR.muted }}>
                Ej: cada prenda del outfit, para que puedan comprarla directo.
              </p>
              <div
                className="flex flex-col gap-1 rounded-lg p-1.5 max-h-40 overflow-y-auto"
                style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
              >
                {products.map((p) => {
                  const selected = selectedProductIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left"
                      style={{ backgroundColor: selected ? "rgba(200,255,77,0.12)" : "transparent" }}
                    >
                      <div className="w-6 h-6 rounded overflow-hidden shrink-0" style={{ backgroundColor: COLOR.negro }}>
                        {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-xs flex-1 truncate" style={{ color: COLOR.hueso }}>
                        {p.name}
                      </span>
                      {selected && <Check size={14} style={{ color: accent }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {formError && (
          <p className="text-xs mt-3" style={{ color: "#FF8A65" }}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || posting}
          className="w-full rounded-full py-2.5 text-sm font-medium mt-5 disabled:opacity-60"
          style={{ backgroundColor: accent, color: COLOR.negro }}
        >
          {posting ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </div>
  );
}
