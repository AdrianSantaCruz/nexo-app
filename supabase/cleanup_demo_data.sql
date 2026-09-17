-- Borra las 3 tiendas de ejemplo (Manos de Jazmín, Aromas del Sur, Cerámica
-- Yura) y TODO lo que depende de ellas en cascada: sus productos, variantes,
-- reseñas, publicaciones y conversaciones. No toca tu tienda real (NeroShop)
-- ni ninguna cuenta de usuario.
delete from public.stores
where slug in ('manos-de-jazmin', 'aromas-del-sur', 'ceramica-yura');
