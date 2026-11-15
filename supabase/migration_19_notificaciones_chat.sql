-- Nexo — migración 19: notificaciones y chat en tiempo real.
--
-- Qué agrega:
--   1. Centro de notificaciones (tabla `notifications`) que se llena SOLO con
--      triggers: mensaje nuevo, pedido nuevo/pagado, cambios de estado del
--      pedido, verificación del vendedor, seguidores, likes y comentarios.
--   2. Chat con "visto" (messages.read_at) y orden por último mensaje.
--   3. Realtime para notifications, conversations y messages (inserts y updates).
--
-- Es seguro correrla más de una vez.

-- ============================================================
-- 1. CHAT: visto + última actividad
-- ============================================================
alter table public.messages add column if not exists read_at timestamptz;

alter table public.conversations add column if not exists last_message_at timestamptz;

update public.conversations c
set last_message_at = coalesce(
  (select max(m.created_at) from public.messages m where m.conversation_id = c.id),
  c.created_at
)
where c.last_message_at is null;

alter table public.conversations alter column last_message_at set default now();

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists messages_unread_idx
  on public.messages (conversation_id) where read_at is null;

-- ============================================================
-- 2. NOTIFICACIONES
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- No hay policy de insert/update: las notificaciones solo las crean los
-- triggers y solo se marcan como leídas con mark_notifications_read().

-- Crea una notificación (solo la usan los triggers de abajo).
create or replace function public.push_notification(
  p_user uuid, p_type text, p_title text, p_body text, p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user, p_type, p_title, coalesce(p_body, ''), coalesce(p_data, '{}'::jsonb));
end;
$$;

revoke all on function public.push_notification(uuid, text, text, text, jsonb) from public, anon, authenticated;

-- Marca como leídas las notificaciones indicadas (o todas si p_ids es null).
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null
    and (p_ids is null or id = any (p_ids));
end;
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- ============================================================
-- 3. CHAT: marcar como visto
-- ============================================================
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NO_AUTH';
  end if;

  if not exists (
    select 1
    from public.conversations c
    join public.stores s on s.id = c.store_id
    where c.id = p_conversation
      and (c.buyer_id = auth.uid() or s.owner_id = auth.uid())
  ) then
    raise exception 'NO_AUTORIZADO';
  end if;

  update public.messages
  set read_at = now()
  where conversation_id = p_conversation
    and sender_id <> auth.uid()
    and read_at is null;

  -- Si había un aviso de mensaje sin leer de esta conversación, también se lee.
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and type = 'mensaje'
    and read_at is null
    and data ->> 'conversation_id' = p_conversation::text;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ============================================================
-- 4. TRIGGER: mensaje nuevo → notificación + última actividad
-- ============================================================
create or replace function public.on_message_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_owner uuid;
  v_store text;
  v_recipient uuid;
  v_title text;
  v_as_store boolean;
  v_existing uuid;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;

  select c.buyer_id, s.owner_id, s.name
  into v_buyer, v_owner, v_store
  from public.conversations c
  join public.stores s on s.id = c.store_id
  where c.id = new.conversation_id;

  if new.sender_id = v_buyer then
    v_recipient := v_owner;
    v_as_store := true;
    select name into v_title from public.profiles where id = new.sender_id;
    v_title := coalesce(v_title, 'Un cliente');
  else
    v_recipient := v_buyer;
    v_as_store := false;
    v_title := coalesce(v_store, 'Una tienda');
  end if;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  -- Un solo aviso por conversación mientras no lo lean (no se llena de avisos).
  select id into v_existing
  from public.notifications
  where user_id = v_recipient
    and type = 'mensaje'
    and read_at is null
    and data ->> 'conversation_id' = new.conversation_id::text
  limit 1;

  if v_existing is not null then
    update public.notifications
    set title = v_title,
        body = left(new.text, 140),
        created_at = now(),
        data = jsonb_set(data, '{count}', to_jsonb(coalesce((data ->> 'count')::int, 1) + 1))
    where id = v_existing;
  else
    perform public.push_notification(
      v_recipient, 'mensaje', v_title, left(new.text, 140),
      jsonb_build_object('conversation_id', new.conversation_id, 'as_store', v_as_store, 'count', 1)
    );
  end if;

  return new;
end;
$$;

revoke all on function public.on_message_inserted() from public, anon, authenticated;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.on_message_inserted();

-- ============================================================
-- 5. TRIGGER: pedido pagado → avisa a vendedores y comprador
-- ============================================================
create or replace function public.on_order_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  v_stores int := 0;
begin
  for g in
    select og.id, og.subtotal, s.owner_id, s.name
    from public.order_groups og
    join public.stores s on s.id = og.store_id
    where og.order_id = new.id
  loop
    v_stores := v_stores + 1;
    perform public.push_notification(
      g.owner_id, 'pedido_nuevo', '¡Nuevo pedido pagado!',
      'Tienes un pedido por S/ ' || to_char(g.subtotal, 'FM999990.00') || '. Prepáralo y actualiza su estado.',
      jsonb_build_object('group_id', g.id, 'order_id', new.id)
    );
  end loop;

  perform public.push_notification(
    new.buyer_id, 'pedido_estado', 'Pago confirmado',
    'Recibimos tu pago. Las tiendas ya pueden preparar tu pedido.',
    jsonb_build_object('order_id', new.id)
  );
  return new;
end;
$$;

revoke all on function public.on_order_paid() from public, anon, authenticated;

drop trigger if exists orders_after_paid on public.orders;
create trigger orders_after_paid
  after update of status on public.orders
  for each row
  when (new.status = 'pagado' and old.status is distinct from 'pagado')
  execute function public.on_order_paid();

-- ============================================================
-- 6. TRIGGER: cambia el estado de una parte del pedido
-- ============================================================
create or replace function public.on_order_group_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_method text;
  v_point text;
  v_owner uuid;
  v_store text;
  v_title text;
  v_body text;
begin
  select o.buyer_id, o.delivery_method, pp.name
  into v_buyer, v_method, v_point
  from public.orders o
  left join public.pickup_points pp on pp.id = o.pickup_point_id
  where o.id = new.order_id;

  select s.owner_id, s.name into v_owner, v_store from public.stores s where s.id = new.store_id;

  if new.fulfillment_status = 'preparando' then
    perform public.push_notification(
      v_buyer, 'pedido_estado', 'Preparando tu pedido',
      coalesce(v_store, 'La tienda') || ' está preparando tu pedido.',
      jsonb_build_object('group_id', new.id, 'order_id', new.order_id)
    );

  elsif new.fulfillment_status = 'enviado' then
    if v_method = 'locker' then
      v_title := 'Tu pedido está en el locker';
      v_body := 'Retíralo en ' || coalesce(v_point, 'el locker elegido') || ' con tu código de pedido.';
    else
      v_title := 'Tu pedido va en camino';
      v_body := coalesce(v_store, 'La tienda') || ' coordinará contigo la entrega. Ten listo tu código de pedido.';
    end if;
    perform public.push_notification(
      v_buyer, 'pedido_estado', v_title, v_body,
      jsonb_build_object('group_id', new.id, 'order_id', new.order_id)
    );

  elsif new.fulfillment_status = 'entregado' then
    perform public.push_notification(
      v_buyer, 'pedido_estado', 'Pedido entregado',
      '¡Gracias por comprar en ' || coalesce(v_store, 'Nexo') || '! Cuéntanos qué tal estuvo con una reseña.',
      jsonb_build_object('group_id', new.id, 'order_id', new.order_id)
    );
    perform public.push_notification(
      v_owner, 'pedido_estado', 'Pedido entregado',
      'El cliente ya recibió su pedido. ¡Buen trabajo!',
      jsonb_build_object('group_id', new.id, 'order_id', new.order_id, 'as_store', true)
    );

  elsif new.fulfillment_status = 'cancelado' then
    -- Avisa a la otra parte: si cancela el comprador, avisa a la tienda y viceversa.
    if auth.uid() is not distinct from v_buyer then
      perform public.push_notification(
        v_owner, 'pedido_estado', 'Pedido cancelado',
        'El cliente canceló un pedido. El stock ya volvió a tu catálogo.',
        jsonb_build_object('group_id', new.id, 'order_id', new.order_id, 'as_store', true)
      );
    else
      perform public.push_notification(
        v_buyer, 'pedido_estado', 'Pedido cancelado',
        coalesce(v_store, 'La tienda') || ' canceló tu pedido.',
        jsonb_build_object('group_id', new.id, 'order_id', new.order_id)
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.on_order_group_status() from public, anon, authenticated;

drop trigger if exists order_groups_after_status on public.order_groups;
create trigger order_groups_after_status
  after update of fulfillment_status on public.order_groups
  for each row
  when (new.fulfillment_status is distinct from old.fulfillment_status)
  execute function public.on_order_group_status();

-- ============================================================
-- 7. TRIGGER: verificación del vendedor aprobada o rechazada
-- ============================================================
create or replace function public.on_seller_verification_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'verificado' then
    perform public.push_notification(
      new.owner_id, 'verificacion', '¡Tu tienda está verificada!',
      'Ya puedes publicar y recibir pedidos en Nexo.',
      jsonb_build_object('status', 'verificado')
    );
  elsif new.status = 'rechazado' then
    perform public.push_notification(
      new.owner_id, 'verificacion', 'Tu verificación fue rechazada',
      coalesce(nullif(new.reject_reason, ''), 'No pudimos validar tus datos.') || ' Corrige la información y vuelve a enviarla.',
      jsonb_build_object('status', 'rechazado')
    );
  end if;
  return new;
end;
$$;

revoke all on function public.on_seller_verification_status() from public, anon, authenticated;

drop trigger if exists seller_verifications_notify on public.seller_verifications;
create trigger seller_verifications_notify
  after update of status on public.seller_verifications
  for each row
  when (new.status is distinct from old.status)
  execute function public.on_seller_verification_status();

-- ============================================================
-- 8. TRIGGERS SOCIALES: seguidor, like y comentario
-- ============================================================
create or replace function public.on_follow_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select name into v_name from public.profiles where id = new.follower_id;
  perform public.push_notification(
    new.following_id, 'seguidor', coalesce(v_name, 'Alguien') || ' empezó a seguirte',
    'Toca para ver su perfil.',
    jsonb_build_object('profile_id', new.follower_id)
  );
  return new;
end;
$$;

revoke all on function public.on_follow_inserted() from public, anon, authenticated;

drop trigger if exists follows_after_insert on public.follows;
create trigger follows_after_insert
  after insert on public.follows
  for each row execute function public.on_follow_inserted();

create or replace function public.on_post_like_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_name text;
begin
  select coalesce(p.author_id, s.owner_id) into v_recipient
  from public.posts p
  join public.stores s on s.id = p.store_id
  where p.id = new.post_id;

  if v_recipient is null or v_recipient = new.user_id then
    return new;
  end if;

  select name into v_name from public.profiles where id = new.user_id;
  perform public.push_notification(
    v_recipient, 'like', coalesce(v_name, 'Alguien') || ' le dio me gusta a tu publicación',
    '', jsonb_build_object('post_id', new.post_id, 'profile_id', new.user_id)
  );
  return new;
end;
$$;

revoke all on function public.on_post_like_inserted() from public, anon, authenticated;

drop trigger if exists post_likes_after_insert on public.post_likes;
create trigger post_likes_after_insert
  after insert on public.post_likes
  for each row execute function public.on_post_like_inserted();

create or replace function public.on_post_comment_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_name text;
begin
  select coalesce(p.author_id, s.owner_id) into v_recipient
  from public.posts p
  join public.stores s on s.id = p.store_id
  where p.id = new.post_id;

  if v_recipient is null or v_recipient = new.author_id then
    return new;
  end if;

  select name into v_name from public.profiles where id = new.author_id;
  perform public.push_notification(
    v_recipient, 'comentario', coalesce(v_name, 'Alguien') || ' comentó tu publicación',
    left(new.text, 140), jsonb_build_object('post_id', new.post_id, 'profile_id', new.author_id)
  );
  return new;
end;
$$;

revoke all on function public.on_post_comment_inserted() from public, anon, authenticated;

drop trigger if exists post_comments_after_insert on public.post_comments;
create trigger post_comments_after_insert
  after insert on public.post_comments
  for each row execute function public.on_post_comment_inserted();

-- ============================================================
-- 9. REALTIME
-- ============================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conversations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
end $$;
