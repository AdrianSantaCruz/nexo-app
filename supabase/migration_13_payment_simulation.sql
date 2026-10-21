-- Nexo — migración 13: PAGO SIMULADO.
--
-- Mientras no exista la pasarela real (Culqi / Niubiz), el pago se simula
-- EN EL SERVIDOR: el pedido se crea "pendiente" y la función
-- pay_order_simulated() lo marca "pagado" con una referencia falsa
-- (SIM-XXXXXXXXXX). Así toda la cadena queda registrada de verdad en la base
-- de datos (pedido, pago, estado de cada tienda, stock, comisión) y se puede
-- demostrar sin cobrar dinero real.
--
-- Seguridad: la función SOLO funciona si app_settings.payments_mode =
-- 'simulation'. Al integrar la pasarela real se cambia a 'live' (una línea de
-- SQL) y la simulación deja de poder usarse; el cobro real lo confirmará el
-- servidor de la pasarela, nunca el celular o el navegador.
--
-- También: un vendedor no puede preparar/enviar un pedido que no está pagado,
-- y cuando todas las partes de un pedido se cancelan, el pedido completo pasa
-- a "cancelado" (reembolso simulado).

-- ============================================================
-- Interruptor de modo de pagos
-- ============================================================
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_all" on public.app_settings;
create policy "app_settings_select_all" on public.app_settings
  for select using (true);

insert into public.app_settings (key, value)
values ('payments_mode', 'simulation')
on conflict (key) do nothing;

-- ============================================================
-- Pago simulado
-- ============================================================
create or replace function public.pay_order_simulated(p_order uuid, p_method text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode text;
  v_buyer uuid;
  v_status text;
  v_ref text;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  select value into v_mode from public.app_settings where key = 'payments_mode';
  if v_mode is distinct from 'simulation' then
    raise exception 'PAGOS_SIMULADOS_DESACTIVADOS';
  end if;

  if p_method not in ('tarjeta', 'yape', 'plin') then
    raise exception 'METODO_INVALIDO';
  end if;

  select buyer_id, status into v_buyer, v_status
  from public.orders
  where id = p_order
  for update;

  if v_buyer is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;
  if v_status <> 'pendiente' then
    raise exception 'YA_PROCESADO';
  end if;

  v_ref := 'SIM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  update public.orders
  set status = 'pagado', payment_method = p_method, payment_reference = v_ref
  where id = p_order;

  return v_ref;
end;
$$;

revoke all on function public.pay_order_simulated(uuid, text) from public, anon;
grant execute on function public.pay_order_simulated(uuid, text) to authenticated;

-- ============================================================
-- Si todas las partes de un pedido se cancelaron, el pedido se cancela
-- ============================================================
create or replace function public.sync_order_status(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.order_groups where order_id = p_order and fulfillment_status <> 'cancelado'
  ) then
    update public.orders set status = 'cancelado' where id = p_order;
  end if;
end;
$$;

revoke all on function public.sync_order_status(uuid) from public, anon, authenticated;

-- ============================================================
-- Vendedor: cambia el estado de su parte (ahora exige pedido pagado)
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
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;
  if p_status not in ('pendiente', 'preparando', 'enviado', 'entregado', 'cancelado') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  select s.owner_id, og.fulfillment_status, og.order_id, o.status
  into v_owner, v_current, v_order, v_order_status
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

  if p_status = 'cancelado' then
    perform public.restock_order_group(p_group);
  end if;

  update public.order_groups set fulfillment_status = p_status where id = p_group;

  if p_status = 'cancelado' then
    perform public.sync_order_status(v_order);
  end if;
end;
$$;

-- ============================================================
-- Comprador: cancela su pedido mientras siga "pendiente"
-- ============================================================
create or replace function public.cancel_my_order_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_current text;
  v_order uuid;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  select o.buyer_id, og.fulfillment_status, og.order_id
  into v_buyer, v_current, v_order
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
  perform public.sync_order_status(v_order);
end;
$$;

revoke all on function public.set_fulfillment_status(uuid, text) from public, anon;
revoke all on function public.cancel_my_order_group(uuid) from public, anon;
grant execute on function public.set_fulfillment_status(uuid, text) to authenticated;
grant execute on function public.cancel_my_order_group(uuid) to authenticated;
