-- Pownce Pins creator/customer platform schema.
-- Run this after reviewing the existing public schema. This migration is additive
-- and does not drop storefront tables.

create extension if not exists pgcrypto;

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null unique,
  name text not null,
  email text not null unique,
  password_hash text not null,
  royalty_rate numeric(7,4) not null default 0.1500 check (royalty_rate >= 0 and royalty_rate <= 1),
  stripe_connect_account_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_products (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_product_id text not null unique,
  product_title text,
  product_handle text,
  inventory_count integer not null default 0 check (inventory_count >= 0),
  status text not null default 'active',
  last_synced_at timestamptz not null default now()
);

create table if not exists public.creator_drops (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_product_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  is_active boolean not null default true,
  unique (creator_id, shopify_product_id)
);

create table if not exists public.production_updates (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_product_id text not null,
  stage text not null,
  status text not null,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  stripe_payout_id text unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'usd',
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.royalties (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_order_id text not null,
  shopify_product_id text not null,
  units_sold integer not null check (units_sold > 0),
  revenue numeric(12,2) not null check (revenue >= 0),
  royalty_amount numeric(12,2) not null check (royalty_amount >= 0),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (shopify_order_id, shopify_product_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  total_price numeric(12,2),
  status text,
  created_at timestamptz,
  updated_at timestamptz
);

create table if not exists public.customer_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.customer_orders(id) on delete cascade,
  shopify_product_id text,
  quantity integer not null default 1,
  price numeric(12,2)
);

create table if not exists public.cart (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.cart(id) on delete cascade,
  shopify_product_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  added_at timestamptz not null default now(),
  unique (cart_id, shopify_product_id)
);

create index if not exists creator_products_creator_idx on public.creator_products(creator_id);
create index if not exists creator_drops_creator_idx on public.creator_drops(creator_id);
create index if not exists production_updates_creator_idx on public.production_updates(creator_id);
create index if not exists royalties_creator_idx on public.royalties(creator_id);
create index if not exists customer_orders_customer_idx on public.customer_orders(customer_id);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);

alter table public.creators enable row level security;
alter table public.creator_products enable row level security;
alter table public.creator_drops enable row level security;
alter table public.production_updates enable row level security;
alter table public.payouts enable row level security;
alter table public.royalties enable row level security;
alter table public.customers enable row level security;
alter table public.customer_orders enable row level security;
alter table public.customer_order_items enable row level security;
alter table public.cart enable row level security;
alter table public.cart_items enable row level security;

-- Portal tables are written by trusted server routes using the service-role key.
-- Customer reads are limited to the authenticated Supabase user.

drop policy if exists "Customers read own profile" on public.customers;
create policy "Customers read own profile" on public.customers
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Customers read own orders" on public.customer_orders;
create policy "Customers read own orders" on public.customer_orders
  for select to authenticated using (
    exists (
      select 1 from public.customers c
      where c.id = customer_orders.customer_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Customers read own order items" on public.customer_order_items;
create policy "Customers read own order items" on public.customer_order_items
  for select to authenticated using (
    exists (
      select 1 from public.customer_orders o
      join public.customers c on c.id = o.customer_id
      where o.id = customer_order_items.order_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Customers manage own cart" on public.cart;
create policy "Customers manage own cart" on public.cart
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Customers manage own cart items" on public.cart_items;
create policy "Customers manage own cart items" on public.cart_items
  for all to authenticated using (
    exists (select 1 from public.cart c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.cart c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

-- Creator dashboard reads are intentionally server-only until creator auth is
-- migrated to Supabase Auth. The service-role key bypasses RLS on trusted routes.
