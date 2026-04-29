-- Cup26 Arena - auto-create a public.profiles row on first login.
--
-- Fires once per row inserted into auth.users. Pulls display_name and
-- avatar_url out of Google's OAuth metadata; favorite_team_code stays
-- null because the user picks a team from the profile page later.
--
-- Idempotent: if a profile row somehow already exists for this id
-- (e.g. the trigger was re-run against pre-existing auth.users rows),
-- the existing profile is left untouched.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'Player'
    ),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Auto-provisions a public.profiles row for each new auth.users row. '
  'Runs as SECURITY DEFINER because the auth schema inserts the row before '
  'any app-level session cookie exists.';

-- Trigger lives on auth.users so it fires for every sign-up path
-- (Google OAuth today, magic link / email in the future).
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for auth.users rows that already exist at the moment
-- this migration runs (e.g. users who signed in before the trigger was
-- installed). Idempotent via ON CONFLICT so safe to re-run.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'Player'
  ),
  nullif(u.raw_user_meta_data->>'avatar_url', '')
from auth.users u
on conflict (id) do nothing;
