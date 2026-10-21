-- Nexo — migración 14: arregla "infinite recursion detected in policy for
-- relation orders" al leer pedidos.
--
-- Causa: la política de lectura de `orders` consultaba `order_groups`, y la de
-- `order_groups` consultaba `orders`: un círculo. Postgres lo detecta y
-- rechaza CUALQUIER lectura de esas tablas (por eso "Mis pedidos", "Ventas"
-- y las reseñas verificadas fallaban, aunque los pedidos sí se guardaban).
--
-- Solución: la pregunta "¿soy dueño de alguna tienda de este pedido?" se
-- responde con una función de servidor que no vuelve a pasar por las
-- políticas, y así se rompe el círculo.

create or replace function public.is_order_store_owner(p_order uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_groups og
    join public.stores s on s.id = og.store_id
    where og.order_id = p_order and s.owner_id = auth.uid()
  );
$$;

revoke all on function public.is_order_store_owner(uuid) from public;
grant execute on function public.is_order_store_owner(uuid) to anon, authenticated;

drop policy if exists "orders_select_involved" on public.orders;

create policy "orders_select_involved" on public.orders
  for select using (
    auth.uid() = buyer_id
    or public.is_order_store_owner(id)
  );
