-- Authenticated group members can view profiles; each user can create/update only their own.
alter table public.profiles enable row level security;

drop policy if exists profiles_select_members on public.profiles;
create policy profiles_select_members
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
