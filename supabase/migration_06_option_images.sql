-- Nexo — sexta migración: foto distinta según el valor de una opción
-- (ej. mostrar la foto del producto en rojo cuando el comprador elige
-- Color = Rojo). Se guarda como un mapa "Grupo:Valor" -> URL de imagen.
alter table public.products
  add column if not exists option_images jsonb;
