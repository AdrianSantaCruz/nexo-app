-- Nexo — cuarta migración: foto de perfil y portada reales para la tienda.

alter table public.stores
  add column if not exists avatar_url text,
  add column if not exists banner_image_url text;

-- Bucket separado para las imágenes de marca de la tienda (foto de perfil y
-- portada), distinto del de productos, con el mismo esquema de carpetas por
-- tienda (bucket/<store_id>/...).
insert into storage.buckets (id, name, public)
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

create policy "store_images_public_read" on storage.objects
  for select using (bucket_id = 'store-images');

-- Nota: se usa "objects.name" (no "name" a secas) porque public.stores
-- también tiene una columna "name" (el nombre de la tienda) — sin el
-- prefijo, Postgres la confunde con esa en vez de la ruta del archivo.
create policy "store_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'store-images'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "store_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'store-images'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(objects.name))[1]
    )
  );
