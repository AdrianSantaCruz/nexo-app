-- Nexo — migración 15: PUNTOS DE RECOJO (LOCKERS) en el centro de Arequipa.
--
-- Qué agrega:
--   1) Tabla pickup_points: los lockers de Nexo (nombre, distrito, dirección,
--      horario). Cualquiera puede verlos; solo se editan desde Supabase.
--   2) El pedido guarda cómo se entrega: 'locker' (recoge en un locker Nexo) o
--      'coordinar' (se acuerda con la tienda por chat, como hasta ahora).
--   3) Código de apertura: cuando la tienda deja el pedido en el locker
--      ("enviado"), el servidor genera un código de 6 dígitos que SOLO ve el
--      comprador (la tienda no puede verlo, así no puede abrir el locker).
--   4) El comprador confirma "Ya recogí mi pedido" y el pedido pasa a
--      "entregado". En pedidos de locker la tienda no puede marcar "entregado".
--   5) create_order() ahora recibe la forma de entrega y el locker elegido.
--      Las apps antiguas que la llaman sin datos siguen funcionando
--      (quedan como 'coordinar').
--
-- IMPORTANTE: las direcciones y horarios de abajo son REFERENCIALES. Cuando se
-- definan los puntos reales, se cambian desde Supabase (Table Editor →
-- pickup_points) sin tocar el código.

-- ============================================================
-- 1) Lockers
-- ============================================================
create table if not exists public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  address text not null,
  hours text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pickup_points enable row level security;

drop policy if exists "pickup_points_select_all" on public.pickup_points;
create policy "pickup_points_select_all" on public.pickup_points
  for select using (true);

insert into public.pickup_points (name, district, address, hours)
select v.name, v.district, v.address, v.hours
from (values
  ('Locker Nexo · Plaza de Armas', 'Cercado', 'Centro Histórico, a una cuadra de la Plaza de Armas (referencial)', 'Todos los días · 7:00 a 22:00 (referencial)'),
  ('Locker Nexo · Mercado San Camilo', 'Cercado', 'Alrededores del Mercado San Camilo (referencial)', 'Todos los días · 7:00 a 22:00 (referencial)'),
  ('Locker Nexo · Selva Alegre', 'Cercado', 'Alrededores del Parque Selva Alegre (referencial)', 'Todos los días · 7:00 a 22:00 (referencial)'),
  ('Locker Nexo · Yanahuara', 'Yanahuara', 'Plaza de Yanahuara, junto al mirador (referencial)', 'Todos los días · 7:00 a 22:00 (referencial)'),
  ('Locker Nexo · Av. Ejército', 'Cayma', 'Zona comercial de la Av. Ejército (referencial)', 'Todos los días · 7:00 a 22:00 (referencial)'),
  ('Locker Nexo · Paucarpata', 'Paucarpata', 'Alrededores del Mall Aventura Plaza (referencial)', 'Todos los días · 7:00 a 22:00 (referencial)')
) as v(name, district, address, hours)
where not exists (select 1 from public.pickup_points);

-- ============================================================
-- 2) El pedido guarda la forma de entrega
-- ============================================================
alter table public.orders
  add column if not exists delivery_method text not null default 'coordinar'
    check (delivery_method in ('coordinar', 'locker')),
  add column if not exists pickup_point_id uuid references public.pickup_points(id);

-- ============================================================
-- 3) Código de apertura (solo lo ve el comprador)
-- ============================================================
create table if not exists public.locker_codes (
  order_group_id uuid primary key references public.order_groups(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now()
);

alter table public.locker_codes enable row level security;

create or replace function public.is_group_buyer(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_groups og
    join public.orders o on o.id = og.order_id
    where og.id = p_group and o.buyer_id = auth.uid()
  );
$$;

revoke all on function public.is_group_buyer(uuid) from public;
grant execute on function public.is_group_buyer(uuid) to authenticated;

drop policy if exists "locker_codes_select_buyer" on public.locker_codes;
create policy "locker_codes_select_buyer" on public.locker_codes
  for select using (public.is_group_buyer(order_group_id));

-- ============================================================
-- 4) create_order(): ahora con forma de entrega y locker
-- ============================================================
drop function if exists public.create_order();

create or replace function public.create_order(p_delivery text default 'coordinar', p_pickup_point uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_commission_rate constant numeric := 0.10;
  v_buyer uuid := auth.uid();
  v_order_id uuid;
  v_group_id uuid;
  v_total numeric(10,2) := 0;
  v_subtotal numeric(10,2);
  v_unit numeric(10,2);
  v_commission numeric(10,2);
  r record;
  s record;
begin
  if v_buyer is null then
    raise exception 'NO_AUTH';
  end if;

  if p_delivery not in ('coordinar', 'locker') then
    raise exception 'ENTREGA_INVALIDA';
  end if;
  if p_delivery = 'locker' then
    if p_pickup_point is null
       or not exists (select 1 from public.pickup_points where id = p_pickup_point and active) then
      raise exception 'LOCKER_INVALIDO';
    end if;
  else
    p_pickup_point := null;
  end if;

  if not exists (select 1 from public.cart_items where buyer_id = v_buyer) then
    raise exception 'CARRITO_VACIO';
  end if;

  -- Reserva el stock (misma lógica de la migración 10).
  for r in
    select p.id, p.name, sum(ci.quantity)::int as qty
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.buyer_id = v_buyer
    group by p.id, p.name
    order by p.id
  loop
    update public.products set stock = stock - r.qty where id = r.id and stock >= r.qty;
    if not found then
      raise exception 'SIN_STOCK:%', r.name;
    end if;
  end loop;

  insert into public.orders (buyer_id, status, total_amount, delivery_method, pickup_point_id)
  values (v_buyer, 'pendiente', 0, p_delivery, p_pickup_point)
  returning id into v_order_id;

  for s in
    select distinct p.store_id
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.buyer_id = v_buyer
  loop
    insert into public.order_groups (order_id, store_id)
    values (v_order_id, s.store_id)
    returning id into v_group_id;

    v_subtotal := 0;

    for r in
      select ci.product_id, ci.quantity, ci.selected_options, ci.customization_note, p.name, p.price
      from public.cart_items ci
      join public.products p on p.id = ci.product_id
      where ci.buyer_id = v_buyer and p.store_id = s.store_id
    loop
      v_unit := null;
      if r.selected_options is not null then
        select pv.price into v_unit
        from public.product_variants pv
        where pv.product_id = r.product_id and pv.option_values = r.selected_options
        limit 1;
      end if;
      v_unit := coalesce(v_unit, r.price);

      insert into public.order_items (order_group_id, product_id, product_name, unit_price, quantity, selected_options, customization_note)
      values (v_group_id, r.product_id, r.name, v_unit, r.quantity, r.selected_options, r.customization_note);

      v_subtotal := v_subtotal + v_unit * r.quantity;
    end loop;

    v_commission := round(v_subtotal * c_commission_rate, 2);

    update public.order_groups
    set subtotal = v_subtotal, commission_amount = v_commission, payout_amount = v_subtotal - v_commission
    where id = v_group_id;

    v_total := v_total + v_subtotal;
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;

  delete from public.cart_items where buyer_id = v_buyer;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text, uuid) from public, anon;
grant execute on function public.create_order(text, uuid) to authenticated;

-- ============================================================
-- 5) La tienda cambia el estado de su parte (con reglas de locker)
--    "enviado" en un pedido de locker = "dejado en el locker": se genera el
--    código de apertura para el comprador. "entregado" solo lo confirma el
--    comprador al recoger.
-- ============================================================
create or replace function public.set_fulfillment_status(p_group uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_current text;
  v_order uuid;
  v_order_status text;
  v_delivery text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;
  if p_status not in ('pendiente', 'preparando', 'enviado', 'entregado', 'cancelado') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  select s.owner_id, og.fulfillment_status, og.order_id, o.status, o.delivery_method
  into v_owner, v_current, v_order, v_order_status, v_delivery
  from public.order_groups og
  join public.stores s on s.id = og.store_id
  join public.orders o on o.id = og.order_id
  where og.id = p_group
  for update of og;

  if v_owner is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_current = 'cancelado' then
    raise exception 'YA_CANCELADO';
  end if;
  if p_status in ('preparando', 'enviado', 'entregado') and v_order_status <> 'pagado' then
    raise exception 'PEDIDO_NO_PAGADO';
  end if;
  if v_delivery = 'locker' and p_status = 'entregado' then
    raise exception 'SOLO_COMPRADOR_CONFIRMA';
  end if;
  if v_delivery = 'locker' and v_current = 'enviado' and p_status <> 'cancelado' then
    raise exception 'YA_EN_LOCKER';
  end if;

  if p_status = 'cancelado' then
    perform public.restock_order_group(p_group);
  end if;

  if v_delivery = 'locker' and p_status = 'enviado' then
    insert into public.locker_codes (order_group_id, code)
    values (p_group, lpad((floor(random() * 1000000))::int::text, 6, '0'))
    on conflict (order_group_id) do nothing;
  end if;

  update public.order_groups set fulfillment_status = p_status where id = p_group;

  if p_status = 'cancelado' then
    perform public.sync_order_status(v_order);
  end if;
end;
$$;

revoke all on function public.set_fulfillment_status(uuid, text) from public, anon;
grant execute on function public.set_fulfillment_status(uuid, text) to authenticated;

-- ============================================================
-- 6) El comprador confirma que recogió su pedido del locker
-- ============================================================
create or replace function public.confirm_pickup(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_current text;
  v_delivery text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  select o.buyer_id, og.fulfillment_status, o.delivery_method
  into v_buyer, v_current, v_delivery
  from public.order_groups og
  join public.orders o on o.id = og.order_id
  where og.id = p_group
  for update of og;

  if v_buyer is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_delivery <> 'locker' then
    raise exception 'NO_ES_LOCKER';
  end if;
  if v_current <> 'enviado' then
    raise exception 'AUN_NO_EN_LOCKER';
  end if;

  update public.order_groups set fulfillment_status = 'entregado' where id = p_group;
end;
$$;

revoke all on function public.confirm_pickup(uuid) from public, anon;
grant execute on function public.confirm_pickup(uuid) to authenticated;
