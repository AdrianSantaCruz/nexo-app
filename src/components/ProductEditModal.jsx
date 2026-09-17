import { useState } from "react";
import { X, ImagePlus, Plus, Trash2 } from "lucide-react";
import { uploadProductImage } from "../lib/storesApi";

const COLOR = {
  negro: "#14110F",
  surface: "#1C1815",
  border: "#2A2622",
  hueso: "#FBF6EF",
  muted: "#8A8378",
};

const numericValue = (price) => price?.replace(/[^\d.]/g, "") ?? "";

// Convierte { Talla: ["S","M","L"], Color: ["Negro","Blanco"] } <-> filas
// editables [{ name: "Talla", valuesText: "S, M, L" }, ...] para el editor.
function optionsToRows(options) {
  if (!options) return [];
  return Object.entries(options).map(([name, values]) => ({ name, valuesText: values.join(", ") }));
}

function rowsToOptions(rows) {
  const options = {};
  for (const row of rows) {
    const name = row.name.trim();
    const values = row.valuesText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (name && values.length > 0) options[name] = values;
  }
  return options;
}

// Genera todas las combinaciones posibles a partir de { Talla:["S","M"], Color:["Negro"] }
// -> [{Talla:"S",Color:"Negro"}, {Talla:"M",Color:"Negro"}]
function generateCombinations(options) {
  const groups = Object.entries(options);
  if (groups.length === 0) return [];
  return groups.reduce((acc, [name, values]) => acc.flatMap((combo) => values.map((v) => ({ ...combo, [name]: v }))), [{}]);
}

const comboKey = (combo) => JSON.stringify(combo);
const comboLabel = (combo) => Object.values(combo).join(" / ");
const optionValueKey = (group, value) => `${group}:${value}`;

function variantsToPriceMap(variants) {
  const map = {};
  for (const v of variants ?? []) map[comboKey(v.optionValues)] = numericValue(v.price);
  return map;
}

// Lista cada valor de cada grupo por separado — ej. { Color: ["Rojo","Azul"] }
// -> [{ group: "Color", value: "Rojo" }, { group: "Color", value: "Azul" }].
// Es distinto de generateCombinations: aquí es UN valor a la vez (para poder
// asignarle una foto), no la combinación completa (que es para el precio).
function flattenOptionValues(options) {
  return Object.entries(options).flatMap(([group, values]) => values.map((value) => ({ group, value })));
}

// Modal de alta/edición de producto para el panel de vendedor: foto real
// (Supabase Storage), precio/oferta, opciones elegibles (tallas, colores,
// etc.) y si el producto admite una nota de personalización. `onSave`
// recibe el objeto producto listo para escribirse en Supabase (ver
// src/lib/storesApi.js).
export default function ProductEditModal({ product, accent, storeId, onSave, onClose }) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(numericValue(product?.price));
  const [isOffer, setIsOffer] = useState(Boolean(product?.isOffer));
  const [originalPrice, setOriginalPrice] = useState(numericValue(product?.originalPrice));
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const [optionRows, setOptionRows] = useState(optionsToRows(product?.options));
  const [isCustomizable, setIsCustomizable] = useState(Boolean(product?.isCustomizable));
  const [customizationLabel, setCustomizationLabel] = useState(product?.customizationLabel ?? "");
  const [variantPrices, setVariantPrices] = useState(() => variantsToPriceMap(product?.variants));
  const [optionImages, setOptionImages] = useState(product?.optionImages ?? {});
  const [uploadingOptionKey, setUploadingOptionKey] = useState(null);
  const [optionImageErrors, setOptionImageErrors] = useState({});

  const options = rowsToOptions(optionRows);
  const combos = generateCombinations(options);
  const optionValues = flattenOptionValues(options);
  const updateVariantPrice = (combo, value) => setVariantPrices((prev) => ({ ...prev, [comboKey(combo)]: value }));

  const handleOptionImageChange = async (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptionImageErrors((prev) => ({ ...prev, [key]: "" }));
    setUploadingOptionKey(key);
    try {
      const url = await uploadProductImage(storeId, file);
      setOptionImages((prev) => ({ ...prev, [key]: url }));
    } catch (err) {
      setOptionImageErrors((prev) => ({ ...prev, [key]: err?.message || "No se pudo subir la imagen." }));
    } finally {
      setUploadingOptionKey(null);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const url = await uploadProductImage(storeId, file);
      setImageUrl(url);
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      setUploadError(err?.message ? `No se pudo subir la imagen: ${err.message}` : "No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const addOptionRow = () => setOptionRows((prev) => [...prev, { name: "", valuesText: "" }]);
  const updateOptionRow = (i, patch) => setOptionRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeOptionRow = (i) => setOptionRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || !price.trim()) return;
    if (!imageUrl) {
      setFormError("Sube una foto del producto antes de guardar.");
      return;
    }
    const variants = combos
      .map((combo) => {
        const raw = variantPrices[comboKey(combo)];
        return raw && raw.trim() ? { optionValues: combo, price: `S/ ${raw.trim()}` } : null;
      })
      .filter(Boolean);

    const cleanedOptionImages = {};
    for (const { group, value } of optionValues) {
      const key = optionValueKey(group, value);
      if (optionImages[key]) cleanedOptionImages[key] = optionImages[key];
    }

    onSave({
      name: name.trim(),
      price: `S/ ${price.trim()}`,
      originalPrice: isOffer && originalPrice.trim() ? `S/ ${originalPrice.trim()}` : undefined,
      isOffer,
      description: description.trim(),
      color: "#1C1815",
      imageUrl,
      options,
      optionImages: cleanedOptionImages,
      isCustomizable,
      customizationLabel: isCustomizable ? customizationLabel.trim() : undefined,
      variants,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLOR.negro, border: `1px solid ${COLOR.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: COLOR.hueso }}>
            {product ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button type="button" onClick={onClose}>
            <X size={16} style={{ color: COLOR.muted }} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Foto del producto
            </label>
            <label
              className="mt-1 flex items-center justify-center rounded-lg cursor-pointer overflow-hidden"
              style={{ height: 120, backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <ImagePlus size={20} style={{ color: COLOR.muted }} />
                  <span className="text-[11px]" style={{ color: COLOR.muted }}>
                    {uploading ? "Subiendo..." : "Subir foto"}
                  </span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
            </label>
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl("")} className="text-[11px] mt-1" style={{ color: COLOR.muted }}>
                Quitar foto
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
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Precio (S/)
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>

          <label className="flex items-center gap-2 text-xs" style={{ color: COLOR.hueso }}>
            <input type="checkbox" checked={isOffer} onChange={(e) => setIsOffer(e.target.checked)} />
            Marcar como oferta
          </label>

          {isOffer && (
            <div>
              <label className="text-xs" style={{ color: COLOR.muted }}>
                Precio original (S/)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
              />
            </div>
          )}

          <div>
            <label className="text-xs" style={{ color: COLOR.muted }}>
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: COLOR.muted }}>
                Opciones (talla, color, etc.)
              </label>
              <button type="button" onClick={addOptionRow} className="flex items-center gap-1 text-[11px]" style={{ color: accent }}>
                <Plus size={12} />
                Agregar
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-1.5">
              {optionRows.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Ej: Talla"
                    value={row.name}
                    onChange={(e) => updateOptionRow(i, { name: e.target.value })}
                    className="w-24 shrink-0 rounded-lg px-2.5 py-2 text-xs outline-none"
                    style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
                  />
                  <input
                    type="text"
                    placeholder="S, M, L, XL"
                    value={row.valuesText}
                    onChange={(e) => updateOptionRow(i, { valuesText: e.target.value })}
                    className="flex-1 min-w-0 rounded-lg px-2.5 py-2 text-xs outline-none"
                    style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
                  />
                  <button type="button" onClick={() => removeOptionRow(i)} className="shrink-0">
                    <Trash2 size={14} style={{ color: "#FF8A65" }} />
                  </button>
                </div>
              ))}
              {optionRows.length === 0 && (
                <p className="text-[11px]" style={{ color: COLOR.muted }}>
                  Sin opciones — el producto se vende tal cual.
                </p>
              )}
            </div>
          </div>

          {optionValues.length > 0 && (
            <div>
              <label className="text-xs" style={{ color: COLOR.muted }}>
                Foto por opción (opcional)
              </label>
              <p className="text-[11px] mt-0.5 mb-1.5" style={{ color: COLOR.muted }}>
                Ej: una foto para "Rojo" y otra para "Azul" — se muestra según lo que elija el comprador.
              </p>
              <div className="flex flex-col gap-1.5">
                {optionValues.map(({ group, value }) => {
                  const key = optionValueKey(group, value);
                  const url = optionImages[key];
                  const uploading = uploadingOptionKey === key;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <label
                        className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                        style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}` }}
                      >
                        {url ? (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus size={14} style={{ color: COLOR.muted }} />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleOptionImageChange(key, e)}
                        />
                      </label>
                      <span className="text-xs flex-1" style={{ color: COLOR.hueso }}>
                        {group}: {value} {uploading && "— subiendo..."}
                      </span>
                      {url && (
                        <button
                          type="button"
                          onClick={() => setOptionImages((prev) => ({ ...prev, [key]: "" }))}
                          className="text-[11px] shrink-0"
                          style={{ color: COLOR.muted }}
                        >
                          Quitar
                        </button>
                      )}
                      {optionImageErrors[key] && (
                        <p className="text-[10px]" style={{ color: "#FF8A65" }}>
                          {optionImageErrors[key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {combos.length > 0 && (
            <div>
              <label className="text-xs" style={{ color: COLOR.muted }}>
                Precio por variante (opcional)
              </label>
              <p className="text-[11px] mt-0.5 mb-1.5" style={{ color: COLOR.muted }}>
                Deja vacío para usar el precio base (S/ {price || "0"}). Llena solo las que cuesten distinto.
              </p>
              <div className="flex flex-col gap-1.5">
                {combos.map((combo) => (
                  <div key={comboKey(combo)} className="flex items-center gap-1.5">
                    <span className="w-24 shrink-0 text-xs truncate" style={{ color: COLOR.hueso }}>
                      {comboLabel(combo)}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={price || "0"}
                      value={variantPrices[comboKey(combo)] ?? ""}
                      onChange={(e) => updateVariantPrice(combo, e.target.value)}
                      className="flex-1 min-w-0 rounded-lg px-2.5 py-2 text-xs outline-none"
                      style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1" style={{ borderTop: `1px solid ${COLOR.border}` }}>
            <label className="flex items-center gap-2 text-xs mt-3" style={{ color: COLOR.hueso }}>
              <input type="checkbox" checked={isCustomizable} onChange={(e) => setIsCustomizable(e.target.checked)} />
              Es personalizable (el comprador escribe una nota, ej. grabado o mensaje)
            </label>
            {isCustomizable && (
              <input
                type="text"
                placeholder="Ej: Mensaje para la tarjeta de regalo"
                value={customizationLabel}
                onChange={(e) => setCustomizationLabel(e.target.value)}
                className="w-full mt-2 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.hueso }}
              />
            )}
          </div>
        </div>

        {formError && (
          <p className="text-xs mt-3" style={{ color: "#FF8A65" }}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-full py-2.5 text-sm font-medium mt-5 disabled:opacity-60"
          style={{ backgroundColor: accent, color: COLOR.negro }}
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
