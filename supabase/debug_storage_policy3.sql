-- Prueba temporal 3: valida SOLO que el usuario sea dueño de alguna tienda
-- (sin comparar todavía el ID de la carpeta), para aislar si el problema es
-- el cruce con auth.uid() o la comparación de carpeta.
drop policy if exists "product_images_owner_write" on storage.objects;

create policy "product_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.stores s where s.owner_id = auth.uid())
  );
