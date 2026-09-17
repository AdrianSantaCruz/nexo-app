-- Corrección definitiva: especifica "objects.name" (la ruta del archivo)
-- en vez de "name" a secas, para que no se confunda con stores.name (el
-- nombre de la tienda).
drop policy if exists "product_images_owner_write" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

create policy "product_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "product_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(objects.name))[1]
    )
  );
