-- Nexo — quinta migración: precio propio por combinación de opciones
-- (ej. Talla=XL puede costar más que Talla=S).
--
-- No se guarda una fila por CADA combinación posible — solo para las que el
-- vendedor personalizó con un precio distinto al precio base del producto.
-- Si una combinación no tiene fila aquí, se usa el precio base normal.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_values jsonb not null,
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;

create policy "product_variants_select_all" on public.product_variants
  for select using (true);

create policy "product_variants_all_store_owner" on public.product_variants
  for all
  using (
    exists (
      select 1 from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );
