-- Nexo — novena migración: perfil social del comprador (foto de perfil,
-- banner, biografía) y seguidores/seguidos entre compradores.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists banner_image_url text,
  add column if not exists bio text not null default '';

-- ============================================================
-- SEGUIDORES — un comprador sigue a otro comprador (como Instagram/TikTok)
-- ============================================================
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "follows_select_all" on public.follows
  for select using (true);

create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- ============================================================
-- BUCKET para foto de perfil y banner del comprador (carpeta por user id)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

create policy "profile_images_public_read" on storage.objects
  for select using (bucket_id = 'profile-images');

-- Se usa "objects.name" (no "name" a secas) por consistencia con el resto
-- de buckets de este proyecto: aunque acá no hay join con otra tabla que
-- tenga columna "name", ya nos mordió antes (ver product-images) y es más
-- seguro calificar siempre la columna explícitamente.
create policy "profile_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(objects.name))[1]
  );

create policy "profile_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(objects.name))[1]
  );
