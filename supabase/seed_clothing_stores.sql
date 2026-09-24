-- 4 tiendas de ropa de ejemplo con fotos REALES (Unsplash, uso libre), para
-- diversificar el rubro además de tu tienda (NeroShop). Sin dueño
-- (owner_id null) — solo de exhibición.

-- ============================================================
-- Moda Urbana Lima
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('moda-urbana-lima', 'Moda Urbana Lima', 'Streetwear y prendas urbanas, ropa con actitud para el día a día.', 'MU', true, 'coral', '#2A2622',
   'https://images.unsplash.com/photo-1532332248682-206cc786359f?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1559697242-a465f2578a95?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Hoodie oversize negra', 89, '#2A2622', 'Hoodie oversize de algodón grueso, corte urbano.', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L", "XL"]}'::jsonb
from public.stores where slug = 'moda-urbana-lima';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Casaca bomber', 120, '#4A4238', 'Casaca bomber acolchada, resistente al viento.', 'https://images.unsplash.com/photo-1574427797991-b086946fa9e7?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L"]}'::jsonb
from public.stores where slug = 'moda-urbana-lima';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Polo oversize gráfico', 55, 65, true, '#3A3630', 'Polo de algodón pesado con estampado gráfico.', 'https://images.unsplash.com/photo-1538329972958-465d6d2144ed?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'moda-urbana-lima';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Gorra bordada', 45, '#8C6E4F', 'Gorra ajustable con bordado 3D.', 'https://images.unsplash.com/photo-1588117260148-b47818741c74?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'moda-urbana-lima';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Pantalón cargo', 95, '#5C5548', 'Pantalón cargo con múltiples bolsillos, corte relajado.', 'https://images.unsplash.com/photo-1510853851847-5c02796e8c8a?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L", "XL"], "Color": ["Negro", "Verde"]}'::jsonb
from public.stores where slug = 'moda-urbana-lima';

-- ============================================================
-- Denim & Co
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('denim-co', 'Denim & Co', 'Jeans y prendas denim de calidad, cortes clásicos y modernos.', 'DC', false, 'oro', '#2E2A24',
   'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1631112230741-446762ee05ac?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Jean mom fit', 110, '#3A5A78', 'Jean mom de tiro alto, corte relajado.', 'https://images.unsplash.com/photo-1645859610425-f0f4177df5f0?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["26", "28", "30", "32"]}'::jsonb
from public.stores where slug = 'denim-co';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Jean skinny negro', 98, '#2A2A2E', 'Jean skinny elástico, negro desgastado.', 'https://images.unsplash.com/photo-1714729382668-7bc3bb261662?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["26", "28", "30", "32", "34"]}'::jsonb
from public.stores where slug = 'denim-co';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Casaca de jean', 130, 150, true, '#4A6A8A', 'Casaca de jean clásica, forro interior suave.', 'https://images.unsplash.com/photo-1637069585336-827b298fe84a?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'denim-co';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Short de jean', 65, '#5A7A9A', 'Short de jean tiro alto, deshilachado.', 'https://images.unsplash.com/photo-1645859724073-d9bff094b1c7?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'denim-co';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Jean recto clásico', 105, '#354D63', 'Jean corte recto, versátil para cualquier ocasión.', 'https://images.unsplash.com/photo-1640336437338-5c36f7e1115f?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["28", "30", "32", "34", "36"]}'::jsonb
from public.stores where slug = 'denim-co';

-- ============================================================
-- Boutique Flor
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('boutique-flor', 'Boutique Flor', 'Vestidos y ropa femenina para toda ocasión, diseños exclusivos.', 'BF', true, 'rosa', '#2E242A',
   'https://images.unsplash.com/photo-1567966456076-905a50a06d8c?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1614098097306-c67b8020c04e?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Vestido midi floral', 135, '#C97A9A', 'Vestido midi con estampado floral, tela fluida.', 'https://images.unsplash.com/photo-1739773375456-79be292cedb1?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L"]}'::jsonb
from public.stores where slug = 'boutique-flor';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Vestido de fiesta', 189, 220, true, '#8A5A7A', 'Vestido elegante para eventos, corte ajustado.', 'https://images.unsplash.com/photo-1760287363707-851f4780b98c?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'boutique-flor';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Blusa de seda', 95, '#D9A441', 'Blusa de seda sintética, caída elegante.', 'https://images.unsplash.com/photo-1640923160720-35dddb6348ab?w=900&h=900&fit=crop&q=80&auto=format', '{"Color": ["Blanco", "Beige", "Negro"]}'::jsonb
from public.stores where slug = 'boutique-flor';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Falda plisada', 78, '#B8869A', 'Falda plisada midi, cintura alta.', 'https://images.unsplash.com/photo-1763824969015-e5d1d6755782?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'boutique-flor';
insert into public.products (store_id, name, price, color, description, image_url, is_customizable, customization_label)
select id, 'Conjunto dos piezas', 145, '#9A6A7A', 'Conjunto de top y falda a juego.', 'https://images.unsplash.com/photo-1789110520302-3df8ce0410f0?w=900&h=900&fit=crop&q=80&auto=format', true, 'Talla exacta (medidas)'
from public.stores where slug = 'boutique-flor';

-- ============================================================
-- Activa Sport
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('activa-sport', 'Activa Sport', 'Ropa deportiva y de entrenamiento, tecnología transpirable.', 'AS', false, 'lima', '#1E2A24',
   'https://images.unsplash.com/photo-1540254597053-3901b858d40f?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1617085606193-6b17105cff2a?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Legging deportivo', 75, '#2A3A2E', 'Legging de compresión, tela transpirable.', 'https://images.unsplash.com/photo-1637666639858-e914177a9146?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L"]}'::jsonb
from public.stores where slug = 'activa-sport';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Top deportivo', 55, '#3A4A3E', 'Top deportivo con soporte medio, tirantes ajustables.', 'https://images.unsplash.com/photo-1595909315417-2edd382a56dc?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L"]}'::jsonb
from public.stores where slug = 'activa-sport';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Casaca cortaviento', 98, 115, true, '#2E3A2A', 'Casaca ligera cortaviento, ideal para correr.', 'https://images.unsplash.com/photo-1597726364265-02f57397c03c?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'activa-sport';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Short deportivo', 48, '#4A5A44', 'Short deportivo con malla interior.', 'https://images.unsplash.com/photo-1715609104589-97585b210c6e?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'activa-sport';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Polera técnica dry-fit', 62, '#354535', 'Polera técnica de secado rápido para entrenar.', 'https://images.unsplash.com/photo-1505915909330-c082888680af?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L", "XL"]}'::jsonb
from public.stores where slug = 'activa-sport';
