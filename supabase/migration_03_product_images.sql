-- Nexo — tercera migración: imágenes reales de producto.
-- Corre esto DESPUÉS de migration_02_orders.sql.

-- Columna para guardar la URL de la foto del producto (el color sigue
-- existiendo como respaldo visual cuando el vendedor no sube foto).
alter table public.products
  add column if not exists image_url text;

-- Bucket de Storage donde se guardan las fotos de producto. Público para
-- lectura (cualquiera puede VER las fotos de un producto publicado).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Solo el dueño de la tienda puede subir/borrar fotos dentro de la carpeta
-- de SU tienda (la app sube cada foto a "product-images/<id-de-tienda>/...").
-- Nota: se usa "objects.name" (no "name" a secas) porque public.stores
-- también tiene una columna "name" (el nombre de la tienda) — sin el
-- prefijo, Postgres la confunde con esa en vez de la ruta del archivo.
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
