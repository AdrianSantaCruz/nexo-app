import { supabase } from "./supabaseClient";

export const REPORT_REASONS = [
  "Contenido inapropiado",
  "Spam o engaño",
  "Producto prohibido o falsificado",
  "Acoso o lenguaje ofensivo",
  "Otro",
];

// targetType: post | comment | profile | store | product | review
export async function reportContent({ reporterId, targetType, targetId, reason, details }) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details?.trim() || null,
  });
  if (error) throw error;
}

// Borra la cuenta y sus datos (ver delete_my_account en migration_11).
export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  await supabase.auth.signOut();
}
