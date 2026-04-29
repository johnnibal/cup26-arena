-- Cup26 Arena - row level security + prediction kickoff-lock trigger
--
-- This migration enables RLS on every table and installs the BEFORE
-- INSERT/UPDATE trigger on predictions that acts as a second safety layer
-- against post-kickoff writes.
--
-- Role semantics used throughout:
--   - `authenticated` : logged-in user via Supabase JWT. `auth.uid()` returns their id.
--   - `anon`          : not logged in. No policies are granted to anon, so RLS denies by default.
--   - `service_role`  : server-side superuser key. Bypasses RLS. `auth.uid()` is null.
--
-- is_admin() (defined in the initial schema migration) is used by policies
-- to gate admin-only access. It is SECURITY DEFINER and reads admin_users.

-- =====================================================================
-- Enable RLS on every table
-- =====================================================================

alter table public.teams                     enable row level security;
alter table public.matches                   enable row level security;
alter table public.profiles                  enable row level security;
alter table public.predictions               enable row level security;
alter table public.admin_users               enable row level security;
alter table public.match_result_corrections  enable row level security;
alter table public.user_stats                enable row level security;

-- =====================================================================
-- teams
--   Authenticated users can read. Only admins can write.
-- =====================================================================

create policy "teams_select_authenticated"
  on public.teams for select
  to authenticated
  using (true);

create policy "teams_admin_write"
  on public.teams for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- matches
--   Authenticated users can read. Only admins can write.
-- =====================================================================

create policy "matches_select_authenticated"
  on public.matches for select
  to authenticated
  using (true);

create policy "matches_admin_write"
  on public.matches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- profiles
--   Authenticated users can read all profiles (leaderboard needs names + flags).
--   Users can insert/update only their own row. No user-initiated delete.
--   Admins have full access.
-- =====================================================================

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_write"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- predictions
--   Users can read only their own predictions.
--   Users can insert/update only their own predictions, only before kickoff.
--   Admins can read all (for moderation). Admins do NOT rewrite user
--   predictions in normal flow; scoring happens via service_role.
--   Deletes are not allowed from the client.
-- =====================================================================

create policy "predictions_select_own"
  on public.predictions for select
  to authenticated
  using (user_id = auth.uid());

create policy "predictions_select_admin"
  on public.predictions for select
  to authenticated
  using (public.is_admin());

create policy "predictions_insert_own_before_kickoff"
  on public.predictions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and now() < m.kickoff_at
    )
  );

create policy "predictions_update_own_before_kickoff"
  on public.predictions for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and now() < m.kickoff_at
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and now() < m.kickoff_at
    )
  );

-- =====================================================================
-- admin_users
--   Only admins can read or write. Normal users cannot even tell who is admin.
--   (Bootstrap: first admin is inserted via service_role / SQL editor.)
-- =====================================================================

create policy "admin_users_admin_all"
  on public.admin_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- match_result_corrections
--   Admins can read and write. Writes happen via the scoring flow (Step 4),
--   which runs with service_role anyway, so this policy mainly gates admin UI reads.
-- =====================================================================

create policy "match_result_corrections_admin_all"
  on public.match_result_corrections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- user_stats
--   Authenticated users can read (powers the leaderboard).
--   No client-side writes allowed. Scoring/recompute functions run as
--   service_role and bypass RLS. Admins have a manual write path for
--   recovery (e.g. a "recompute all" button).
-- =====================================================================

create policy "user_stats_select_authenticated"
  on public.user_stats for select
  to authenticated
  using (true);

create policy "user_stats_admin_write"
  on public.user_stats for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- enforce_prediction_kickoff_lock()
--   BEFORE INSERT/UPDATE trigger on predictions. Acts as a second safety
--   layer on top of RLS, and additionally prevents users from writing the
--   `points` / `is_exact` columns directly (those belong to the scoring flow).
--
--   Bypass rules:
--     - service_role has `auth.uid() = null` and is trusted; it can write
--       `points` / `is_exact` and is not blocked by kickoff when only those
--       columns change.
--     - On UPDATE, if only `points`, `is_exact`, or `updated_at` changed
--       (i.e. none of the user-facing columns changed), the kickoff check
--       is skipped so the scoring flow succeeds after the match ends.
-- =====================================================================

create or replace function public.enforce_prediction_kickoff_lock()
returns trigger
language plpgsql
as $$
declare
  v_kickoff timestamptz;
  v_user uuid;
begin
  v_user := auth.uid();

  -- Guard: only the scoring flow (service_role, auth.uid() null) may touch
  -- points / is_exact. Any authenticated user attempting to set or change
  -- these columns is rejected.
  if v_user is not null then
    if TG_OP = 'INSERT' then
      if NEW.points is not null or NEW.is_exact is not null then
        raise exception
          'Users cannot set predictions.points or predictions.is_exact'
          using errcode = 'insufficient_privilege';
      end if;
    else  -- UPDATE
      if NEW.points is distinct from OLD.points
        or NEW.is_exact is distinct from OLD.is_exact then
        raise exception
          'Users cannot modify predictions.points or predictions.is_exact'
          using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;

  -- On UPDATE, if none of the user-facing columns changed, skip the kickoff
  -- check. This is the path the scoring flow takes when writing points.
  if TG_OP = 'UPDATE'
    and NEW.home_score = OLD.home_score
    and NEW.away_score = OLD.away_score
    and NEW.match_id   = OLD.match_id
    and NEW.user_id    = OLD.user_id then
    return NEW;
  end if;

  -- Kickoff lock: applies to all INSERTs and to any UPDATE that changes
  -- a user-facing column (score / match / owner).
  select kickoff_at
    into v_kickoff
    from public.matches
   where id = NEW.match_id;

  if v_kickoff is null then
    raise exception 'Prediction references unknown match %', NEW.match_id
      using errcode = 'foreign_key_violation';
  end if;

  if now() >= v_kickoff then
    raise exception
      'Predictions are locked after kickoff for match %', NEW.match_id
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

create trigger predictions_enforce_kickoff_lock
  before insert or update on public.predictions
  for each row execute function public.enforce_prediction_kickoff_lock();
