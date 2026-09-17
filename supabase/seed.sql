-- Datos de ejemplo para Nexo — correr DESPUÉS de schema.sql.
-- Las tiendas quedan sin dueño (owner_id null) porque todavía no existen
-- cuentas reales. Para asignarte una tienda de prueba: regístrate en la app
-- y luego corre, reemplazando el correo y el slug:
--
--   update public.stores set owner_id = (select id from auth.users where email = 'tu@correo.com')
--   where slug = 'manos-de-jazmin';

insert into public.stores (slug, name, description, initials, verified, accent_id, banner_color) values
  ('manos-de-jazmin', 'Manos de Jazmín', 'Velas artesanales hechas a mano en Arequipa, con ceras vegetales y aromas naturales.', 'MJ', true, 'lima', '#3A2E28'),
  ('aromas-del-sur', 'Aromas del Sur', 'Difusores y velas inspirados en los paisajes del sur del Perú.', 'AS', true, 'aqua', '#233326'),
  ('ceramica-yura', 'Cerámica Yura', 'Piezas de cerámica utilitaria y decorativa, torneadas a mano en Yura, Arequipa.', 'CY', false, 'oro', '#3A2E1E');

insert into public.products (store_id, name, price, original_price, is_offer, color, description, options)
select id, 'Vela lavanda', 29, 35, true, '#F0997B', 'Vela de cera de soja con aroma a lavanda, hecha a mano. Duración aproximada de 40 horas.', '{"Aroma": ["Lavanda", "Vainilla", "Sándalo"]}'::jsonb
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, color, description)
select id, 'Set aromático x3', 68, '#97C459', 'Set de tres velas mini en aromas variados, ideal para regalo.'
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, color, description)
select id, 'Difusor de caña', 45, '#7C93B8', 'Difusor de varillas con esencia natural. Rinde hasta 2 meses.'
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, color, description)
select id, 'Vela ámbar 300g', 35, '#C98A4B', 'Vela grande de larga duración, aroma amaderado.'
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, original_price, is_offer, color, description)
select id, 'Caja edición otoño', 89, 99, true, '#8C6E4F', 'Edición limitada de temporada: 4 velas en aromas de otoño.'
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, color, description)
select id, 'Vela sándalo 200g', 32, '#A9673E', 'Vela de cera de soja aroma sándalo, hecha a mano. Duración aproximada de 35 horas.'
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, color, description, options, is_customizable, customization_label)
select id, 'Kit de regalo dúo', 55, '#D9A441', 'Dos velas mini + difusor de caña en caja de regalo.', '{"Aroma": ["Vainilla", "Sándalo"]}'::jsonb, true, 'Mensaje para la tarjeta de regalo'
from public.stores where slug = 'manos-de-jazmin';

insert into public.products (store_id, name, price, color, description)
select id, 'Difusor eucalipto', 39, '#4DD9C8', 'Difusor de varillas con esencia de eucalipto. Rinde hasta 2 meses.'
from public.stores where slug = 'aromas-del-sur';

insert into public.products (store_id, name, price, color, description)
select id, 'Vela romero', 32, '#8FB37A', 'Vela de cera de soja con aroma a romero, hecha a mano.'
from public.stores where slug = 'aromas-del-sur';

insert into public.products (store_id, name, price, color, description)
select id, 'Taza artesanal', 24, '#C98A4B', 'Taza de cerámica esmaltada, pieza única torneada a mano.'
from public.stores where slug = 'ceramica-yura';

insert into public.products (store_id, name, price, color, description)
select id, 'Plato decorativo', 42, '#7C93B8', 'Plato decorativo de cerámica, motivos andinos.'
from public.stores where slug = 'ceramica-yura';
