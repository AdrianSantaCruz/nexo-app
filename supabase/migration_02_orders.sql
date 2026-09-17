-- Nexo — segunda migración: personalización de productos, carrito y pedidos.
-- Corre esto DESPUÉS de schema.sql (que ya ejecutaste). Solo agrega lo nuevo,
-- no vuelve a crear las tablas que ya tienes.

-- ============================================================
-- Personalización de productos
-- ============================================================
alter table public.products
  add column if not exists is_customizable boolean not null default false,
  add column if not exists customization_label text;

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
