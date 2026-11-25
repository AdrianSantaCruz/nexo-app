import { supabase } from "./supabaseClient";

// Puntos de recojo en lugares céntricos de Arequipa. En el código y en la base
// de datos se llaman "locker"; en pantalla siempre «punto de recojo».
// (supabase/migration_15_pickup_lockers.sql).

export const DELIVERY_LABEL = { locker: "Punto de recojo", coordinar: "A coordinar con la tienda" };

// La base de datos (migraciones 15 y 19) aún escribe "locker" en los nombres de
// los puntos y en algunos avisos: se traduce al mostrarlos.
export function textoRecojo(text) {
  return (text ?? "")
    .replace(/Locker Nexo/g, "Punto Nexo")
    .replace(/el locker elegido/g, "el punto elegido")
    .replace(/en el locker/g, "en el punto de recojo");
}

function mapPoint(row) {
  return {
    id: row.id,
    name: textoRecojo(row.name),
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

const WITHDRAW_ERRORS = {
  CODIGO_INVALIDO: "Ese código no corresponde a un pedido con punto de recojo.",
  LOCKER_EQUIVOCADO: "Tu pedido está en otro punto de recojo. Revisa en Mis pedidos cuál elegiste.",
  AUN_NO_EN_LOCKER: "Tu pedido todavía no está en el punto de recojo.",
  YA_RETIRADO: "Este pedido ya fue retirado.",
  LOCKERS_SIMULADOS_DESACTIVADOS: "El simulador de recojo está desactivado.",
};

// SIMULADOR de locker: el comprador digita su código de pedido y el locker
// registra el retiro (el pedido pasa a "entregado"). Con lockers reales lo
// hará el propio locker.
export async function lockerWithdraw(pointId, code) {
  const { error } = await supabase.rpc("locker_withdraw", { p_point: pointId, p_code: code });
  if (error) {
    const key = Object.keys(WITHDRAW_ERRORS).find((k) => error.message?.includes(k));
    throw new Error(key ? WITHDRAW_ERRORS[key] : "No se pudo registrar el retiro. Inténtalo de nuevo.", { cause: error });
  }
}
