-- 7 tiendas de ropa/accesorios más, con fotos reales (Unsplash, uso libre).
-- Sin dueño (owner_id null) — solo de exhibición.

-- ============================================================
-- Kicks Perú (zapatillas)
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('kicks-peru', 'Kicks Perú', 'Zapatillas urbanas y deportivas, ediciones limitadas y clásicos.', 'KP', true, 'coral', '#241E1E',
   'https://images.unsplash.com/photo-1656944227421-416b1d2186c9?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Zapatillas running blancas', 189, '#E8E4DC', 'Zapatillas running con amortiguación, corte bajo.', 'https://images.unsplash.com/photo-1605523741177-cd660595c2cf?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["38", "39", "40", "41", "42", "43"]}'::jsonb
from public.stores where slug = 'kicks-peru';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url, options)
select id, 'Zapatillas skate negras', 165, 195, true, '#1E1E1E', 'Zapatillas de skate, suela reforzada.', 'https://images.unsplash.com/photo-1656944227480-98180d2a5155?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["38", "39", "40", "41", "42"]}'::jsonb
from public.stores where slug = 'kicks-peru';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Zapatillas retro colorblock', 210, '#B84A3E', 'Edición retro con combinación de colores.', 'https://images.unsplash.com/photo-1656164753657-8ff832063a71?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["39", "40", "41", "42", "43"]}'::jsonb
from public.stores where slug = 'kicks-peru';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Zapatillas urbanas cuero', 175, '#3A2E26', 'Zapatillas de cuero sintético, estilo minimalista.', 'https://images.unsplash.com/photo-1628413993904-94ecb60f1239?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'kicks-peru';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Zapatillas altas canvas', 120, '#4A5A6A', 'Zapatillas canvas caña alta, estilo casual.', 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["37", "38", "39", "40"], "Color": ["Negro", "Blanco", "Azul"]}'::jsonb
from public.stores where slug = 'kicks-peru';

-- ============================================================
-- Pequeños Traviesos (ropa de niños)
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('pequenos-traviesos', 'Pequeños Traviesos', 'Ropa cómoda y divertida para niños, de 0 a 10 años.', 'PT', true, 'aqua', '#1E2A2E',
   'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Conjunto polo y short', 45, '#7C93B8', 'Conjunto de algodón, polo y short a juego.', 'https://images.unsplash.com/photo-1684244160171-97f5dac39204?w=900&h=900&fit=crop&q=80&auto=format', '{"Edad": ["2-3", "4-5", "6-7", "8-9"]}'::jsonb
from public.stores where slug = 'pequenos-traviesos';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Vestido floral niña', 52, '#E8A0BF', 'Vestido de algodón con estampado floral.', 'https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=900&h=900&fit=crop&q=80&auto=format', '{"Edad": ["2-3", "4-5", "6-7"]}'::jsonb
from public.stores where slug = 'pequenos-traviesos';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Casaca impermeable', 68, 80, true, '#D9A441', 'Casaca ligera impermeable con capucha.', 'https://images.unsplash.com/photo-1622290291720-ac961c43ee30?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'pequenos-traviesos';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Pack de 3 poleras', 55, '#8FB37A', 'Pack de 3 poleras básicas de algodón.', 'https://images.unsplash.com/photo-1632337948797-ba161d29532b?w=900&h=900&fit=crop&q=80&auto=format', '{"Edad": ["2-3", "4-5", "6-7", "8-9"]}'::jsonb
from public.stores where slug = 'pequenos-traviesos';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Overol bebé', 42, '#C98A4B', 'Overol de algodón suave para bebé.', 'https://images.unsplash.com/photo-1560859259-fcf2b952aed8?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'pequenos-traviesos';

-- ============================================================
-- Bolsos & Co
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('bolsos-co', 'Bolsos & Co', 'Bolsos y carteras de cuero, diseños clásicos y modernos.', 'BC', false, 'oro', '#2A241E',
   'https://images.unsplash.com/photo-1705909237050-7a7625b47fac?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Cartera de cuero marrón', 145, '#6B4226', 'Cartera de cuero genuino, varios compartimentos.', 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&h=900&fit=crop&q=80&auto=format', '{"Color": ["Marrón", "Negro", "Camel"]}'::jsonb
from public.stores where slug = 'bolsos-co';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Bolso tote grande', 120, 140, true, '#8C6E4F', 'Bolso tote espacioso, ideal para el día a día.', 'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'bolsos-co';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Mochila urbana cuero', 165, '#4A3826', 'Mochila de cuero con compartimento para laptop.', 'https://images.unsplash.com/photo-1624687943971-e86af76d57de?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'bolsos-co';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Clutch de noche', 68, '#2A2A2A', 'Clutch elegante para eventos, cierre magnético.', 'https://images.unsplash.com/photo-1681747685985-a401c271156c?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'bolsos-co';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Riñonera de cuero', 58, '#5A4636', 'Riñonera compacta, ajustable, dos bolsillos.', 'https://images.unsplash.com/photo-1637759292654-a12cb2be085e?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'bolsos-co';

-- ============================================================
-- Retro Vintage
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('retro-vintage', 'Retro Vintage', 'Prendas vintage seleccionadas a mano, piezas únicas de segunda mano.', 'RV', false, 'rosa', '#241E24',
   'https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1647664856968-880b8eccd588?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Casaca de cuero vintage', 145, '#3A2E26', 'Casaca de cuero genuino, estilo años 80.', 'https://images.unsplash.com/photo-1634133118553-1e6e18299886?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'retro-vintage';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Camisa estampada retro', 55, '#8C6E4F', 'Camisa de manga corta con estampado vintage.', 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'retro-vintage';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Jean vintage 90s', 95, 115, true, '#4A6A8A', 'Jean de tiro alto estilo años 90, pieza única.', 'https://images.unsplash.com/photo-1634133118060-99de9d0dc039?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'retro-vintage';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Suéter de lana vintage', 68, '#6B5A4A', 'Suéter tejido, estilo retro, pieza de segunda mano.', 'https://images.unsplash.com/photo-1573677275957-d6dbf54c0a4e?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'retro-vintage';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Vestido de segunda mano', 78, '#7A5A6A', 'Vestido vintage en buen estado, corte clásico.', 'https://images.unsplash.com/photo-1600709487035-f5d21265155d?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'retro-vintage';

-- ============================================================
-- Playa & Sol
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('playa-sol', 'Playa & Sol', 'Trajes de baño y ropa de playa, diseños peruanos.', 'PS', true, 'aqua', '#1E2A2A',
   'https://images.unsplash.com/photo-1555617135-8724b69f766c?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1551887283-ca87be316d1d?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Bikini dos piezas', 65, '#4DD9C8', 'Bikini de dos piezas, tela de secado rápido.', 'https://images.unsplash.com/photo-1602237778252-f3baa6486c59?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L"]}'::jsonb
from public.stores where slug = 'playa-sol';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Short de baño hombre', 48, '#3A6A6A', 'Short de baño con forro interior, secado rápido.', 'https://images.unsplash.com/photo-1622912496991-dbed807c72f2?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L", "XL"]}'::jsonb
from public.stores where slug = 'playa-sol';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Vestido de playa', 58, 70, true, '#F5C242', 'Vestido ligero de playa, tela fresca.', 'https://images.unsplash.com/photo-1594898278224-65c01f687846?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'playa-sol';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Sombrero de paja', 38, '#D9A441', 'Sombrero de paja natural, ala ancha.', 'https://images.unsplash.com/photo-1609857992823-4f0f75c76f3f?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'playa-sol';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Traje de baño entero', 72, '#2E7A7A', 'Traje de baño enterizo, soporte y cobertura completa.', 'https://images.unsplash.com/photo-1551974531-59ee6134d188?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L"]}'::jsonb
from public.stores where slug = 'playa-sol';

-- ============================================================
-- Elegance Corp (ropa formal)
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('elegance-corp', 'Elegance Corp', 'Ropa formal y de oficina, ternos y blazers a medida.', 'EC', true, 'lima', '#1E241E',
   'https://images.unsplash.com/photo-1714328564923-d4826427c991?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Blazer clásico negro', 220, '#1E1E1E', 'Blazer de corte clásico, tela premium.', 'https://images.unsplash.com/photo-1603394151492-5e9b974b090b?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L", "XL"]}'::jsonb
from public.stores where slug = 'elegance-corp';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Camisa formal blanca', 85, '#F5F5F0', 'Camisa de vestir, algodón de alta calidad.', 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["S", "M", "L", "XL"]}'::jsonb
from public.stores where slug = 'elegance-corp';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Terno completo gris', 450, 520, true, '#5A5A5A', 'Terno completo dos piezas, corte moderno.', 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'elegance-corp';
insert into public.products (store_id, name, price, color, description, image_url, is_customizable, customization_label)
select id, 'Pantalón de vestir', 110, '#3A3A3A', 'Pantalón de vestir, tela con elasticidad.', 'https://images.unsplash.com/photo-1785671056032-155395287a89?w=900&h=900&fit=crop&q=80&auto=format', true, 'Medidas para ajuste a medida'
from public.stores where slug = 'elegance-corp';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Blusa de oficina', 78, '#7A8A9A', 'Blusa formal, corte entallado.', 'https://images.unsplash.com/photo-1789141578724-d4cc015247e9?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'elegance-corp';

-- ============================================================
-- Lana Andina (gorros, bufandas, chompas)
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url) values
  ('lana-andina', 'Lana Andina', 'Gorros, bufandas y chompas de lana de alpaca, tejidos a mano en los Andes.', 'LA', true, 'oro', '#241E1A',
   'https://images.unsplash.com/photo-1737044281083-903d7826e8b0?w=500&h=500&fit=crop&q=80&auto=format',
   'https://images.unsplash.com/photo-1737063206857-49680d6a9df8?w=1600&h=500&fit=crop&q=80&auto=format');

insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Gorro de alpaca', 45, '#8C6E4F', 'Gorro tejido a mano en lana de alpaca 100%.', 'https://images.unsplash.com/photo-1737063207399-9ef8b0671370?w=900&h=900&fit=crop&q=80&auto=format', '{"Color": ["Gris", "Beige", "Rojo"]}'::jsonb
from public.stores where slug = 'lana-andina';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Bufanda de alpaca', 55, '#B84A3E', 'Bufanda larga tejida a mano, suave y abrigadora.', 'https://images.unsplash.com/photo-1514867312438-db0960ee52e5?w=900&h=900&fit=crop&q=80&auto=format', '{"Color": ["Rojo", "Azul", "Natural"]}'::jsonb
from public.stores where slug = 'lana-andina';
insert into public.products (store_id, name, price, original_price, is_offer, color, description, image_url)
select id, 'Chompa de alpaca', 145, 170, true, '#6B5A4A', 'Chompa tejida a mano, diseño tradicional andino.', 'https://images.unsplash.com/photo-1731402967882-087b875b878e?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'lana-andina';
insert into public.products (store_id, name, price, color, description, image_url, options)
select id, 'Guantes de lana', 32, '#8A7A6A', 'Guantes tejidos, abrigadores para invierno.', 'https://images.unsplash.com/photo-1737044265123-c0d8af67b32a?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla": ["Única"]}'::jsonb
from public.stores where slug = 'lana-andina';
insert into public.products (store_id, name, price, color, description, image_url)
select id, 'Set gorro y bufanda', 88, '#A9673E', 'Set combinado de gorro y bufanda a juego.', 'https://images.unsplash.com/photo-1737044266036-93bd7ef104cc?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'lana-andina';
