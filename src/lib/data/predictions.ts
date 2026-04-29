import { cache } from "react";

import { getMatchesByIds } from "@/lib/data/matches";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchWithTeams, Prediction } from "@/types/domain";

const PREDICTION_COLUMNS =
  "id, user_id, match_id, home_score, away_score, points, is_exact, created_at, updated_at";

// Fetches the current user's prediction for a single match. Returns null
// when signed out or the user hasn't picked yet. RLS ensures only the
// owner's row is ever returned.
export const getUserPredictionForMatch = cache(
  async (matchId: string): Promise<Prediction | null> => {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("predictions")
      .select(PREDICTION_COLUMNS)
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .maybeSingle<Prediction>();

    if (error) {
      throw new Error(`Failed to load prediction: ${error.message}`);
    }

    return data ?? null;
  },
);

// Batch-fetches the current user's predictions for a given set of matches.
// Used by the /matches list to draw the "Your pick" badge on each card
// without firing N queries. Returned as a Map keyed by match_id for O(1)
// lookup in the render loop.
export const getUserPredictionsByMatchIds = cache(
  async (matchIds: string[]): Promise<Map<string, Prediction>> => {
    if (matchIds.length === 0) return new Map();

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return new Map();

    const { data, error } = await supabase
      .from("predictions")
      .select(PREDICTION_COLUMNS)
      .eq("user_id", user.id)
      .in("match_id", matchIds);

    if (error) {
      throw new Error(`Failed to load predictions: ${error.message}`);
    }

    const map = new Map<string, Prediction>();
    for (const row of (data ?? []) as Prediction[]) {
      map.set(row.match_id, row);
    }
    return map;
  },
);

export type PredictionHistoryRow = {
  prediction: Prediction;
  match: MatchWithTeams;
};

// All predictions for the signed-in user, each paired with its match row.
// Ordered by kickoff (newest first). RLS limits rows to the current user.
export const getUserPredictionHistory = cache(async (): Promise<PredictionHistoryRow[]> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("predictions")
    .select(PREDICTION_COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load prediction history: ${error.message}`);
  }

  const predictions = (data ?? []) as Prediction[];
  if (predictions.length === 0) return [];

  const matchesById = await getMatchesByIds(predictions.map((p) => p.match_id));

  const rows: PredictionHistoryRow[] = [];
  for (const prediction of predictions) {
    const match = matchesById.get(prediction.match_id);
    if (match) rows.push({ prediction, match });
  }

  rows.sort((a, b) => Date.parse(b.match.kickoff_at) - Date.parse(a.match.kickoff_at));

  return rows;
});
