-- Nexo — migración 16: CÓDIGO ÚNICO DE PEDIDO (corre ANTES la migración 15).
--
-- Cada parte de un pedido (la de cada tienda) recibe un código único de 6
-- dígitos que SOLO ve el comprador (tabla order_codes, protegida por RLS: la
-- tienda no puede leerlo).
--
--   • Entrega a coordinar con la tienda: el comprador le dice su código al
--     vendedor al recibir el pedido; el vendedor lo digita y recién ahí el
--     pedido pasa a "entregado" (deliver_with_code). Sin el código, la tienda
--     no puede marcar la entrega.
--   • Locker: la tienda deja el pedido ("enviado" = el locker registró el
--     depósito). Cuando el comprador lo retira digita su código en el locker
--     y el locker registra la entrega (locker_withdraw). Mientras no existan
--     los lockers físicos, locker_withdraw se usa desde el simulador de la
--     página /lockers (interruptor app_settings.lockers_mode = 'simulation').
--
-- También reemplaza lo de la migración 15 (locker_codes / confirm_pickup): el
-- código ya no se genera al dejar el pedido en el locker, existe desde que se
-- crea el pedido, y el comprador ya no confirma con un botón.

-- ============================================================
-- Interruptor del simulador de lockers
-- ============================================================
insert into public.app_settings (key, value)
values ('lockers_mode', 'simulation')
on conflict (key) do nothing;

-- ============================================================
-- Códigos
-- ============================================================
create table if not exists public.order_codes (
  order_group_id uuid primary key references public.order_groups(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.order_codes enable row level security;

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

drop policy if exists "order_codes_select_buyer" on public.order_codes;
create policy "order_codes_select_buyer" on public.order_codes
  for select using (public.is_group_buyer(order_group_id));

-- Genera un código de 6 dígitos que no exista todavía.
create or replace function public.gen_order_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v text;
  i int := 0;
begin
  loop
    v := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.order_codes where code = v);
    i := i + 1;
    if i > 50 then
      raise exception 'SIN_CODIGOS';
    end if;
  end loop;
  return v;
end;
$$;

revoke all on function public.gen_order_code() from public, anon, authenticated;

-- Pedidos que ya existían reciben su código.
do $$
declare
  g record;
begin
  for g in
    select og.id
    from public.order_groups og
    where not exists (select 1 from public.order_codes oc where oc.order_group_id = og.id)
  loop
    insert into public.order_codes (order_group_id, code) values (g.id, public.gen_order_code());
  end loop;
end;
$$;

-- Lo de la migración 15 que ya no se usa.
drop function if exists public.confirm_pickup(uuid);
drop table if exists public.locker_codes;

-- ============================================================
-- create_order(): ahora cada parte del pedido nace con su código
-- ============================================================
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

    insert into public.order_codes (order_group_id, code)
    values (v_group_id, public.gen_order_code());

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
-- La tienda cambia el estado de su parte. "entregado" ya NO se puede marcar
-- desde aquí: se hace con el código del comprador (deliver_with_code) o lo
-- registra el locker (locker_withdraw).
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
  if p_status = 'entregado' then
    raise exception 'ENTREGA_CON_CODIGO';
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
  if v_current = 'entregado' then
    raise exception 'YA_ENTREGADO';
  end if;
  if p_status in ('preparando', 'enviado') and v_order_status <> 'pagado' then
    raise exception 'PEDIDO_NO_PAGADO';
  end if;
  if v_delivery = 'locker' and v_current = 'enviado' and p_status <> 'cancelado' then
    raise exception 'YA_EN_LOCKER';
  end if;

  if p_status = 'cancelado' then
    perform public.restock_order_group(p_group);
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
-- Entrega a coordinar: el vendedor digita el código que le da el comprador
-- ============================================================
create or replace function public.deliver_with_code(p_group uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_current text;
  v_order_status text;
  v_delivery text;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  select s.owner_id, og.fulfillment_status, o.status, o.delivery_method, oc.code
  into v_owner, v_current, v_order_status, v_delivery, v_code
  from public.order_groups og
  join public.stores s on s.id = og.store_id
  join public.orders o on o.id = og.order_id
  left join public.order_codes oc on oc.order_group_id = og.id
  where og.id = p_group
  for update of og;

  if v_owner is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_delivery = 'locker' then
    raise exception 'ENTREGA_EN_LOCKER';
  end if;
  if v_order_status <> 'pagado' then
    raise exception 'PEDIDO_NO_PAGADO';
  end if;
  if v_current not in ('preparando', 'enviado') then
    raise exception 'ESTADO_INVALIDO';
  end if;
  if v_code is null or regexp_replace(coalesce(p_code, ''), '\s', '', 'g') <> v_code then
    raise exception 'CODIGO_INCORRECTO';
  end if;

  update public.order_groups set fulfillment_status = 'entregado' where id = p_group;
end;
$$;

revoke all on function public.deliver_with_code(uuid, text) from public, anon;
grant execute on function public.deliver_with_code(uuid, text) to authenticated;

-- ============================================================
-- Locker: el comprador digita su código y el locker registra el retiro.
-- SIMULADOR: hasta que existan los lockers físicos se usa desde /lockers.
-- Con lockers reales esta función la llamará el servidor del locker y se
-- pasa app_settings.lockers_mode a 'live'.
-- ============================================================
create or replace function public.locker_withdraw(p_point uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode text;
  v_group uuid;
  v_status text;
  v_delivery text;
  v_point uuid;
  v_clean text := regexp_replace(coalesce(p_code, ''), '\s', '', 'g');
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  select value into v_mode from public.app_settings where key = 'lockers_mode';
  if v_mode is distinct from 'simulation' then
    raise exception 'LOCKERS_SIMULADOS_DESACTIVADOS';
  end if;

  select og.id, og.fulfillment_status, o.delivery_method, o.pickup_point_id
  into v_group, v_status, v_delivery, v_point
  from public.order_codes oc
  join public.order_groups og on og.id = oc.order_group_id
  join public.orders o on o.id = og.order_id
  where oc.code = v_clean
  for update of og;

  if v_group is null or v_delivery <> 'locker' then
    raise exception 'CODIGO_INVALIDO';
  end if;
  if v_point is distinct from p_point then
    raise exception 'LOCKER_EQUIVOCADO';
  end if;
  if v_status = 'entregado' then
    raise exception 'YA_RETIRADO';
  end if;
  if v_status <> 'enviado' then
    raise exception 'AUN_NO_EN_LOCKER';
  end if;

  update public.order_groups set fulfillment_status = 'entregado' where id = v_group;
end;
$$;

revoke all on function public.locker_withdraw(uuid, text) from public, anon;
grant execute on function public.locker_withdraw(uuid, text) to authenticated;
