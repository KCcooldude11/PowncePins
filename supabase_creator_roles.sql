-- Link an existing Supabase Auth account to a creator profile.
-- Run once in the Supabase SQL Editor.

alter table public.creators
add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists creators_user_id_unique
on public.creators(user_id)
where user_id is not null;

-- Safe, limited function for the storefront Account menu.
-- It exposes no password hash or private creator fields.
create or replace function public.get_my_creator_profile()
returns table (
  creator_id text,
  name text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.creator_id, c.name
  from public.creators c
  where c.user_id = auth.uid()
  limit 1;
$$;
revoke all on function public.get_my_creator_profile() from public;
grant execute on function public.get_my_creator_profile() to authenticated;

-- Refresh the Supabase API schema cache so the browser can call the RPC immediately.
notify pgrst, 'reload schema';

-- After a user signs up, an admin grants creator status with:
-- update public.creators
-- set user_id = 'SUPABASE_AUTH_USER_UUID'
-- where creator_id = 'kasey';

-- Find a user's Auth UUID in Supabase Dashboard > Authentication > Users,
-- or use the email lookup below from the SQL Editor:
-- select id, email from auth.users where lower(email) = lower('creator@example.com');
