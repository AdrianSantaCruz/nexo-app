import { supabase } from "./supabaseClient";

// Verificación de identidad de quien quiere vender (supabase/migration_18).
// El equipo de Nexo revisa cada solicitud; mientras no se apruebe la tienda no
// puede publicar ni recibir pedidos.

export const DOC_LABEL = { dni: "DNI", ruc: "RUC" };

export const EMPTY_VERIFICATION = { docType: "dni", docNumber: "", legalName: "", front: null, back: null };

export const MAX_DOC_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isValidDni(value) {
  return /^\d{8}$/.test(value);
}

// RUC peruano: 11 dígitos, empieza con 10, 15, 17 o 20 y el último dígito es de control.
export function isValidRuc(value) {
  if (!/^(10|15|17|20)\d{9}$/.test(value)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(value[i]), 0);
  const rest = 11 - (sum % 11);
  const check = rest === 10 ? 0 : rest === 11 ? 1 : rest;
  return check === Number(value[10]);
}

// Devuelve el mensaje de error del formulario, o "" si todo está bien.
export function validateVerification({ docType, docNumber, legalName, front, back }) {
  const number = docNumber.trim();
  if (docType === "dni" && !isValidDni(number)) return "El DNI debe tener 8 dígitos.";
  if (docType === "ruc" && !isValidRuc(number)) return "El RUC no es válido. Revisa que tenga 11 dígitos.";
  if (legalName.trim().length < 3) return docType === "ruc" ? "Escribe la razón social o el nombre del titular." : "Escribe tu nombre completo, como figura en tu DNI.";
  if (!front) return docType === "ruc" ? "Sube una foto del DNI del titular del RUC." : "Sube una foto de tu DNI.";
  for (const file of [front, back]) {
    if (!file) continue;
    if (!ALLOWED_TYPES.includes(file.type)) return "Las fotos deben ser JPG, PNG o WEBP.";
    if (file.size > MAX_DOC_MB * 1024 * 1024) return `Cada foto debe pesar menos de ${MAX_DOC_MB} MB.`;
  }
  return "";
}

function mapVerification(row) {
  return {
    id: row.id,
    storeId: row.store_id,
    docType: row.doc_type,
    docNumber: row.doc_number,
    legalName: row.legal_name,
    status: row.status,
    rejectReason: row.reject_reason ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchMyVerification(ownerId) {
  const { data, error } = await supabase.from("seller_verifications").select("*").eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  return data ? mapVerification(data) : null;
}

async function uploadDoc(ownerId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${ownerId}/${Math.random().toString(36).slice(2)}${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage.from("seller-docs").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

// Sube las fotos (almacenamiento privado) y registra la solicitud como
// "pendiente". Si ya había una rechazada, la reemplaza.
export async function submitVerification({ ownerId, storeId, docType, docNumber, legalName, front, back }) {
  const frontPath = await uploadDoc(ownerId, front);
  const backPath = back ? await uploadDoc(ownerId, back) : null;
  const { error } = await supabase.from("seller_verifications").upsert(
    {
      store_id: storeId,
      owner_id: ownerId,
      doc_type: docType,
      doc_number: docNumber.trim(),
      legal_name: legalName.trim(),
      doc_front_path: frontPath,
      doc_back_path: backPath,
    },
    { onConflict: "store_id" }
  );
  if (error) {
    if (error.code === "23505") {
      const err = new Error("Ese documento ya está registrado en otra tienda.");
      err.code = "DOC_DUPLICADO";
      throw err;
    }
    throw error;
  }
}
