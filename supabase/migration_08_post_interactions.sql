-- Nexo — octava migración: likes y comentarios reales en publicaciones, y
-- productos etiquetados (para poder comprarlos directo desde el video/foto).

-- Los contadores estáticos nunca se actualizaban solos; a partir de ahora
-- se calculan de verdad a partir de post_likes / post_comments.
alter table public.posts drop column if exists likes;
alter table public.posts drop column if exists comments;

-- ============================================================
-- LIKES
-- ============================================================
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "post_likes_select_all" on public.post_likes
  for select using (true);

create policy "post_likes_insert_own" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "post_likes_delete_own" on public.post_likes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- COMENTARIOS
-- ============================================================
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "post_comments_select_all" on public.post_comments
  for select using (true);

create policy "post_comments_insert_own" on public.post_comments
  for insert with check (auth.uid() = author_id);

create policy "post_comments_delete_own" on public.post_comments
  for delete using (auth.uid() = author_id);

-- ============================================================
-- PRODUCTOS ETIQUETADOS EN UNA PUBLICACIÓN
-- (ej: video con un outfit → etiquetas cada prenda que se ve puesta)
-- ============================================================
create table public.post_products (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, product_id)
);

alter table public.post_products enable row level security;

create policy "post_products_select_all" on public.post_products
  for select using (true);

create policy "post_products_all_store_owner" on public.post_products
  for all
  using (
    exists (
      select 1 from public.posts p
      join public.stores s on s.id = p.store_id
      where p.id = post_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      join public.stores s on s.id = p.store_id
      where p.id = post_id and s.owner_id = auth.uid()
    )
  );
