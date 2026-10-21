-- Nexo — undécima migración: funciones necesarias para salir al mercado.
--
-- 1) Reseñas verificadas: solo puede reseñar quien compró ese producto.
-- 2) Los dueños de tienda pueden borrar sus publicaciones.
-- 3) Reportes de contenido (requisito de Google Play / App Store para
--    contenido generado por usuarios).
-- 4) Gestión de pedidos: el vendedor cambia el estado de su parte del pedido
--    y el comprador puede cancelar mientras siga "pendiente"; al cancelar se
--    DEVUELVE el stock.
-- 5) delete_my_account(): borrar la cuenta desde la app (requisito de Google
--    Play).

-- ============================================================
-- 1) Reseñas solo de compradores del producto
-- ============================================================
drop policy if exists "reviews_insert_own" on public.reviews;

create policy "reviews_insert_buyer_purchased" on public.reviews
  for insert with check (
    auth.uid() = buyer_id
    and exists (
      select 1
      from public.order_items oi
      join public.order_groups og on og.id = oi.order_group_id
      join public.orders o on o.id = og.order_id
      where o.buyer_id = auth.uid() and oi.product_id = reviews.product_id
    )
  );

-- ============================================================
-- 2) Borrar publicaciones propias de la tienda
-- ============================================================
create policy "posts_delete_store_owner" on public.posts
  for delete using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- ============================================================
-- 3) Reportes de contenido
-- ============================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'profile', 'store', 'product', 'review')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'abierto' check (status in ('abierto', 'revisado', 'descartado')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id);

-- ============================================================
-- 4) Estados de pedido (con devolución de stock al cancelar)
-- ============================================================
drop policy if exists "order_groups_update_store_owner" on public.order_groups;

create or replace function public.restock_order_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set stock = p.stock + t.qty
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_group_id = p_group and product_id is not null
    group by product_id
  ) t
  where p.id = t.product_id;
end;
$$;

revoke all on function public.restock_order_group(uuid) from public, anon, authenticated;

-- El vendedor cambia el estado de SU parte del pedido.
create or replace function public.set_fulfillment_status(p_group uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_current text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;
  if p_status not in ('pendiente', 'preparando', 'enviado', 'entregado', 'cancelado') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  select s.owner_id, og.fulfillment_status
  into v_owner, v_current
  from public.order_groups og
  join public.stores s on s.id = og.store_id
  where og.id = p_group
  for update of og;

  if v_owner is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_current = 'cancelado' then
    raise exception 'YA_CANCELADO';
  end if;

  if p_status = 'cancelado' then
    perform public.restock_order_group(p_group);
  end if;

  update public.order_groups set fulfillment_status = p_status where id = p_group;
end;
$$;

-- El comprador cancela su pedido solo mientras siga "pendiente".
create or replace function public.cancel_my_order_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_current text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  select o.buyer_id, og.fulfillment_status
  into v_buyer, v_current
  from public.order_groups og
  join public.orders o on o.id = og.order_id
  where og.id = p_group
  for update of og;

  if v_buyer is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_current <> 'pendiente' then
    raise exception 'NO_CANCELABLE';
  end if;

  perform public.restock_order_group(p_group);
  update public.order_groups set fulfillment_status = 'cancelado' where id = p_group;
end;
$$;

revoke all on function public.set_fulfillment_status(uuid, text) from public, anon;
revoke all on function public.cancel_my_order_group(uuid) from public, anon;
grant execute on function public.set_fulfillment_status(uuid, text) to authenticated;
grant execute on function public.cancel_my_order_group(uuid) to authenticated;

-- ============================================================
-- 5) Borrar mi cuenta
-- Las tiendas sin historial de ventas se eliminan por completo (con sus
-- productos). Las que ya tienen ventas quedan sin dueño, como registro de
-- los pedidos existentes. Chats, reseñas, pedidos propios, carrito, likes y
-- seguidores se borran en cascada con el perfil.
-- ============================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NO_AUTH';
  end if;

  delete from public.stores s
  where s.owner_id = v_uid
    and not exists (select 1 from public.order_groups og where og.store_id = s.id);

  update public.stores set owner_id = null where owner_id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
