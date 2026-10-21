-- Nexo — décima migración: stock de productos en tiempo real.
--
-- 1) products.stock: unidades disponibles (el vendedor lo edita).
-- 2) Realtime sobre products: todos ven el stock cambiar al instante.
-- 3) create_order(): el pedido se crea en el SERVIDOR, en una sola
--    transacción: descuenta stock de forma atómica (si dos personas
--    compran la última unidad a la vez, solo una gana), calcula los precios
--    desde la base de datos (incluyendo precio por variante, sin confiar en
--    lo que mande el cliente) y vacía el carrito.
--
-- ⚠️ Correr UNA sola vez: el UPDATE de abajo da stock inicial de 20 a los
-- productos que ya existían (para que no aparezcan "Agotado" de golpe).
-- Cada vendedor debe ajustar su stock real desde la edición del producto.

alter table public.products
  add column if not exists stock integer not null default 0 check (stock >= 0);

update public.products set stock = 20 where stock = 0;

alter publication supabase_realtime add table public.products;

-- ============================================================
-- create_order() — crea el pedido del carrito del usuario autenticado.
-- Errores que devuelve (message): NO_AUTH, CARRITO_VACIO, SIN_STOCK:<producto>
-- ============================================================
create or replace function public.create_order()
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

  if not exists (select 1 from public.cart_items where buyer_id = v_buyer) then
    raise exception 'CARRITO_VACIO';
  end if;

  -- Reserva el stock. El UPDATE condicional bloquea la fila del producto, así
  -- que dos compras simultáneas de la última unidad no pueden pasar ambas.
  -- Se ordena por id para bloquear siempre en el mismo orden (evita deadlocks).
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

  insert into public.orders (buyer_id, status, total_amount)
  values (v_buyer, 'pendiente', 0)
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
      -- Precio de la variante exacta elegida (talla/color con precio propio);
      -- si no hay una, se usa el precio base del producto.
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

revoke all on function public.create_order() from public, anon;
grant execute on function public.create_order() to authenticated;

-- Pendiente para más adelante: devolver el stock si un pedido se cancela o
-- su pago falla, y cerrar los INSERT directos a orders/order_groups/
-- order_items (hoy un cliente podría saltarse create_order()).
