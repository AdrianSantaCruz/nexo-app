-- Nexo — cómo revisar a los vendedores (se corre en el SQL Editor de Supabase).
--
-- 1) Ver quién está esperando revisión:
select
  v.id,
  s.name as tienda,
  v.legal_name as nombre_o_razon_social,
  v.doc_type as documento,
  v.doc_number as numero,
  v.created_at,
  v.owner_id,
  v.doc_front_path as foto_frente,
  v.doc_back_path as foto_reverso
from public.seller_verifications v
join public.stores s on s.id = v.store_id
where v.status = 'pendiente'
order by v.created_at;

-- 2) Ver la foto del documento: Supabase → Storage → bucket "seller-docs" →
--    carpeta con el valor de owner_id → archivo indicado en foto_frente.
--    Compara el nombre y el número de la foto con los datos escritos.
--    (Para un RUC conviene además consultar el número en la página de SUNAT.)

-- 3) APROBAR (cambia el id por el de la fila a aprobar):
-- update public.seller_verifications
-- set status = 'verificado', reviewed_at = now(), reject_reason = null
-- where id = 'PEGA-AQUI-EL-ID';

-- 4) RECHAZAR con el motivo que verá el vendedor:
-- update public.seller_verifications
-- set status = 'rechazado', reviewed_at = now(), reject_reason = 'La foto no se lee bien. Sube una foto más clara.'
-- where id = 'PEGA-AQUI-EL-ID';
