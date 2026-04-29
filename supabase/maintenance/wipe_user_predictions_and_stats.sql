-- =============================================================================
-- Wipe ONE account’s predictions + leaderboard row (like a brand-new signup).
-- Run in Supabase → SQL Editor (postgres role).
-- =============================================================================
--
-- ERROR: "No auth.users row for email: …"
--   → That email is not in *this* project’s auth.users. Run STEP 0 below first.
--   → Or you’re in the wrong Supabase project (check .env.local NEXT_PUBLIC_SUPABASE_URL).
--
-- =============================================================================
-- STEP 0 — Find your real id + email (run this first; use a result row in METHOD B).
-- =============================================================================

select id, email, created_at
  from auth.users
 order by created_at desc
 limit 30;

-- If you know part of the address:
-- select id, email from auth.users where email ilike '%gmail%' order by created_at desc;

-- Profiles (same ids as auth.users.id):
-- select id, display_name, favorite_team_code from public.profiles order by id;

-- Who still has leaderboard rows (helps spot your uuid):
-- select s.user_id, s.total_points, u.email
--   from public.user_stats s
--   left join auth.users u on u.id = s.user_id
--  order by s.total_points desc;

-- =============================================================================
-- METHOD A — by email. Replace YOU@EXAMPLE.COM in all three places below.
-- =============================================================================

do $$
declare
  target_email text := 'kaissaljammal@gmail.com';
  uid uuid;
  p_del int;
  s_del int;
begin
  select u.id
    into uid
    from auth.users u
   where lower(u.email) = lower(trim(target_email))
   limit 1;

  if uid is null then
    raise exception 'No auth.users row for email: %. Run STEP 0 and use METHOD B with id from auth.users.',
      target_email;
  end if;

  delete from public.predictions where user_id = uid;
  get diagnostics p_del = row_count;

  delete from public.user_stats where user_id = uid;
  get diagnostics s_del = row_count;

  raise notice 'User % — deleted % prediction row(s), % user_stats row(s).', uid, p_del, s_del;
end $$;

-- =============================================================================
-- VERIFY — same email as METHOD A
-- =============================================================================

select count(*) as prediction_rows_remaining
  from public.predictions p
  join auth.users u on u.id = p.user_id
 where lower(u.email) = lower(trim('kaissaljammal@gmail.com'));

select s.*
  from public.user_stats s
  join auth.users u on u.id = s.user_id
 where lower(u.email) = lower(trim('kaissaljammal@gmail.com'));

-- =============================================================================
-- METHOD B — by uuid from STEP 0 (no email guesswork)
-- =============================================================================
--
-- begin;
-- delete from public.predictions where user_id = 'paste-uuid-here';
-- delete from public.user_stats   where user_id = 'paste-uuid-here';
-- commit;

-- Optional:
-- drop function if exists public.reset_my_scoring_stats();
