-- Prueba temporal 2: compara directo contra el ID real de NeroShop, sin
-- pasar por la tabla stores. Si esto funciona, el problema está en el cruce
-- con auth.uid()/stores. Si falla igual, el problema es cómo se arma la ruta
-- del archivo desde la app.
drop policy if exists "product_images_owner_write" on storage.objects;

create policy "product_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = '79806159-f544-4e55-bf91-9fd0c041ab09'
  );
