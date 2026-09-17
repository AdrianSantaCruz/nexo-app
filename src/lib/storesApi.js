import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Capa de acceso a datos para tiendas/productos/reseñas. Traduce entre las
// columnas de Postgres (snake_case, precios numéricos) y la forma que ya
// usan los componentes de UI (camelCase, precios como "S/ 29").
// ---------------------------------------------------------------------------

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "T";
}

function formatPrice(value) {
  const num = Number(value);
  return `S/ ${Number.isInteger(num) ? num : num.toFixed(2)}`;
}

function parsePrice(value) {
  const num = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

function mapVariant(row) {
  return {
    id: row.id,
    optionValues: row.option_values,
    price: formatPrice(row.price),
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: formatPrice(row.price),
    originalPrice: row.original_price != null ? formatPrice(row.original_price) : undefined,
    isOffer: row.is_offer,
    color: row.color,
    imageUrl: row.image_url ?? undefined,
    description: row.description ?? "",
    options: row.options ?? undefined,
    optionImages: row.option_images ?? undefined,
    isCustomizable: row.is_customizable,
    customizationLabel: row.customization_label ?? undefined,
    variants: (row.product_variants ?? []).map(mapVariant),
  };
}

function mapReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    buyer: row.profiles?.name ?? "Comprador",
    initials: row.profiles?.initials ?? "U",
    quote: row.quote,
  };
}

function mapStore(row) {
  const products = row.products ?? [];
  return {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description ?? "",
    initials: row.initials,
    verified: row.verified,
    accentId: row.accent_id,
    bannerColor: row.banner_color,
    avatarUrl: row.avatar_url ?? undefined,
    bannerImageUrl: row.banner_image_url ?? undefined,
    products: products.map(mapProduct),
    reviews: products.flatMap((p) => (p.reviews ?? []).map(mapReview)),
  };
}

export async function fetchStoreBySlug(slug) {
  const { data, error } = await supabase
    .from("stores")
    .select("*, products(*, reviews(*, profiles(name, initials)), product_variants(*))")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStore(data) : null;
}

export async function isSlugAvailable(slug) {
  const { data, error } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return !data;
}

export async function createStore({ ownerId, name, description, slug }) {
  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_id: ownerId,
      slug,
      name,
      description,
      initials: initialsFromName(name),
    })
    .select()
    .single();
  if (error) throw error;
  return mapStore({ ...data, products: [] });
}

export async function updateStoreProfile(storeId, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.bannerColor !== undefined) payload.banner_color = patch.bannerColor;
  if (patch.accentId !== undefined) payload.accent_id = patch.accentId;
  if (patch.avatarUrl !== undefined) payload.avatar_url = patch.avatarUrl || null;
  if (patch.bannerImageUrl !== undefined) payload.banner_image_url = patch.bannerImageUrl || null;
  const { error } = await supabase.from("stores").update(payload).eq("id", storeId);
  if (error) throw error;
}

function productPayload(product) {
  return {
    name: product.name,
    price: parsePrice(product.price),
    original_price: product.originalPrice ? parsePrice(product.originalPrice) : null,
    is_offer: Boolean(product.isOffer),
    color: product.color,
    image_url: product.imageUrl || null,
    description: product.description ?? "",
    options: product.options && Object.keys(product.options).length > 0 ? product.options : null,
    option_images: product.optionImages && Object.keys(product.optionImages).length > 0 ? product.optionImages : null,
    is_customizable: Boolean(product.isCustomizable),
    customization_label: product.isCustomizable ? product.customizationLabel || null : null,
  };
}

// Reemplaza por completo las variantes con precio propio de un producto.
// Se guardan solo las combinaciones que el vendedor personalizó (precio
// distinto al precio base) — las demás combinaciones usan el precio base.
export async function saveProductVariants(productId, variants) {
  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (!variants || variants.length === 0) return [];
  const { data, error } = await supabase
    .from("product_variants")
    .insert(variants.map((v) => ({ product_id: productId, option_values: v.optionValues, price: parsePrice(v.price) })))
    .select();
  if (error) throw error;
  return data.map(mapVariant);
}

export async function addProduct(storeId, product) {
  const { data, error } = await supabase
    .from("products")
    .insert({ store_id: storeId, ...productPayload(product) })
    .select()
    .single();
  if (error) throw error;
  const variants = await saveProductVariants(data.id, product.variants);
  return { ...mapProduct(data), variants };
}

export async function updateProduct(productId, patch) {
  const { data, error } = await supabase
    .from("products")
    .update(productPayload(patch))
    .eq("id", productId)
    .select()
    .single();
  if (error) throw error;
  const variants = await saveProductVariants(productId, patch.variants);
  return { ...mapProduct(data), variants };
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

function randomFileName(ext) {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}.${ext}`;
}

// Sube la foto de un producto al bucket "product-images" (bajo la carpeta
// de la tienda dueña, para que las políticas de Storage puedan validar
// quién puede subir/borrar) y devuelve su URL pública.
export async function uploadProductImage(storeId, file) {
  const ext = file.name.split(".").pop();
  const path = `${storeId}/${randomFileName(ext)}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

// Sube la foto de perfil o de portada de la tienda al bucket "store-images".
// `kind` es solo para que el nombre de archivo sea legible ("avatar"/"banner").
export async function uploadStoreImage(storeId, kind, file) {
  const ext = file.name.split(".").pop();
  const path = `${storeId}/${kind}-${randomFileName(ext)}`;
  const { error } = await supabase.storage.from("store-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("store-images").getPublicUrl(path);
  return data.publicUrl;
}
