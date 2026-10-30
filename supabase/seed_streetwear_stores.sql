-- Nexo — quita la tienda de bikinis y agrega 5 tiendas de ropa streetwear.
-- Fotos reales de Unsplash (uso libre). Sin dueño (owner_id null): solo exhibición.
-- Correr en Supabase → SQL Editor. Puede correrse más de una vez (no duplica).

-- 1) Eliminar la tienda de bikinis (Playa & Sol) con sus productos. Si alguien
--    ya hizo un pedido en ella, la base la conserva (por el historial de ventas).
delete from public.stores s
where s.slug = 'playa-sol'
  and not exists (select 1 from public.order_groups og where og.store_id = s.id);

-- ============================================================
-- Urban Drip PE
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url)
select 'urban-drip-pe', 'Urban Drip PE', 'Streetwear peruano: hoodies, poleras oversize y conjuntos para la calle.', 'UD', true, 'lima', '#1E241A', 'https://images.unsplash.com/photo-1618924250113-e162305ac8cd?w=500&h=500&fit=crop&q=80&auto=format', 'https://images.unsplash.com/photo-1779676086752-08349f9ef9f2?w=1600&h=500&fit=crop&q=80&auto=format'
where not exists (select 1 from public.stores where slug = 'urban-drip-pe');

insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Hoodie oversize beige', 119, 24, '#CBB8A0', 'Hoodie oversize de algodón grueso, capucha amplia y bolsillo canguro.', 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"],"Color":["Beige","Negro","Blanco"]}'::jsonb
from public.stores where slug = 'urban-drip-pe'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Hoodie oversize beige');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Hoodie blanco boxy', 125, 18, '#E9E6E0', 'Corte boxy, tela pesada, ideal para combinar con cargo.', 'https://images.unsplash.com/photo-1688111421205-a0a85415b224?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'urban-drip-pe'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Hoodie blanco boxy');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Polera gráfica Lima Nights', 69, 30, '#3A3F5C', 'Polera con estampado a todo color, algodón peinado.', 'https://images.unsplash.com/photo-1678872844677-d650b788709b?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'urban-drip-pe'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Polera gráfica Lima Nights');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Polera blanca oversize', 59, 40, '#EDEBE6', 'Polera básica oversize, cuello reforzado.', 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'urban-drip-pe'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Polera blanca oversize');
insert into public.products (store_id, name, price, original_price, is_offer, stock, color, description, image_url, options)
select id, 'Conjunto chándal oversize', 189, 229, true, 12, '#6C6F7A', 'Conjunto de polera y pantalón oversize, tela afelpada.', 'https://images.unsplash.com/photo-1779676086752-08349f9ef9f2?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'urban-drip-pe'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Conjunto chándal oversize');

-- ============================================================
-- Cargo Society
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url)
select 'cargo-society', 'Cargo Society', 'Pantalones cargo, joggers y pantalones track con corte amplio y mucho bolsillo.', 'CS', true, 'oro', '#2A2518', 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&h=500&fit=crop&q=80&auto=format', 'https://images.unsplash.com/photo-1766575696324-5b65330f23c2?w=1600&h=500&fit=crop&q=80&auto=format'
where not exists (select 1 from public.stores where slug = 'cargo-society');

insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Pantalón cargo beige', 139, 20, '#C2B59B', 'Cargo de gabardina con bolsillos laterales y tobillo ajustable.', 'https://images.unsplash.com/photo-1776153627325-a5950e50b33a?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["28","30","32","34"]}'::jsonb
from public.stores where slug = 'cargo-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Pantalón cargo beige');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Pantalón cargo negro', 145, 22, '#1F1F1F', 'Cargo negro de corte amplio, seis bolsillos.', 'https://images.unsplash.com/photo-1584302052177-2e90841dad6a?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["28","30","32","34"]}'::jsonb
from public.stores where slug = 'cargo-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Pantalón cargo negro');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Jogger gris', 89, 35, '#8A8D92', 'Jogger de algodón afelpado con puños elásticos.', 'https://images.unsplash.com/photo-1789110520164-2389992e5d0f?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'cargo-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Jogger gris');
insert into public.products (store_id, name, price, original_price, is_offer, stock, color, description, image_url, options)
select id, 'Pantalón track negro', 129, 159, true, 16, '#25262B', 'Pantalón deportivo negro con franjas laterales y pierna ancha.', 'https://images.unsplash.com/photo-1608585617748-d55938680e85?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["28","30","32","34"]}'::jsonb
from public.stores where slug = 'cargo-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Pantalón track negro');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Jogger rosa palo', 99, 8, '#D9A6A0', 'Jogger color rosa palo con puños elásticos, edición limitada.', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["28","30","32","34"]}'::jsonb
from public.stores where slug = 'cargo-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Jogger rosa palo');

-- ============================================================
-- Skate Lima
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url)
select 'skate-lima', 'Skate Lima', 'Ropa de skate: polos boxy, overshirts y pantalones resistentes para rodar.', 'SL', false, 'aqua', '#18262A', 'https://images.unsplash.com/photo-1499083773823-5000fa2b23e4?w=500&h=500&fit=crop&q=80&auto=format', 'https://images.unsplash.com/photo-1558388555-50f0410dd4c8?w=1600&h=500&fit=crop&q=80&auto=format'
where not exists (select 1 from public.stores where slug = 'skate-lima');

insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Polo skate boxy', 65, 28, '#3E5C8C', 'Polo boxy de algodón, estampado frontal.', 'https://images.unsplash.com/photo-1589902860314-e910697dea18?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'skate-lima'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Polo skate boxy');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Overshirt verde skate', 115, 15, '#4C7A55', 'Camisa-chaqueta holgada, ideal para rodar.', 'https://images.unsplash.com/photo-1589712186148-03ec318289c0?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'skate-lima'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Overshirt verde skate');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Pantalón skate negro', 129, 20, '#222222', 'Pantalón de lona resistente, costuras dobles.', 'https://images.unsplash.com/photo-1591311337241-cecfd26f1da1?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["28","30","32","34"]}'::jsonb
from public.stores where slug = 'skate-lima'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Pantalón skate negro');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Pantalón skate crudo', 129, 14, '#D8CFBF', 'Pantalón de lona color crudo, corte holgado.', 'https://images.unsplash.com/photo-1601247309037-a3e434b07906?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["28","30","32","34"]}'::jsonb
from public.stores where slug = 'skate-lima'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Pantalón skate crudo');
insert into public.products (store_id, name, price, original_price, is_offer, stock, color, description, image_url, options)
select id, 'Chaqueta cortaviento skate', 135, 160, true, 10, '#7A5A3C', 'Chaqueta ligera, resistente al viento.', 'https://images.unsplash.com/photo-1610462257803-064c1273c681?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'skate-lima'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Chaqueta cortaviento skate');

-- ============================================================
-- Cap Society
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url)
select 'cap-society', 'Cap Society', 'Gorras, gorros y accesorios para completar tu outfit streetwear.', 'CP', true, 'rosa', '#2A1C24', 'https://images.unsplash.com/photo-1691256676359-20e5c6d4bc92?w=500&h=500&fit=crop&q=80&auto=format', 'https://images.unsplash.com/photo-1681583663936-7e213cca9d72?w=1600&h=500&fit=crop&q=80&auto=format'
where not exists (select 1 from public.stores where slug = 'cap-society');

insert into public.products (store_id, name, price, stock, color, description, image_url)
select id, 'Gorra snapback blanca', 49, 45, '#E8E6E1', 'Snapback blanca, ajuste regulable.', 'https://images.unsplash.com/photo-1691256676359-20e5c6d4bc92?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cap-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Gorra snapback blanca');
insert into public.products (store_id, name, price, stock, color, description, image_url)
select id, 'Gorra negra y amarilla', 55, 30, '#2A2A1E', 'Gorra ajustada con visera plana, bordado frontal.', 'https://images.unsplash.com/photo-1604532057336-2c4a09f71330?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cap-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Gorra negra y amarilla');
insert into public.products (store_id, name, price, stock, color, description, image_url)
select id, 'Gorra bordada azul', 52, 26, '#3A5A8C', 'Gorra azul desteñida con bordado.', 'https://images.unsplash.com/photo-1483103068651-8ce44652c331?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cap-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Gorra bordada azul');
insert into public.products (store_id, name, price, original_price, is_offer, stock, color, description, image_url, options)
select id, 'Pack de gorros de punto', 59, 75, true, 25, '#B8553E', 'Pack de gorros de punto en colores surtidos.', 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=900&h=900&fit=crop&q=80&auto=format', '{"Color":["Mostaza","Rojo","Verde","Gris"]}'::jsonb
from public.stores where slug = 'cap-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Pack de gorros de punto');
insert into public.products (store_id, name, price, stock, color, description, image_url)
select id, 'Gorro amarillo', 39, 33, '#D9B23C', 'Gorro de punto grueso, color amarillo.', 'https://images.unsplash.com/photo-1574427797991-b086946fa9e7?w=900&h=900&fit=crop&q=80&auto=format'
from public.stores where slug = 'cap-society'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Gorro amarillo');

-- ============================================================
-- Varsity Lab
-- ============================================================
insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color, avatar_url, banner_image_url)
select 'varsity-lab', 'Varsity Lab', 'Chaquetas bomber, varsity y de cuero para el streetwear de temporada.', 'VL', false, 'coral', '#2A1E1A', 'https://images.unsplash.com/photo-1774413769417-29fde33e368b?w=500&h=500&fit=crop&q=80&auto=format', 'https://images.unsplash.com/photo-1774413768774-a499f1bd8e32?w=1600&h=500&fit=crop&q=80&auto=format'
where not exists (select 1 from public.stores where slug = 'varsity-lab');

insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Bomber cobre', 215, 9, '#B5714A', 'Chaqueta bomber color cobre, forro interior y puños acanalados.', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'varsity-lab'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Bomber cobre');
insert into public.products (store_id, name, price, original_price, is_offer, stock, color, description, image_url, options)
select id, 'Chaqueta varsity LA', 235, 269, true, 7, '#C8B89A', 'Varsity clásica con mangas contrastantes.', 'https://images.unsplash.com/photo-1774413768774-a499f1bd8e32?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'varsity-lab'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Chaqueta varsity LA');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Varsity crema', 199, 11, '#CDBFA4', 'Varsity color crema con mangas blancas, ideal para entretiempo.', 'https://images.unsplash.com/photo-1774413768759-d3cc719c1a0e?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'varsity-lab'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Varsity crema');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Chaqueta con capucha azul', 179, 13, '#2F5DA8', 'Chaqueta con cremallera y capucha, tela técnica.', 'https://images.unsplash.com/photo-1624548140129-74786c5f1279?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'varsity-lab'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Chaqueta con capucha azul');
insert into public.products (store_id, name, price, stock, color, description, image_url, options)
select id, 'Chaqueta de cuero negro', 289, 6, '#161616', 'Chaqueta de cuero sintético negro, corte recto.', 'https://images.unsplash.com/photo-1602525582399-7ef5f604ff7e?w=900&h=900&fit=crop&q=80&auto=format', '{"Talla":["S","M","L","XL"]}'::jsonb
from public.stores where slug = 'varsity-lab'
  and not exists (select 1 from public.products x where x.store_id = stores.id and x.name = 'Chaqueta de cuero negro');

