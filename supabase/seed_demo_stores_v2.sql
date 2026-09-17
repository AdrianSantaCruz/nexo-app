-- 5 tiendas de ejemplo con fotos REALES (de Unsplash, uso libre) para
-- mostrar el feed y descubrir con contenido de verdad en vez de colores
-- planos. Sin dueño (owner_id null) — son solo de exhibición, no se pueden
-- editar desde la app hasta que las "reclame" una cuenta real.

-- ============================================================
-- Panadería Doña Marta
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('dona-marta', 'Panadería Doña Marta', 'Pan artesanal de masa madre y repostería horneada todos los días en Arequipa.', 'DM', true, 'oro', '#3A2E1E',
   'https://images.unsplash.com/photo-1523294587484-bae6cc870010?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Pan artesanal de masa madre', 18, '#8C6E4F', 'Pan de masa madre fermentado 24 horas, corteza crocante.', 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'dona-marta';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Croissants de mantequilla (x4)', 22, '#C98A4B', 'Croissants hojaldrados, horneados en el día.', 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'dona-marta';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Torta de chocolate', 55, 65, true, '#6B4226', 'Torta húmeda de chocolate, porción para 8-10 personas.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'dona-marta';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Baguettes francesas (x2)', 14, '#D9A441', 'Baguettes clásicas, corteza dorada.', 'https://images.unsplash.com/photo-1559811814-e2c57b5e69df?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'dona-marta';
insert into public.products (store_id, name, price, color, description, image_url, is_customizable, customization_label)
select id, 'Cupcakes decorados (x6)', 30, '#E8A0BF', 'Cupcakes decorados a pedido para cumpleaños y eventos.', 'https://images.unsplash.com/photo-1549413468-cd78edb7e75c?w=900&h=900&fit=crop&q=80&auto=format', true, 'Mensaje o color para decorar'
from public.stores where slug = 'dona-marta';

-- ============================================================
-- Joyas Andinas
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('joyas-andinas', 'Joyas Andinas', 'Joyería artesanal en plata 950 y piedras naturales, hecha a mano en el sur del Perú.', 'JA', true, 'rosa', '#2E2A2E',
   'https://images.unsplash.com/photo-1659032882718-3e54e7da86ab?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1624588057318-5f1b2eb81012?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Aretes de plata 950', 45, '#B8B8B8', 'Aretes hechos a mano en plata 950 con acabado pulido.', 'https://images.unsplash.com/photo-1599071338288-49173359e0fd?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'joyas-andinas';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Collar con piedra natural', 68, '#7C93B8', 'Collar artesanal con piedra semipreciosa engarzada en plata.', 'https://images.unsplash.com/photo-1679590988898-50c20140aec0?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'joyas-andinas';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Pulsera artesanal', 32, '#D9A441', 'Pulsera tejida a mano con dijes de plata.', 'https://images.unsplash.com/photo-1655111379423-b85edc4da9ac?w=900&h=900&fit=crop&q=80&auto=format', '{"Color de hilo": ["Negro", "Café", "Beige"]}'::jsonb
from public.stores where slug = 'joyas-andinas';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Anillo tejido a mano', 38, 45, true, '#C98A4B', 'Anillo ajustable con técnica de tejido andino.', 'https://images.unsplash.com/photo-1722510825242-0d8f2064c2e2?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'joyas-andinas';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Set de aretes y collar', 95, '#B87A5C', 'Juego combinado de aretes y collar a juego.', 'https://images.unsplash.com/photo-1573227890085-12ab5d68a170?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'joyas-andinas';

-- ============================================================
-- Vivero Raíces
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('vivero-raices', 'Vivero Raíces', 'Plantas de interior, suculentas y cactus para darle vida a tu espacio.', 'VR', false, 'lima', '#1E3320',
   'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1446071103084-c257b5f70672?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Suculenta mini x3', 25, '#8FB37A', 'Set de 3 suculentas mini en maceta de barro.', 'https://images.unsplash.com/photo-1526565782131-a13074f0dbbb?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'vivero-raices';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Cactus en maceta de barro', 20, '#6B8E4E', 'Cactus resistente, ideal para poca luz.', 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'vivero-raices';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Planta de interior grande', 55, '#4C7A3F', 'Planta de interior de gran tamaño, purifica el ambiente.', 'https://images.unsplash.com/photo-1551893665-f843f600794e?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'vivero-raices';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Terrario de vidrio', 48, '#7C93B8', 'Terrario armado con musgo y mini plantas.', 'https://images.unsplash.com/photo-1446292532430-3e76f6ab6444?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'vivero-raices';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Kit de siembra', 30, '#A9673E', 'Kit completo para empezar tu propio huerto en casa.', 'https://images.unsplash.com/photo-1455793222120-98f37a8d4ede?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'vivero-raices';

-- ============================================================
-- Café Origen
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('cafe-origen', 'Café Origen', 'Café peruano de especialidad, tostado en pequeños lotes.', 'CO', true, 'coral', '#2A1E1A',
   'https://images.unsplash.com/photo-1513530176992-0cf39c4cbed4?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Café en grano 500g', 42, '#6B4226', 'Café de especialidad en grano, tueste medio.', 'https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=900&h=900&fit=crop&q=80&auto=format', '{"Tueste": ["Claro", "Medio", "Oscuro"]}'::jsonb
from public.stores where slug = 'cafe-origen';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Café molido edición especial', 38, '#8C6E4F', 'Molienda fina, ideal para cafetera italiana.', 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cafe-origen';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Pack de 3 orígenes', 95, 110, true, '#A9673E', 'Set de 3 bolsas de 250g de distintas zonas cafetaleras del Perú.', 'https://images.unsplash.com/photo-1606486544554-164d98da4889?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cafe-origen';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Café en cápsulas (x10)', 35, '#4A3226', 'Cápsulas compatibles con cafeteras estándar.', 'https://images.unsplash.com/photo-1625021659159-f63f546d74a7?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cafe-origen';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Kit de prensa francesa', 65, '#7C93B8', 'Prensa francesa de vidrio + 250g de café molido.', 'https://images.unsplash.com/photo-1551610290-e153ec567dd8?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cafe-origen';

-- ============================================================
-- Velas Luna
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('velas-luna', 'Velas Luna', 'Velas artesanales de cera vegetal con aromas naturales, hechas a mano.', 'VL', false, 'aqua', '#231F2E',
   'https://images.unsplash.com/photo-1603905179139-db12ab535ca9?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1613068431228-8cb6a1e92573?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Vela de soya lavanda', 28, '#9B8BB4', 'Vela de cera de soya, aroma lavanda, 40 horas de duración.', 'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'velas-luna';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Vela aromática en frasco', 32, '#D9A441', 'Vela en frasco de vidrio reutilizable, aroma vainilla.', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'velas-luna';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Set de velas votivas (x4)', 40, '#C98A4B', 'Set de 4 velas votivas mini en distintos aromas.', 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=900&h=900&fit=crop&q=80&auto=format', '{"Aroma": ["Vainilla", "Sándalo", "Canela"]}'::jsonb
from public.stores where slug = 'velas-luna';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Vela decorativa grande', 48, 55, true, '#8C6E4F', 'Vela grande decorativa, ideal para regalo.', 'https://images.unsplash.com/photo-1603218678692-3967d7523bb0?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'velas-luna';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Vela de cera de coco', 30, '#6FA8A0', 'Vela de cera de coco 100% natural, aroma coco-lima.', 'https://images.unsplash.com/photo-1643122966676-29e8597257f7?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'velas-luna';
