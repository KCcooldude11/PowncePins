-- Seeds Kasey's Apple Pin v1 project into the existing Supabase tables.
-- Existing storefront product id: p004
-- Safe to run more than once.

alter table public.creator_products
add column if not exists image_url text;

insert into public.creator_products (
  creator_id,
  shopify_product_id,
  product_title,
  product_handle,
  price,
  inventory_count,
  status,
  last_synced_at
)
select
  'kasey',
  'p004',
  'Apple Pin v1',
  'applev1',
  18.00,
  31,
  'active',
  now()
where not exists (
  select 1 from public.creator_products
  where creator_id = 'kasey' and shopify_product_id = 'p004'
);

update public.creator_products
set product_title = 'Apple Pin v1',
    product_handle = 'applev1',
    image_url = 'https://powncepins.netlify.app/assets/pins/apple.png',
    price = 18.00,
    inventory_count = 31,
    status = 'active',
    last_synced_at = now()
where creator_id = 'kasey' and shopify_product_id = 'p004';

/*
on conflict (shopify_product_id) do update set
  creator_id = excluded.creator_id,
  product_title = excluded.product_title,
  product_handle = excluded.product_handle,
  inventory_count = excluded.inventory_count,
  status = excluded.status,
  last_synced_at = now();
*/

insert into public.creator_drops (
  creator_id,
  shopify_product_id,
  start_time,
  end_time,
  is_active
)
select
  'kasey',
  'p004',
  now(),
  now() + interval '24 hours',
  true
where not exists (
  select 1 from public.creator_drops
  where creator_id = 'kasey' and shopify_product_id = 'p004'
);

update public.creator_drops
set start_time = now(),
    end_time = now() + interval '24 hours',
    is_active = true
where creator_id = 'kasey' and shopify_product_id = 'p004';

/*
on conflict (creator_id, shopify_product_id) do update set
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  is_active = true;
*/

insert into public.royalties (
  creator_id,
  shopify_order_id,
  shopify_product_id,
  units_sold,
  revenue,
  royalty_amount,
  status,
  order_created_at
)
select
  'kasey',
  'demo-order-apple-001',
  'p004',
  19,
  342.00,
  51.30,
  'pending',
  now() - interval '7 days'
where not exists (
  select 1 from public.royalties
  where shopify_order_id = 'demo-order-apple-001'
    and shopify_product_id = 'p004'
);

update public.royalties
set units_sold = 19,
    revenue = 342.00,
    royalty_amount = 51.30,
    status = 'pending',
    order_created_at = now() - interval '7 days'
where creator_id = 'kasey'
  and shopify_order_id = 'demo-order-apple-001'
  and shopify_product_id = 'p004';

/*
on conflict (shopify_order_id, shopify_product_id) do update set
  units_sold = excluded.units_sold,
  revenue = excluded.revenue,
  royalty_amount = excluded.royalty_amount,
  status = excluded.status;
*/

select 'creator_products' as source, shopify_product_id, product_title, inventory_count::text, status
from public.creator_products
where creator_id = 'kasey' and shopify_product_id = 'p004'
union all
select 'creator_drops', shopify_product_id, start_time::text, end_time::text, is_active::text
from public.creator_drops
where creator_id = 'kasey' and shopify_product_id = 'p004';
