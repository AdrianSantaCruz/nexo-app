-- Solo lectura — para revisar por qué el cruce tienda/dueño no coincide.
select s.id as store_id, s.slug, s.owner_id, u.email as owner_email
from public.stores s
left join auth.users u on u.id = s.owner_id;
