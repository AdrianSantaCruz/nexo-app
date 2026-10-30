import { supabase } from "./supabaseClient";

// Puntos de recojo: lockers de Nexo en lugares céntricos de Arequipa
// (supabase/migration_15_pickup_lockers.sql).

export const DELIVERY_LABEL = { locker: "Recojo en locker", coordinar: "A coordinar con la tienda" };

function mapPoint(row) {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    address: row.address,
    hours: row.hours,
  };
}

export async function fetchPickupPoints() {
  const { data, error } = await supabase.from("pickup_points").select("id, name, district, address, hours").eq("active", true).order("name");
  if (error) throw error;
  return (data ?? []).map(mapPoint);
}

// El comprador confirma que recogió su pedido del locker (pasa a "entregado").
export async function confirmPickup(groupId) {
  const { error } = await supabase.rpc("confirm_pickup", { p_group: groupId });
  if (error) throw error;
}
