-- Nexo — esquema inicial de base de datos (Supabase / Postgres)
-- Cómo usar: pega este archivo completo en Supabase → SQL Editor → Run.

-- ============================================================
-- PERFILES (comprador y/o vendedor — extiende auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  initials text not null default '',
  reviewer_score numeric(2,1),
  points integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Crea automáticamente un perfil cuando alguien se registra en Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TIENDAS
-- ============================================================
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text not null default '',
  initials text not null default '',
  verified boolean not null default false,
  accent_id text not null default 'lima',
  banner_color text not null default '#3A2E28',
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;

create policy "stores_select_all" on public.stores
  for select using (true);

create policy "stores_all_owner" on public.stores
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- PRODUCTOS
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  is_offer boolean not null default false,
  color text not null default '#8C6E4F',
  description text not null default '',
  options jsonb,
  is_customizable boolean not null default false,
  customization_label text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_select_all" on public.products
  for select using (true);

create policy "products_all_store_owner" on public.products
  for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

-- ============================================================
-- RESEÑAS
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  quote text not null,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews_select_all" on public.reviews
  for select using (true);

create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = buyer_id);

create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = buyer_id);

create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = buyer_id);

-- ============================================================
-- PUBLICACIONES (Feed / Descubrir): reseñas-post de compradores
-- y ofertas/novedades publicadas por la tienda
-- ============================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('review', 'oferta')),
  store_id uuid not null references public.stores(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  caption text not null,
  image_color text not null default '#8C6E4F',
  likes integer not null default 0,
  comments integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts_select_all" on public.posts
  for select using (true);

create policy "posts_insert_authorized" on public.posts
  for insert
  with check (
    (kind = 'review' and auth.uid() = author_id)
    or (kind = 'oferta' and exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()))
  );

-- ============================================================
-- CHAT comprador-vendedor
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, store_id)
);

alter table public.conversations enable row level security;

create policy "conversations_select_participant" on public.conversations
  for select using (
    auth.uid() = buyer_id
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "conversations_insert_buyer" on public.conversations
  for insert with check (auth.uid() = buyer_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.stores s on s.id = c.store_id
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

create policy "messages_insert_participant" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      join public.stores s on s.id = c.store_id
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

-- Habilita actualizaciones en tiempo real para el chat
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- CARRITO — lo que el comprador va agregando antes de pagar
-- ============================================================
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  selected_options jsonb,
  customization_note text,
  created_at timestamptz not null default now()
);

alter table public.cart_items enable row level security;

create policy "cart_items_all_own" on public.cart_items
  for all using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

-- ============================================================
-- PEDIDOS
--
-- Un `order` es UN pago (una transacción de tarjeta). Como el comprador
-- puede pagar productos de varias tiendas a la vez, cada `order` se divide
-- en un `order_group` por cada tienda involucrada — ahí se calcula cuánto
-- le toca al vendedor y cuánto de comisión se queda Nexo, y cada vendedor
-- gestiona el envío solo de su parte. `order_items` son los productos
-- puntuales dentro de cada sub-pedido, con el precio "congelado" al momento
-- de la compra y la nota de personalización si el producto la admite.
--
-- ⚠️ IMPORTANTE: mientras no exista la integración con la pasarela de pagos
-- (Culqi/Niubiz/MercadoPago), estas filas las crea el propio comprador desde
-- la app al hacer clic en "Pagar" — es una simulación. Antes de lanzar de
-- verdad, la creación de `orders` con status='pagado' debe moverse a una
-- función segura del servidor (Supabase Edge Function) que solo se dispare
-- cuando el banco confirme el cobro. Si no, alguien podría marcar un pedido
-- como pagado sin haber pagado.
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'cancelado', 'fallido')),
  payment_method text,
  payment_reference text,
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_groups (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete restrict,
  subtotal numeric(10,2) not null default 0,
  commission_amount numeric(10,2) not null default 0,
  payout_amount numeric(10,2) not null default 0,
  fulfillment_status text not null default 'pendiente'
    check (fulfillment_status in ('pendiente', 'preparando', 'enviado', 'entregado', 'cancelado')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_group_id uuid not null references public.order_groups(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null default 1 check (quantity > 0),
  selected_options jsonb,
  customization_note text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_groups enable row level security;
alter table public.order_items enable row level security;

create policy "orders_select_involved" on public.orders
  for select using (
    auth.uid() = buyer_id
    or exists (
      select 1 from public.order_groups og
      join public.stores s on s.id = og.store_id
      where og.order_id = orders.id and s.owner_id = auth.uid()
    )
  );

create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = buyer_id);

create policy "order_groups_select_involved" on public.order_groups
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "order_groups_insert_buyer" on public.order_groups
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
  );

create policy "order_groups_update_store_owner" on public.order_groups
  for update using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "order_items_select_involved" on public.order_items
  for select using (
    exists (
      select 1 from public.order_groups og
      join public.orders o on o.id = og.order_id
      where og.id = order_group_id
        and (o.buyer_id = auth.uid() or exists (select 1 from public.stores s where s.id = og.store_id and s.owner_id = auth.uid()))
    )
  );

create policy "order_items_insert_buyer" on public.order_items
  for insert with check (
    exists (
      select 1 from public.order_groups og
      join public.orders o on o.id = og.order_id
      where og.id = order_group_id and o.buyer_id = auth.uid()
    )
  );
