import { supabase } from "./supabaseClient";

function formatPrice(value) {
  const num = Number(value);
  return `S/ ${Number.isInteger(num) ? num : num.toFixed(2)}`;
}

// Busca tiendas y productos reales por nombre (case-insensitive, coincidencia
// parcial). Se usa desde el buscador del sidebar y la página /buscar.
export async function search(query) {
  const q = query.trim();
  if (!q) return { stores: [], products: [] };

  const [{ data: stores, error: storesError }, { data: products, error: productsError }] = await Promise.all([
    supabase.from("stores").select("id, slug, name, description, initials, avatar_url").ilike("name", `%${q}%`).limit(20),
    supabase
      .from("products")
      .select("id, name, price, image_url, stores(name, slug)")
      .ilike("name", `%${q}%`)
      .limit(30),
  ]);

  if (storesError) throw storesError;
  if (productsError) throw productsError;

  return {
    stores: (stores ?? []).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      initials: s.initials,
      avatarUrl: s.avatar_url ?? undefined,
    })),
    products: (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: formatPrice(p.price),
      imageUrl: p.image_url ?? undefined,
      storeSlug: p.stores?.slug,
      storeName: p.stores?.name,
    })),
  };
}
