import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, MatchWithTeams, Team } from "@/types/domain";

// Columns we pull for every match row. Kept in one place so the list page
// and detail page stay in sync.
const MATCH_COLUMNS = `
  id,
  stage,
  group_letter,
  home_team,
  away_team,
  kickoff_at,
  venue,
  home_score,
  away_score,
  status,
  finalized_at,
  home:teams!home_team (
    code, name, group_letter, primary_color, accent_color, iso2_code
  ),
  away:teams!away_team (
    code, name, group_letter, primary_color, accent_color, iso2_code
  )
`;

type RawMatchRow = Match & {
  // Supabase sometimes returns embedded relations as a single object and
  // sometimes as a single-element array depending on PostgREST version.
  home: Team | Team[] | null;
  away: Team | Team[] | null;
};

function normalizeEmbed(value: Team | Team[] | null | undefined): Team | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeMatch(raw: RawMatchRow): MatchWithTeams {
  const { home, away, ...match } = raw;
  return {
    ...match,
    home: normalizeEmbed(home),
    away: normalizeEmbed(away),
  };
}

// Fetches every match in chronological order with both teams joined in.
// Per-request cached so the Matches page + any future home-page widgets
// that reuse this helper don't re-query.
export const getAllMatches = cache(async (): Promise<MatchWithTeams[]> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .order("kickoff_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load matches: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeMatch(row as unknown as RawMatchRow));
});

// Group-stage fixtures only (MVP). Used by the admin results console.
export const getGroupStageMatches = cache(async (): Promise<MatchWithTeams[]> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("stage", "group")
    .order("kickoff_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load group-stage matches: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeMatch(row as unknown as RawMatchRow));
});

// Fetches a single match by id. Returns null if not found (so the caller
// can render notFound() instead of blowing up).
export const getMatchById = cache(async (id: string): Promise<MatchWithTeams | null> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load match: ${error.message}`);
  }

  if (!data) return null;

  return normalizeMatch(data as unknown as RawMatchRow);
});

// Batch-load matches by primary key. Used by prediction history and similar.
export const getMatchesByIds = cache(async (ids: string[]): Promise<Map<string, MatchWithTeams>> => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("matches").select(MATCH_COLUMNS).in("id", unique);

  if (error) {
    throw new Error(`Failed to load matches: ${error.message}`);
  }

  const map = new Map<string, MatchWithTeams>();
  for (const row of (data ?? []) as RawMatchRow[]) {
    const m = normalizeMatch(row);
    map.set(m.id, m);
  }
  return map;
});

// Next group-stage kickoff involving `teamCode` (home or away), still in the
// future relative to server time. Used on the home page.
export const getNextMatchForTeam = cache(
  async (teamCode: string): Promise<MatchWithTeams | null> => {
    if (!/^[A-Z]{3}$/.test(teamCode)) return null;

    const supabase = await createSupabaseServerClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("matches")
      .select(MATCH_COLUMNS)
      .eq("stage", "group")
      .or(`home_team.eq.${teamCode},away_team.eq.${teamCode}`)
      .gte("kickoff_at", nowIso)
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load next match for team: ${error.message}`);
    }

    if (!data) return null;

    return normalizeMatch(data as unknown as RawMatchRow);
  },
);
