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
