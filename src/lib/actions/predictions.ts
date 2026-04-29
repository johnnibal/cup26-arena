"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SCORE_MAX, SCORE_MIN } from "@/lib/predictions";
import type { Prediction } from "@/types/domain";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SavePredictionResult =
  | { ok: true; prediction: Prediction }
  | { ok: false; error: string };

// Saves (inserts or updates) the caller's prediction for a single match.
// Defense-in-depth layers:
//   1. This server-side validator rejects malformed input with friendly errors.
//   2. RLS on `predictions` ensures `user_id = auth.uid()` and kickoff is
//      still in the future (see 20260424120300_rls_and_locks.sql).
//   3. The `enforce_prediction_kickoff_lock` trigger is the final safety
//      net and also blocks users from writing `points` / `is_exact`.
// We only target layer 1 here; 2 and 3 kick in automatically.
export async function savePrediction(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<SavePredictionResult> {
  if (typeof matchId !== "string" || !UUID_PATTERN.test(matchId)) {
    return { ok: false, error: "Invalid match id." };
  }

  const homeError = validateScore(homeScore, "home");
  if (homeError) return { ok: false, error: homeError };
  const awayError = validateScore(awayScore, "away");
  if (awayError) return { ok: false, error: awayError };

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to save a prediction." };
  }

  // Pre-check kickoff for a friendlier error message. RLS + trigger would
  // reject the write anyway, but their errors are less helpful.
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_at, status")
    .eq("id", matchId)
    .maybeSingle<{ id: string; kickoff_at: string; status: string }>();

  if (matchError) {
    return { ok: false, error: matchError.message };
  }
  if (!match) {
    return { ok: false, error: "Match not found." };
  }
  if (match.status !== "scheduled") {
    return { ok: false, error: "Predictions are closed for this match." };
  }
  if (Date.now() >= Date.parse(match.kickoff_at)) {
    return { ok: false, error: "Kickoff has already started - predictions are locked." };
  }

  // Upsert keyed on the (user_id, match_id) unique constraint. `user_id`
  // is forced to the authenticated user server-side so a malicious payload
  // that tampered with a hidden field couldn't write as someone else.
  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
      },
      { onConflict: "user_id,match_id" },
    )
    .select(
      "id, user_id, match_id, home_score, away_score, points, is_exact, created_at, updated_at",
    )
    .maybeSingle<Prediction>();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Failed to save prediction." };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath("/predictions");
  return { ok: true, prediction: data };
}

function validateScore(value: unknown, side: "home" | "away"): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    return `${capitalize(side)} score must be a whole number.`;
  }
  if (value < SCORE_MIN || value > SCORE_MAX) {
    return `${capitalize(side)} score must be between ${SCORE_MIN} and ${SCORE_MAX}.`;
  }
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
