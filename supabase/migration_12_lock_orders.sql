-- Nexo — duodécima migración: cerrar la puerta a pedidos "falsos".
--
-- ⚠️ CORRER SOLO DESPUÉS de publicar la versión nueva de la web (la que usa
-- create_order) y de que la app móvil también la use. Si se corre antes, la
-- web antigua deja de poder confirmar pedidos.
--
-- Hoy cualquier usuario podría insertar filas directamente en orders /
-- order_groups / order_items (saltándose create_order: sin descontar stock y
-- con precios inventados). Quitando estas políticas, la ÚNICA forma de crear
-- un pedido es la función create_order() del servidor.

drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "order_groups_insert_buyer" on public.order_groups;
drop policy if exists "order_items_insert_buyer" on public.order_items;
