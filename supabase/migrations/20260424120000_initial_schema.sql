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
