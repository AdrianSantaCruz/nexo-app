-- Verifica y repara las políticas de Storage para las fotos de producto.
-- Seguro de correr varias veces (borra y vuelve a crear cada política).

-- 1) Confirma que el bucket existe (si no aparece nada, avísame).
select id, name, public from storage.buckets where id = 'product-images';

-- 2) Recrea las políticas desde cero, sin importar si ya existían.
drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_owner_write" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );

create policy "product_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );

-- 3) Confirma que las 3 políticas quedaron creadas.
select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'product_images%';
