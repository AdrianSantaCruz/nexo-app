-- Nexo — séptima migración: publicaciones reales (foto o video) en el feed.
--
-- La tabla `posts` ya existía desde el esquema inicial pero nunca se usó —
-- el feed leía directo de productos y reseñas. Ahora la activamos de
-- verdad: una tienda puede publicar una foto o un video con un texto, y
-- aparece en el Feed junto con los productos y reseñas.

alter table public.posts drop column if exists image_color;

alter table public.posts
  add column if not exists media_url text,
  add column if not exists media_type text not null default 'image' check (media_type in ('image', 'video'));

-- Bucket de Storage para las fotos/videos de las publicaciones.
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "post_media_public_read" on storage.objects
  for select using (bucket_id = 'post-media');

-- Nota: se usa "objects.name" (no "name" a secas) porque public.stores
-- también tiene una columna "name" — sin el prefijo, Postgres la confunde
-- con esa en vez de la ruta del archivo (ver migration_03 para el detalle).
create policy "post_media_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'post-media'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "post_media_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'post-media'
    and exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(objects.name))[1]
    )
  );
