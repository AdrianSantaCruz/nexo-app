-- Nexo — migración 17: NUEVAS TARIFAS (corre después de la migración 16).
--
--   • Comisión a los vendedores: 8 % sobre cada venta (antes 10 %).
--   • Comisión por compra segura al comprador: S/ 1.90 por pedido, que se suma
--     al total que paga (no depende de cuántas tiendas haya en el pedido).
--
-- Las dos tarifas viven en la tabla app_settings (seller_commission_rate y
-- buyer_fee), así que se pueden cambiar con una línea de SQL sin tocar el
-- código. El pedido guarda la comisión que se cobró en ese momento
-- (orders.buyer_fee), por lo que los pedidos anteriores no cambian: quedan en
-- 0 y conservan el 10 % que ya se calculó.

alter table public.orders
  add column if not exists buyer_fee numeric(10,2) not null default 0;

insert into public.app_settings (key, value) values
  ('seller_commission_rate', '0.08'),
  ('buyer_fee', '1.90')
on conflict (key) do update set value = excluded.value;

-- ============================================================
-- create_order(): usa las tarifas de app_settings
-- ============================================================
create or replace function public.create_order(p_delivery text default 'coordinar', p_pickup_point uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric;
  v_fee numeric(10,2);
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

  -- Tarifas de Nexo (se cambian en app_settings, sin tocar el código).
  select coalesce((select value::numeric from public.app_settings where key = 'seller_commission_rate'), 0.08) into v_rate;
  select coalesce((select value::numeric from public.app_settings where key = 'buyer_fee'), 1.90) into v_fee;

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

  insert into public.orders (buyer_id, status, total_amount, delivery_method, pickup_point_id, buyer_fee)
  values (v_buyer, 'pendiente', 0, p_delivery, p_pickup_point, v_fee)
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

    v_commission := round(v_subtotal * v_rate, 2);

    update public.order_groups
    set subtotal = v_subtotal, commission_amount = v_commission, payout_amount = v_subtotal - v_commission
    where id = v_group_id;

    v_total := v_total + v_subtotal;
  end loop;

  update public.orders set total_amount = v_total + v_fee where id = v_order_id;

  delete from public.cart_items where buyer_id = v_buyer;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text, uuid) from public, anon;
grant execute on function public.create_order(text, uuid) to authenticated;
