-- Legacy portal-only migration. The canonical combined schema is now
-- ../supabase_creator_platform.sql at the repository root.
-- Do not run both files; use the root migration for the full website.

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  creator_id text unique not null,
  name text not null,
  email text unique not null,
  password_hash text not null,
  royalty_rate numeric(5,4) not null default 0.1500,
  stripe_connect_account_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_products (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_product_id text unique not null,
  product_title text,
  product_handle text,
  inventory_count integer not null default 0,
  status text not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_drops (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_product_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_active boolean not null default true,
  unique (creator_id, shopify_product_id)
);

create table if not exists public.production_updates (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  shopify_product_id text not null,
  stage text not null,
  status text not null default 'in_progress',
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(creator_id) on delete cascade,
  stripe_payout_id text unique,
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists creator_products_creator_id_idx on public.creator_products(creator_id);
create index if not exists production_updates_creator_id_idx on public.production_updates(creator_id);
create index if not exists creator_payouts_creator_id_idx on public.creator_payouts(creator_id);

alter table public.creators enable row level security;
alter table public.creator_products enable row level security;
alter table public.creator_drops enable row level security;
alter table public.production_updates enable row level security;
alter table public.creator_payouts enable row level security;

-- No client-side policies are added intentionally. Only the server-side
-- Supabase service-role client can read these private portal tables.

-- After generating a bcrypt hash locally, insert a creator like this:
-- insert into public.creators (creator_id, name, email, password_hash, royalty_rate)
-- values ('creator_1001', 'Maya Brooks', 'maya@example.com', '<bcrypt-hash>', 0.1500);
