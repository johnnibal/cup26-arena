// Cup26 Arena - shared domain types.
//
// These mirror the columns the UI actually reads. Once Supabase type
// generation is wired up in a later step, these can be replaced with the
// generated Database types. Keeping hand-rolled types here avoids adding
// a codegen dependency to the auth / profile steps.

export type Team = {
  code: string;
  name: string;
  group_letter: string;
  /** DB + UI: `--team-primary`; `inkOnColor` picks readable text. */
  primary_color: string | null;
  /** DB + UI: `--team-accent` fallback; full trio uses `src/lib/team-ui-palette.ts`. */
  accent_color: string | null;
  /** ISO 3166-1 alpha-2 (e.g. "mx", "gb-sct"). Null if not yet mapped. */
  iso2_code: string | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  favorite_team_code: string | null;
  /** Short supporter message for profile card; optional until DB migration applied. */
  supporter_note?: string | null;
  /** Profile card gradient (visual only); optional until DB migration applied. */
  gradient_angle?: number;
  gradient_primary_stop?: number;
  gradient_secondary_stop?: number;
  gradient_accent_stop?: number;
  gradient_style?: string | null;
};

export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";

export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "final" | "third_place";

export type Match = {
  id: string;
  stage: MatchStage;
  group_letter: string | null;
  home_team: string | null;
  away_team: string | null;
  /** ISO 8601 timestamp with timezone. */
  kickoff_at: string;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  finalized_at: string | null;
};

/** Match row with its two team rows joined in. */
export type MatchWithTeams = Match & {
  home: Team | null;
  away: Team | null;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  /** Populated by the scoring flow once the match is finalised. */
  points: number | null;
  is_exact: boolean | null;
  created_at: string;
  updated_at: string;
};

/** Audit row written by apply_match_correction (admin only). */
export type MatchResultCorrection = {
  id: string;
  match_id: string;
  previous_home_score: number | null;
  previous_away_score: number | null;
  new_home_score: number;
  new_away_score: number;
  reason: string | null;
  corrected_by: string | null;
  created_at: string;
};
