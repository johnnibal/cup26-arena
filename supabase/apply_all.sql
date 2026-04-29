-- =====================================================================
-- Cup26 Arena - combined migration blob.
-- Generated from supabase/migrations in lexical order.
-- Paste the entire contents of this file into Supabase Dashboard ->
-- SQL Editor -> Run. Re-runnable (all migrations are idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 20260424120000_initial_schema.sql
-- ---------------------------------------------------------------------

-- Cup26 Arena - initial schema
-- Creates every table, index, and trigger used in MVP v1 (group stage).
-- RLS is deferred to the next migration (Step 3).
-- Scoring / stats functions are deferred to Step 4.

create extension if not exists pgcrypto;

-- =====================================================================
-- helper: set_updated_at() - trigger function to maintain updated_at
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- teams - one row per qualified nation
-- =====================================================================

create table public.teams (
  code text primary key
    check (length(code) = 3 and code = upper(code)),
  name text not null unique,
  group_letter text not null
    check (group_letter in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  primary_color text,
  accent_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teams_group_letter_idx on public.teams(group_letter);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- =====================================================================
-- profiles - 1:1 with auth.users
-- Profile auto-creation on signup will be added in Step 5 (auth).
-- =====================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  favorite_team_code text
    references public.teams(code) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_favorite_team_code_idx on public.profiles(favorite_team_code);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- matches - fixtures. MVP only uses stage = 'group'.
-- home_team / away_team nullable so knockout stubs can be inserted later.
-- =====================================================================

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null default 'group'
    check (stage in ('group','r32','r16','qf','sf','final','third_place')),
  group_letter text
    check (
      group_letter is null
      or group_letter in ('A','B','C','D','E','F','G','H','I','J','K','L')
    ),
  home_team text references public.teams(code) on update cascade on delete restrict,
  away_team text references public.teams(code) on update cascade on delete restrict,
  kickoff_at timestamptz not null,
  venue text,
  home_score int check (home_score is null or home_score >= 0),
  away_score int check (away_score is null or away_score >= 0),
  status text not null default 'scheduled'
    check (status in ('scheduled','live','finished','cancelled')),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_teams_distinct
    check (home_team is null or away_team is null or home_team <> away_team),
  constraint matches_scores_paired
    check (
      (home_score is null and away_score is null)
      or (home_score is not null and away_score is not null)
    ),
  constraint matches_finished_requires_scores
    check (
      status <> 'finished'
      or (home_score is not null and away_score is not null)
    ),
  constraint matches_group_stage_requires_group_letter
    check (stage <> 'group' or group_letter is not null)
);

create index matches_kickoff_at_idx on public.matches(kickoff_at);
create index matches_status_idx on public.matches(status);
create index matches_stage_idx on public.matches(stage);
create index matches_group_letter_idx on public.matches(group_letter);
create index matches_home_team_idx on public.matches(home_team);
create index matches_away_team_idx on public.matches(away_team);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- =====================================================================
-- predictions - one per (user, match).
-- points / is_exact are null until the match is finalized (Step 4).
-- Kickoff lock is enforced via RLS in Step 3.
-- =====================================================================

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score int not null check (home_score >= 0),
  away_score int not null check (away_score >= 0),
  points int check (points is null or points >= 0),
  is_exact boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id),
  constraint predictions_scored_consistency
    check (
      (points is null and is_exact is null)
      or (points is not null and is_exact is not null)
    )
);

create index predictions_match_id_idx on public.predictions(match_id);
create index predictions_user_id_idx on public.predictions(user_id);

create trigger predictions_set_updated_at
  before update on public.predictions
  for each row execute function public.set_updated_at();

-- =====================================================================
-- admin_users - explicit admin allow-list.
-- Managed manually via SQL / Supabase dashboard. Never exposed to clients.
-- =====================================================================

create table public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- is_admin() - used by RLS policies (Step 3) and server-side guards.
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- =====================================================================
-- match_result_corrections - audit log for admin result entries.
-- First-time result entry: previous_* are null, new_* are the entered score.
-- Subsequent corrections: previous_* captures what was there before.
-- =====================================================================

create table public.match_result_corrections (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  previous_home_score int check (previous_home_score is null or previous_home_score >= 0),
  previous_away_score int check (previous_away_score is null or previous_away_score >= 0),
  new_home_score int not null check (new_home_score >= 0),
  new_away_score int not null check (new_away_score >= 0),
  reason text,
  corrected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint match_result_corrections_previous_paired
    check (
      (previous_home_score is null and previous_away_score is null)
      or (previous_home_score is not null and previous_away_score is not null)
    )
);

create index match_result_corrections_match_id_idx
  on public.match_result_corrections(match_id);

create index match_result_corrections_created_at_idx
  on public.match_result_corrections(created_at desc);

-- =====================================================================
-- user_stats - denormalized leaderboard row per user.
-- Maintained by recompute function (Step 4). Never written to directly by clients.
-- =====================================================================

create table public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_points int not null default 0 check (total_points >= 0),
  exact_count int not null default 0 check (exact_count >= 0),
  correct_result_count int not null default 0 check (correct_result_count >= 0),
  predictions_made int not null default 0 check (predictions_made >= 0),
  current_streak int not null default 0 check (current_streak >= 0),
  best_streak int not null default 0 check (best_streak >= 0),
  updated_at timestamptz not null default now(),
  constraint user_stats_best_ge_current check (best_streak >= current_streak)
);

-- Composite index matches the leaderboard tie-break order:
-- total_points desc, exact_count desc, correct_result_count desc, predictions_made desc.
create index user_stats_leaderboard_idx
  on public.user_stats(
    total_points desc,
    exact_count desc,
    correct_result_count desc,
    predictions_made desc
  );


-- ---------------------------------------------------------------------
-- 20260424120100_seed_teams.sql
-- ---------------------------------------------------------------------

-- Cup26 Arena - seed teams
-- 48 qualified nations, exactly the teams that appear in the group-stage fixtures.
-- Codes follow FIFA 3-letter conventions.
-- primary_color / accent_color are left null for now; populated in Step 5 (flag theming).

insert into public.teams (code, name, group_letter) values
  -- Group A
  ('MEX', 'Mexico',                 'A'),
  ('RSA', 'South Africa',           'A'),
  ('KOR', 'Korea Republic',         'A'),
  ('CZE', 'Czechia',                'A'),

  -- Group B
  ('CAN', 'Canada',                 'B'),
  ('BIH', 'Bosnia and Herzegovina', 'B'),
  ('QAT', 'Qatar',                  'B'),
  ('SUI', 'Switzerland',            'B'),

  -- Group C
  ('HAI', 'Haiti',                  'C'),
  ('SCO', 'Scotland',               'C'),
  ('BRA', 'Brazil',                 'C'),
  ('MAR', 'Morocco',                'C'),

  -- Group D
  ('USA', 'USA',                    'D'),
  ('PAR', 'Paraguay',               'D'),
  ('AUS', 'Australia',              'D'),
  ('TUR', 'TÃ¼rkiye',                'D'),

  -- Group E
  ('CIV', 'CÃ´te d''Ivoire',         'E'),
  ('ECU', 'Ecuador',                'E'),
  ('GER', 'Germany',                'E'),
  ('CUW', 'CuraÃ§ao',                'E'),

  -- Group F
  ('NED', 'Netherlands',            'F'),
  ('JPN', 'Japan',                  'F'),
  ('SWE', 'Sweden',                 'F'),
  ('TUN', 'Tunisia',                'F'),

  -- Group G
  ('IRN', 'IR Iran',                'G'),
  ('NZL', 'New Zealand',            'G'),
  ('BEL', 'Belgium',                'G'),
  ('EGY', 'Egypt',                  'G'),

  -- Group H
  ('KSA', 'Saudi Arabia',           'H'),
  ('URU', 'Uruguay',                'H'),
  ('ESP', 'Spain',                  'H'),
  ('CPV', 'Cabo Verde',             'H'),

  -- Group I
  ('FRA', 'France',                 'I'),
  ('SEN', 'Senegal',                'I'),
  ('IRQ', 'Iraq',                   'I'),
  ('NOR', 'Norway',                 'I'),

  -- Group J
  ('ARG', 'Argentina',              'J'),
  ('ALG', 'Algeria',                'J'),
  ('AUT', 'Austria',                'J'),
  ('JOR', 'Jordan',                 'J'),

  -- Group K
  ('POR', 'Portugal',               'K'),
  ('COD', 'Congo DR',               'K'),
  ('UZB', 'Uzbekistan',             'K'),
  ('COL', 'Colombia',               'K'),

  -- Group L
  ('GHA', 'Ghana',                  'L'),
  ('PAN', 'Panama',                 'L'),
  ('ENG', 'England',                'L'),
  ('CRO', 'Croatia',                'L')
on conflict (code) do nothing;


-- ---------------------------------------------------------------------
-- 20260424120200_seed_matches.sql
-- ---------------------------------------------------------------------

-- Cup26 Arena - seed group-stage matches
-- 72 fixtures in kickoff order. Each DATE + TIME is a Germany (Europe/Berlin) wall-clock
-- value, converted to timestamptz via AT TIME ZONE 'Europe/Berlin'.

insert into public.matches (stage, group_letter, home_team, away_team, kickoff_at, venue) values
  ('group', 'A', 'MEX', 'RSA', (timestamp '2026-06-11 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Mexico City, Mexico'),
  ('group', 'A', 'KOR', 'CZE', (timestamp '2026-06-12 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Zapopan, Mexico'),
  ('group', 'B', 'CAN', 'BIH', (timestamp '2026-06-12 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Toronto, Canada'),
  ('group', 'D', 'USA', 'PAR', (timestamp '2026-06-13 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Los Angeles, USA'),
  ('group', 'B', 'QAT', 'SUI', (timestamp '2026-06-13 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Santa Clara, USA'),
  ('group', 'C', 'BRA', 'MAR', (timestamp '2026-06-14 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'New Jersey, USA'),
  ('group', 'C', 'HAI', 'SCO', (timestamp '2026-06-14 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Foxborough, USA'),
  ('group', 'D', 'AUS', 'TUR', (timestamp '2026-06-14 06:00:00' AT TIME ZONE 'Europe/Berlin'), 'Vancouver, Canada'),
  ('group', 'E', 'GER', 'CUW', (timestamp '2026-06-14 19:00:00' AT TIME ZONE 'Europe/Berlin'), 'Houston, USA'),
  ('group', 'F', 'NED', 'JPN', (timestamp '2026-06-14 22:00:00' AT TIME ZONE 'Europe/Berlin'), 'Arlington, USA'),
  ('group', 'E', 'CIV', 'ECU', (timestamp '2026-06-15 01:00:00' AT TIME ZONE 'Europe/Berlin'), 'Philadelphia, USA'),
  ('group', 'F', 'SWE', 'TUN', (timestamp '2026-06-15 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Guadalupe, Mexico'),
  ('group', 'H', 'ESP', 'CPV', (timestamp '2026-06-15 18:00:00' AT TIME ZONE 'Europe/Berlin'), 'Atlanta, USA'),
  ('group', 'G', 'BEL', 'EGY', (timestamp '2026-06-15 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Seattle, USA'),
  ('group', 'H', 'KSA', 'URU', (timestamp '2026-06-16 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Miami, USA'),
  ('group', 'G', 'IRN', 'NZL', (timestamp '2026-06-16 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Los Angeles, USA'),
  ('group', 'I', 'FRA', 'SEN', (timestamp '2026-06-16 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'New Jersey, USA'),
  ('group', 'I', 'IRQ', 'NOR', (timestamp '2026-06-17 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Foxborough, USA'),
  ('group', 'J', 'ARG', 'ALG', (timestamp '2026-06-17 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Kansas City, USA'),
  ('group', 'J', 'AUT', 'JOR', (timestamp '2026-06-17 06:00:00' AT TIME ZONE 'Europe/Berlin'), 'Santa Clara, USA'),
  ('group', 'K', 'POR', 'COD', (timestamp '2026-06-17 19:00:00' AT TIME ZONE 'Europe/Berlin'), 'Houston, USA'),
  ('group', 'L', 'ENG', 'CRO', (timestamp '2026-06-17 22:00:00' AT TIME ZONE 'Europe/Berlin'), 'Arlington, USA'),
  ('group', 'L', 'GHA', 'PAN', (timestamp '2026-06-18 01:00:00' AT TIME ZONE 'Europe/Berlin'), 'Toronto, Canada'),
  ('group', 'K', 'UZB', 'COL', (timestamp '2026-06-18 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Mexico City, Mexico'),
  ('group', 'A', 'CZE', 'RSA', (timestamp '2026-06-18 18:00:00' AT TIME ZONE 'Europe/Berlin'), 'Atlanta, USA'),
  ('group', 'B', 'SUI', 'BIH', (timestamp '2026-06-18 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Los Angeles, USA'),
  ('group', 'B', 'CAN', 'QAT', (timestamp '2026-06-19 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Vancouver, Canada'),
  ('group', 'A', 'MEX', 'KOR', (timestamp '2026-06-19 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Zapopan, Mexico'),
  ('group', 'D', 'USA', 'AUS', (timestamp '2026-06-19 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Seattle, USA'),
  ('group', 'C', 'SCO', 'MAR', (timestamp '2026-06-20 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Foxborough, USA'),
  ('group', 'C', 'BRA', 'HAI', (timestamp '2026-06-20 02:30:00' AT TIME ZONE 'Europe/Berlin'), 'Philadelphia, USA'),
  ('group', 'D', 'TUR', 'PAR', (timestamp '2026-06-20 05:00:00' AT TIME ZONE 'Europe/Berlin'), 'Santa Clara, USA'),
  ('group', 'F', 'NED', 'SWE', (timestamp '2026-06-20 19:00:00' AT TIME ZONE 'Europe/Berlin'), 'Houston, USA'),
  ('group', 'E', 'GER', 'CIV', (timestamp '2026-06-20 22:00:00' AT TIME ZONE 'Europe/Berlin'), 'Toronto, Canada'),
  ('group', 'E', 'ECU', 'CUW', (timestamp '2026-06-21 02:00:00' AT TIME ZONE 'Europe/Berlin'), 'Kansas City, USA'),
  ('group', 'F', 'TUN', 'JPN', (timestamp '2026-06-21 06:00:00' AT TIME ZONE 'Europe/Berlin'), 'Guadalupe, Mexico'),
  ('group', 'H', 'ESP', 'KSA', (timestamp '2026-06-21 18:00:00' AT TIME ZONE 'Europe/Berlin'), 'Atlanta, USA'),
  ('group', 'G', 'BEL', 'IRN', (timestamp '2026-06-21 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Los Angeles, USA'),
  ('group', 'H', 'URU', 'CPV', (timestamp '2026-06-22 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Miami, USA'),
  ('group', 'G', 'NZL', 'EGY', (timestamp '2026-06-22 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Vancouver, Canada'),
  ('group', 'J', 'ARG', 'AUT', (timestamp '2026-06-22 19:00:00' AT TIME ZONE 'Europe/Berlin'), 'Arlington, USA'),
  ('group', 'I', 'FRA', 'IRQ', (timestamp '2026-06-22 23:00:00' AT TIME ZONE 'Europe/Berlin'), 'Philadelphia, USA'),
  ('group', 'I', 'NOR', 'SEN', (timestamp '2026-06-23 02:00:00' AT TIME ZONE 'Europe/Berlin'), 'Toronto, Canada'),
  ('group', 'J', 'JOR', 'ALG', (timestamp '2026-06-23 05:00:00' AT TIME ZONE 'Europe/Berlin'), 'Santa Clara, USA'),
  ('group', 'K', 'POR', 'UZB', (timestamp '2026-06-23 19:00:00' AT TIME ZONE 'Europe/Berlin'), 'Houston, USA'),
  ('group', 'L', 'ENG', 'GHA', (timestamp '2026-06-23 22:00:00' AT TIME ZONE 'Europe/Berlin'), 'Foxborough, USA'),
  ('group', 'L', 'PAN', 'CRO', (timestamp '2026-06-24 01:00:00' AT TIME ZONE 'Europe/Berlin'), 'Foxborough, USA'),
  ('group', 'K', 'COL', 'COD', (timestamp '2026-06-24 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Zapopan, Mexico'),
  ('group', 'B', 'SUI', 'CAN', (timestamp '2026-06-24 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Vancouver, Canada'),
  ('group', 'B', 'BIH', 'QAT', (timestamp '2026-06-24 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Seattle, USA'),
  ('group', 'C', 'MAR', 'HAI', (timestamp '2026-06-25 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Atlanta, USA'),
  ('group', 'C', 'SCO', 'BRA', (timestamp '2026-06-25 00:00:00' AT TIME ZONE 'Europe/Berlin'), 'Miami, USA'),
  ('group', 'A', 'RSA', 'KOR', (timestamp '2026-06-25 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Guadalupe, Mexico'),
  ('group', 'A', 'CZE', 'MEX', (timestamp '2026-06-25 03:00:00' AT TIME ZONE 'Europe/Berlin'), 'Mexico City, Mexico'),
  ('group', 'E', 'CUW', 'CIV', (timestamp '2026-06-25 22:00:00' AT TIME ZONE 'Europe/Berlin'), 'Philadelphia, USA'),
  ('group', 'E', 'ECU', 'GER', (timestamp '2026-06-25 22:00:00' AT TIME ZONE 'Europe/Berlin'), 'New Jersey, USA'),
  ('group', 'F', 'TUN', 'NED', (timestamp '2026-06-26 01:00:00' AT TIME ZONE 'Europe/Berlin'), 'Kansas City, USA'),
  ('group', 'F', 'JPN', 'SWE', (timestamp '2026-06-26 01:00:00' AT TIME ZONE 'Europe/Berlin'), 'Arlington, USA'),
  ('group', 'D', 'TUR', 'USA', (timestamp '2026-06-26 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Los Angeles, USA'),
  ('group', 'D', 'PAR', 'AUS', (timestamp '2026-06-26 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Santa Clara, USA'),
  ('group', 'I', 'NOR', 'FRA', (timestamp '2026-06-26 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Foxborough, USA'),
  ('group', 'I', 'SEN', 'IRQ', (timestamp '2026-06-26 21:00:00' AT TIME ZONE 'Europe/Berlin'), 'Toronto, Canada'),
  ('group', 'H', 'CPV', 'KSA', (timestamp '2026-06-27 02:00:00' AT TIME ZONE 'Europe/Berlin'), 'Houston, USA'),
  ('group', 'H', 'URU', 'ESP', (timestamp '2026-06-27 02:00:00' AT TIME ZONE 'Europe/Berlin'), 'Zapopan, Mexico'),
  ('group', 'G', 'NZL', 'BEL', (timestamp '2026-06-27 05:00:00' AT TIME ZONE 'Europe/Berlin'), 'Vancouver, Canada'),
  ('group', 'G', 'EGY', 'IRN', (timestamp '2026-06-27 05:00:00' AT TIME ZONE 'Europe/Berlin'), 'Seattle, USA'),
  ('group', 'L', 'PAN', 'ENG', (timestamp '2026-06-27 23:00:00' AT TIME ZONE 'Europe/Berlin'), 'New Jersey, USA'),
  ('group', 'L', 'CRO', 'GHA', (timestamp '2026-06-27 23:00:00' AT TIME ZONE 'Europe/Berlin'), 'Philadelphia, USA'),
  ('group', 'K', 'COL', 'POR', (timestamp '2026-06-28 01:30:00' AT TIME ZONE 'Europe/Berlin'), 'Miami, USA'),
  ('group', 'K', 'COD', 'UZB', (timestamp '2026-06-28 01:30:00' AT TIME ZONE 'Europe/Berlin'), 'Atlanta, USA'),
  ('group', 'J', 'ALG', 'AUT', (timestamp '2026-06-28 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Kansas City, USA'),
  ('group', 'J', 'JOR', 'ARG', (timestamp '2026-06-28 04:00:00' AT TIME ZONE 'Europe/Berlin'), 'Arlington, USA');


-- ---------------------------------------------------------------------
-- 20260424120300_rls_and_locks.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
-- 20260424120400_scoring_functions.sql
-- ---------------------------------------------------------------------

-- Cup26 Arena - scoring, stats, and correction functions
--
-- This migration installs the Postgres functions that:
--   1. classify a match outcome
--   2. compute points for a single prediction vs. a final score
--   3. fully recompute a single user's aggregated stats (leaderboard row)
--   4. score every prediction for a finished match
--   5. orchestrate an admin-driven result entry or correction
--
-- Scoring rules (MVP v1):
--   exact score  -> 3 points, is_exact = true
--   correct winner / correct draw only -> 1 point, is_exact = false
--   otherwise -> 0 points, is_exact = false
--
-- Everything runs transactionally: apply_match_correction is a single
-- function invocation, so either every step succeeds or everything
-- rolls back together.

-- =====================================================================
-- Update the kickoff-lock trigger: trust elevated roles only.
--
-- Background: the Step 3 trigger blocked ALL authenticated writes to
-- predictions.points / is_exact. That also blocked apply_match_correction,
-- because inside a SECURITY DEFINER function auth.uid() still reflects
-- the authenticated caller.
--
-- Fix: let writes through only when current_user is a privileged Postgres
-- role. Inside a SECURITY DEFINER function owned by `postgres`, current_user
-- is `postgres`; direct service_role connections have current_user =
-- `service_role`. Regular PostgREST requests from the app have
-- current_user = `authenticated` or `anon` and remain fully locked down.
--
-- This uses the Postgres role system as the trust boundary instead of a
-- session GUC (which would be spoofable by any session).
-- =====================================================================

create or replace function public.enforce_prediction_kickoff_lock()
returns trigger
language plpgsql
as $$
declare
  v_kickoff timestamptz;
  v_user uuid;
begin
  -- Trusted roles bypass the trigger entirely:
  --   postgres / supabase_admin : migrations and SECURITY DEFINER scoring
  --   service_role              : server-side code using the service key
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return NEW;
  end if;

  v_user := auth.uid();

  -- Below this line the caller is `authenticated` (or `anon`, which has
  -- no table grants). They may never write points / is_exact directly.
  if v_user is not null then
    if TG_OP = 'INSERT' then
      if NEW.points is not null or NEW.is_exact is not null then
        raise exception
          'predictions.points and predictions.is_exact are set by the scoring flow only'
          using errcode = 'insufficient_privilege';
      end if;
    else  -- UPDATE
      if NEW.points is distinct from OLD.points
        or NEW.is_exact is distinct from OLD.is_exact then
        raise exception
          'predictions.points and predictions.is_exact are set by the scoring flow only'
          using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;

  -- On UPDATE, if only non-lockable columns changed, skip the kickoff check.
  if TG_OP = 'UPDATE'
    and NEW.home_score = OLD.home_score
    and NEW.away_score = OLD.away_score
    and NEW.match_id   = OLD.match_id
    and NEW.user_id    = OLD.user_id then
    return NEW;
  end if;

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

-- =====================================================================
-- 1. get_match_outcome(home_score, away_score) -> 'home' | 'away' | 'draw' | null
-- =====================================================================

create or replace function public.get_match_outcome(
  home_score int,
  away_score int
)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when home_score is null or away_score is null then null
    when home_score > away_score then 'home'
    when home_score < away_score then 'away'
    else 'draw'
  end;
$$;

comment on function public.get_match_outcome(int, int) is
  'Returns the outcome of a match from the home team''s perspective. '
  'Returns null when either score is null.';

-- =====================================================================
-- 2. calculate_prediction_points(pred_home, pred_away, real_home, real_away)
--    -> (points int, is_exact boolean)
-- =====================================================================

create or replace function public.calculate_prediction_points(
  pred_home int,
  pred_away int,
  real_home int,
  real_away int,
  out points int,
  out is_exact boolean
)
language plpgsql
immutable
parallel safe
as $$
begin
  if pred_home is null or pred_away is null
    or real_home is null or real_away is null then
    points := 0;
    is_exact := false;
    return;
  end if;

  if pred_home = real_home and pred_away = real_away then
    points := 3;
    is_exact := true;
    return;
  end if;

  if public.get_match_outcome(pred_home, pred_away)
     = public.get_match_outcome(real_home, real_away) then
    points := 1;
    is_exact := false;
    return;
  end if;

  points := 0;
  is_exact := false;
end;
$$;

comment on function public.calculate_prediction_points(int, int, int, int) is
  'Scores a prediction against a final result: 3 for exact, 1 for correct outcome only, 0 otherwise.';

-- =====================================================================
-- 3. recompute_user_stats(target_user_id) -> void
--
-- Full, deterministic rebuild of one row in user_stats from predictions +
-- matches. Idempotent - safe to run any number of times.
--
-- predictions_made:    count of every prediction the user has submitted
--                      (regardless of match status).
-- total_points, exact_count, correct_result_count:
--                      aggregated over finished matches only.
-- current_streak:      trailing run of consecutive finished predictions
--                      (ordered by kickoff_at asc) with points > 0.
-- best_streak:         max such run observed in the sequence so far.
-- =====================================================================

create or replace function public.recompute_user_stats(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_points int := 0;
  v_exact_count int := 0;
  v_correct_count int := 0;
  v_predictions_made int := 0;
  v_current_streak int := 0;
  v_best_streak int := 0;
  v_running int := 0;
  rec record;
begin
  if target_user_id is null then
    raise exception 'recompute_user_stats: target_user_id is null';
  end if;

  select count(*)
    into v_predictions_made
    from public.predictions
   where user_id = target_user_id;

  for rec in
    select p.points, p.is_exact
      from public.predictions p
      join public.matches m on m.id = p.match_id
     where p.user_id = target_user_id
       and m.status = 'finished'
       and p.points is not null
     order by m.kickoff_at asc, m.id asc
  loop
    v_total_points := v_total_points + rec.points;

    if rec.is_exact then
      v_exact_count := v_exact_count + 1;
    elsif rec.points = 1 then
      v_correct_count := v_correct_count + 1;
    end if;

    if rec.points > 0 then
      v_running := v_running + 1;
      if v_running > v_best_streak then
        v_best_streak := v_running;
      end if;
    else
      v_running := 0;
    end if;
  end loop;

  v_current_streak := v_running;

  insert into public.user_stats (
    user_id,
    total_points,
    exact_count,
    correct_result_count,
    predictions_made,
    current_streak,
    best_streak,
    updated_at
  ) values (
    target_user_id,
    v_total_points,
    v_exact_count,
    v_correct_count,
    v_predictions_made,
    v_current_streak,
    v_best_streak,
    now()
  )
  on conflict (user_id) do update set
    total_points         = excluded.total_points,
    exact_count          = excluded.exact_count,
    correct_result_count = excluded.correct_result_count,
    predictions_made     = excluded.predictions_made,
    current_streak       = excluded.current_streak,
    best_streak          = excluded.best_streak,
    updated_at           = now();
end;
$$;

comment on function public.recompute_user_stats(uuid) is
  'Rebuilds user_stats for one user from predictions + matches. Idempotent.';

-- =====================================================================
-- 4. score_match(target_match_id) -> int
--
-- Writes points / is_exact on every prediction for a finished match.
-- Runs as SECURITY DEFINER owned by postgres, so current_user inside is
-- `postgres` and the kickoff-lock trigger's role-based bypass permits
-- the update. Returns the number of predictions rescored.
--
-- Requires the match to exist with status = 'finished' and non-null scores.
-- Safe to re-run: always rewrites to the currently stored final score.
-- =====================================================================

create or replace function public.score_match(target_match_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home int;
  v_away int;
  v_status text;
  v_updated int;
begin
  if target_match_id is null then
    raise exception 'score_match: target_match_id is null';
  end if;

  -- Lock the match row so concurrent corrections can't race.
  select home_score, away_score, status
    into v_home, v_away, v_status
    from public.matches
   where id = target_match_id
   for update;

  if not found then
    raise exception 'Match % not found', target_match_id
      using errcode = 'foreign_key_violation';
  end if;

  if v_status <> 'finished' then
    raise exception 'Cannot score match % in status %', target_match_id, v_status
      using errcode = 'check_violation';
  end if;

  if v_home is null or v_away is null then
    raise exception 'Match % has no final score', target_match_id
      using errcode = 'check_violation';
  end if;

  update public.predictions p
     set points = case
           when p.home_score = v_home and p.away_score = v_away then 3
           when public.get_match_outcome(p.home_score, p.away_score)
                = public.get_match_outcome(v_home, v_away) then 1
           else 0
         end,
         is_exact = (p.home_score = v_home and p.away_score = v_away),
         updated_at = now()
   where p.match_id = target_match_id;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

comment on function public.score_match(uuid) is
  'Applies scoring rules to every prediction for a finished match. Returns row count.';

-- =====================================================================
-- 5. apply_match_correction(target_match_id, new_home_score, new_away_score, reason)
--    -> uuid of the match_result_corrections row
--
-- The single entry point admins use to enter or correct a final score.
-- Runs entirely inside one transaction:
--   1. require admin (auth.uid() must be in admin_users)
--   2. lock the match row
--   3. write an audit row capturing old + new scores, reason, corrected_by
--   4. update matches: set scores, status = 'finished', finalized_at
--   5. call score_match to rescore every prediction
--   6. call recompute_user_stats for every user who predicted this match
--
-- If any step fails, everything rolls back including the audit row.
-- =====================================================================

create or replace function public.apply_match_correction(
  target_match_id uuid,
  new_home_score int,
  new_away_score int,
  reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev_home int;
  v_prev_away int;
  v_caller uuid;
  v_correction_id uuid;
  u_id uuid;
begin
  if target_match_id is null then
    raise exception 'apply_match_correction: target_match_id is null';
  end if;

  if new_home_score is null or new_away_score is null then
    raise exception 'apply_match_correction: scores must not be null'
      using errcode = 'check_violation';
  end if;

  if new_home_score < 0 or new_away_score < 0 then
    raise exception 'apply_match_correction: scores must be non-negative'
      using errcode = 'check_violation';
  end if;

  v_caller := auth.uid();

  if not coalesce(public.is_admin(), false) then
    raise exception 'Only admins can apply match corrections'
      using errcode = 'insufficient_privilege';
  end if;

  -- Lock the match row so two concurrent corrections don't interleave.
  select home_score, away_score
    into v_prev_home, v_prev_away
    from public.matches
   where id = target_match_id
   for update;

  if not found then
    raise exception 'Match % not found', target_match_id
      using errcode = 'foreign_key_violation';
  end if;

  -- Audit log: captures the state before the update. Both previous_* are
  -- null on the first entry; subsequent corrections record the prior score.
  insert into public.match_result_corrections (
    match_id,
    previous_home_score,
    previous_away_score,
    new_home_score,
    new_away_score,
    reason,
    corrected_by
  ) values (
    target_match_id,
    v_prev_home,
    v_prev_away,
    new_home_score,
    new_away_score,
    reason,
    v_caller
  )
  returning id into v_correction_id;

  update public.matches
     set home_score   = new_home_score,
         away_score   = new_away_score,
         status       = 'finished',
         finalized_at = coalesce(finalized_at, now()),
         updated_at   = now()
   where id = target_match_id;

  perform public.score_match(target_match_id);

  -- Recompute stats for every user who predicted this match.
  for u_id in
    select distinct user_id
      from public.predictions
     where match_id = target_match_id
  loop
    perform public.recompute_user_stats(u_id);
  end loop;

  return v_correction_id;
end;
$$;

comment on function public.apply_match_correction(uuid, int, int, text) is
  'Admin entry point: audits, applies a final score, rescores predictions, and recomputes affected user_stats.';

-- =====================================================================
-- Grants
-- =====================================================================

-- Pure, stateless helpers: safe for any authenticated client to call.
grant execute on function public.get_match_outcome(int, int) to authenticated;
grant execute on function public.calculate_prediction_points(int, int, int, int) to authenticated;

-- Internal primitives: not callable by clients. apply_match_correction
-- (SECURITY DEFINER, owned by postgres) can still call them because the
-- function owner is a superuser and grants don't apply to it.
revoke all on function public.score_match(uuid) from public, anon, authenticated;
revoke all on function public.recompute_user_stats(uuid) from public, anon, authenticated;

-- Orchestrator: any authenticated user may invoke, internal is_admin() check decides.
revoke all on function public.apply_match_correction(uuid, int, int, text) from public, anon;
grant  execute on function public.apply_match_correction(uuid, int, int, text) to authenticated;


-- ---------------------------------------------------------------------
-- 20260424120500_profile_auto_create.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
-- 20260424120600_seed_team_colors.sql
-- ---------------------------------------------------------------------

-- Cup26 Arena - seed primary_color / accent_color for all 48 teams.
--
-- Single UPDATE using a VALUES table - idempotent; safe to re-run.
-- Colors are approximations of the dominant + secondary flag colors,
-- chosen to give reasonable contrast when used as CSS variables in UI.
-- primary_color is used for backgrounds / accents, accent_color for
-- borders / highlights. The theming layer computes ink contrast.

update public.teams as t
set
  primary_color = c.primary_color,
  accent_color  = c.accent_color
from (values
  -- Group A
  ('MEX', '#006847', '#CE1126'),
  ('RSA', '#007A4D', '#FCB514'),
  ('KOR', '#003478', '#C8102E'),
  ('CZE', '#11457E', '#D7141A'),

  -- Group B
  ('CAN', '#D52B1E', '#0B0B0B'),
  ('BIH', '#002395', '#FECB00'),
  ('QAT', '#8A1538', '#1F1F1F'),
  ('SUI', '#DA291C', '#0B0B0B'),

  -- Group C
  ('HAI', '#00209F', '#D21034'),
  ('SCO', '#0065BD', '#000066'),
  ('BRA', '#009C3B', '#FFDF00'),
  ('MAR', '#C1272D', '#006233'),

  -- Group D
  ('USA', '#3C3B6E', '#B22234'),
  ('PAR', '#D52B1C', '#0038A8'),
  ('AUS', '#012169', '#E4002B'),
  ('TUR', '#E30A17', '#0B0B0B'),

  -- Group E
  ('CIV', '#FF9A1F', '#00923F'),
  ('ECU', '#FFDD00', '#034EA2'),
  ('GER', '#0B0B0B', '#DD0000'),
  ('CUW', '#002868', '#F9E814'),

  -- Group F
  ('NED', '#AE1C28', '#21468B'),
  ('JPN', '#BC002D', '#0B0B0B'),
  ('SWE', '#006AA7', '#FECC00'),
  ('TUN', '#E70013', '#0B0B0B'),

  -- Group G
  ('IRN', '#239F40', '#DA0000'),
  ('NZL', '#00247D', '#CC142B'),
  ('BEL', '#0B0B0B', '#FAE042'),
  ('EGY', '#CE1126', '#0B0B0B'),

  -- Group H
  ('KSA', '#006C35', '#FFC72C'),
  ('URU', '#0038A8', '#FCD116'),
  ('ESP', '#AA151B', '#F1BF00'),
  ('CPV', '#003893', '#CF2027'),

  -- Group I
  ('FRA', '#002395', '#ED2939'),
  ('SEN', '#00853F', '#FDEF42'),
  ('IRQ', '#CE1126', '#0B0B0B'),
  ('NOR', '#BA0C2F', '#00205B'),

  -- Group J
  ('ARG', '#75AADB', '#F4B641'),
  ('ALG', '#006633', '#D21034'),
  ('AUT', '#ED2939', '#0B0B0B'),
  ('JOR', '#0B0B0B', '#CE1126'),

  -- Group K
  ('POR', '#046A38', '#DA291C'),
  ('COD', '#007FFF', '#F7D618'),
  ('UZB', '#1EB53A', '#0099B5'),
  ('COL', '#FCD116', '#003893'),

  -- Group L
  ('GHA', '#006B3F', '#FCD116'),
  ('PAN', '#005293', '#D21034'),
  ('ENG', '#0B1B3A', '#CE1124'),
  ('CRO', '#002D72', '#C8102E')
) as c(code, primary_color, accent_color)
where t.code = c.code;


-- ---------------------------------------------------------------------
-- 20260424120700_seed_team_iso2.sql
-- ---------------------------------------------------------------------

-- Cup26 Arena - seed ISO 3166-1 alpha-2 codes for every team.
-- Used to fetch circular flag SVGs from HatScripts/circle-flags via CDN.
-- Non-standard entries:
--   SCO -> gb-sct (Scotland)
--   ENG -> gb-eng (England)
-- All other codes are the canonical lowercase ISO alpha-2.

alter table public.teams
  add column if not exists iso2_code text;

-- Lightweight shape check: 2-letter ISO OR hyphenated GB subdivision.
alter table public.teams
  drop constraint if exists teams_iso2_code_format_chk;
alter table public.teams
  add constraint teams_iso2_code_format_chk
  check (
    iso2_code is null
    or iso2_code ~ '^[a-z]{2}$'
    or iso2_code ~ '^gb-[a-z]{3}$'
  );

update public.teams t
set iso2_code = v.iso2
from (values
  -- Group A
  ('MEX', 'mx'),
  ('RSA', 'za'),
  ('KOR', 'kr'),
  ('CZE', 'cz'),
  -- Group B
  ('CAN', 'ca'),
  ('BIH', 'ba'),
  ('QAT', 'qa'),
  ('SUI', 'ch'),
  -- Group C
  ('HAI', 'ht'),
  ('SCO', 'gb-sct'),
  ('BRA', 'br'),
  ('MAR', 'ma'),
  -- Group D
  ('USA', 'us'),
  ('PAR', 'py'),
  ('AUS', 'au'),
  ('TUR', 'tr'),
  -- Group E
  ('CIV', 'ci'),
  ('ECU', 'ec'),
  ('GER', 'de'),
  ('CUW', 'cw'),
  -- Group F
  ('NED', 'nl'),
  ('JPN', 'jp'),
  ('SWE', 'se'),
  ('TUN', 'tn'),
  -- Group G
  ('IRN', 'ir'),
  ('NZL', 'nz'),
  ('BEL', 'be'),
  ('EGY', 'eg'),
  -- Group H
  ('KSA', 'sa'),
  ('URU', 'uy'),
  ('ESP', 'es'),
  ('CPV', 'cv'),
  -- Group I
  ('FRA', 'fr'),
  ('SEN', 'sn'),
  ('IRQ', 'iq'),
  ('NOR', 'no'),
  -- Group J
  ('ARG', 'ar'),
  ('ALG', 'dz'),
  ('AUT', 'at'),
  ('JOR', 'jo'),
  -- Group K
  ('POR', 'pt'),
  ('COD', 'cd'),
  ('UZB', 'uz'),
  ('COL', 'co'),
  -- Group L
  ('GHA', 'gh'),
  ('PAN', 'pa'),
  ('ENG', 'gb-eng'),
  ('CRO', 'hr')
) as v(code, iso2)
where t.code = v.code;


