-- Nexo — migración 18: VERIFICACIÓN DE VENDEDORES (corre después de la 17).
--
-- Quien quiere vender debe identificarse con su DNI o su RUC:
--   • Entrega el tipo y número de documento, su nombre completo o razón social
--     y una foto del documento (guardada en un almacenamiento PRIVADO).
--   • El equipo de Nexo revisa los datos y los aprueba o rechaza (ver
--     supabase/revisar_vendedores.sql). Hasta que se aprueba, la tienda existe
--     pero no puede publicar ni recibir pedidos.
--   • Al aprobarse, la tienda queda con stores.verified = true (insignia).
--
-- Seguridad:
--   • Solo el dueño puede ver su propia verificación y sus archivos; nadie más
--     (ni otros vendedores ni compradores). El equipo los ve desde el panel de
--     Supabase.
--   • Un vendedor NO puede aprobarse a sí mismo: los triggers de abajo ignoran
--     cualquier intento de cambiar "verified" o "status" desde la aplicación.
--   • Un mismo documento no puede usarse en dos tiendas.
--
-- IMPORTANTE: las tiendas que ya existían se marcan como verificadas para que
-- el prototipo siga funcionando (son tiendas de prueba). Las nuevas deberán
-- pasar por la verificación.

-- ============================================================
-- Tabla de verificaciones
-- ============================================================
create table if not exists public.seller_verifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('dni', 'ruc')),
  doc_number text not null,
  legal_name text not null check (char_length(trim(legal_name)) >= 3),
  doc_front_path text not null,
  doc_back_path text,
  status text not null default 'pendiente' check (status in ('pendiente', 'verificado', 'rechazado')),
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint seller_doc_format check (
    (doc_type = 'dni' and doc_number ~ '^[0-9]{8}$')
    or (doc_type = 'ruc' and doc_number ~ '^(10|15|17|20)[0-9]{9}$')
  ),
  constraint seller_doc_unique unique (doc_type, doc_number)
);

alter table public.seller_verifications enable row level security;

drop policy if exists "seller_verifications_select_own" on public.seller_verifications;
create policy "seller_verifications_select_own" on public.seller_verifications
  for select using (auth.uid() = owner_id);

drop policy if exists "seller_verifications_insert_own" on public.seller_verifications;
create policy "seller_verifications_insert_own" on public.seller_verifications
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

drop policy if exists "seller_verifications_update_own" on public.seller_verifications;
create policy "seller_verifications_update_own" on public.seller_verifications
  for update using (auth.uid() = owner_id and status <> 'verificado')
  with check (auth.uid() = owner_id);

-- Desde la app, el estado siempre queda "pendiente": solo el equipo (panel de
-- Supabase, sin sesión de usuario) puede aprobar o rechazar.
create or replace function public.guard_seller_verification()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.status := 'pendiente';
      new.reject_reason := null;
      new.reviewed_at := null;
    else
      if old.status = 'verificado' then
        raise exception 'YA_VERIFICADO';
      end if;
      new.status := 'pendiente';
      new.reject_reason := null;
      new.reviewed_at := null;
      new.store_id := old.store_id;
      new.owner_id := old.owner_id;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists seller_verifications_guard on public.seller_verifications;
create trigger seller_verifications_guard
  before insert or update on public.seller_verifications
  for each row execute function public.guard_seller_verification();

-- Al aprobar o rechazar, la insignia de la tienda se actualiza sola.
create or replace function public.sync_store_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  update public.stores set verified = (new.status = 'verificado') where id = new.store_id;
  return new;
end;
$$;

revoke all on function public.sync_store_verified() from public, anon, authenticated;

drop trigger if exists seller_verifications_sync on public.seller_verifications;
create trigger seller_verifications_sync
  after insert or update of status on public.seller_verifications
  for each row execute function public.sync_store_verified();

-- ============================================================
-- Nadie se verifica solo: el campo stores.verified no se puede cambiar desde
-- la aplicación (solo desde el panel de Supabase o las funciones del servidor).
-- ============================================================
create or replace function public.protect_store_verified()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.verified := false;
    elsif new.verified is distinct from old.verified then
      new.verified := old.verified;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists stores_protect_verified on public.stores;
create trigger stores_protect_verified
  before insert or update on public.stores
  for each row execute function public.protect_store_verified();

-- Tiendas que ya existían: quedan verificadas (son de prueba).
update public.stores set verified = true where verified = false;

-- ============================================================
-- Almacenamiento privado para las fotos de los documentos
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seller-docs', 'seller-docs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "seller_docs_insert_own" on storage.objects;
create policy "seller_docs_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'seller-docs' and (storage.foldername(objects.name))[1] = auth.uid()::text);

drop policy if exists "seller_docs_select_own" on storage.objects;
create policy "seller_docs_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'seller-docs' and (storage.foldername(objects.name))[1] = auth.uid()::text);

-- ============================================================
-- Solo las tiendas verificadas pueden publicar
-- ============================================================
drop policy if exists "posts_insert_authorized" on public.posts;
create policy "posts_insert_authorized" on public.posts
  for insert
  with check (
    (kind = 'review' and auth.uid() = author_id)
    or (
      kind = 'oferta'
      and exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid() and s.verified)
    )
  );

-- ============================================================
-- create_order(): solo se compra en tiendas verificadas
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

  -- Solo se puede comprar en tiendas con identidad verificada.
  if exists (
    select 1
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    join public.stores s on s.id = p.store_id
    where ci.buyer_id = v_buyer and not s.verified
  ) then
    raise exception 'TIENDA_NO_VERIFICADA';
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
