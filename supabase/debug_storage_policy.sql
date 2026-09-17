-- Prueba temporal: permite subir a cualquier usuario con sesión iniciada,
-- sin validar todavía que sea dueño de la tienda. Es solo para diagnosticar.
drop policy if exists "product_images_owner_write" on storage.objects;

create policy "product_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and auth.uid() is not null
  );
