"use server";

import { revalidatePath } from "next/cache";

import { ADMIN_SCORE_MAX, ADMIN_SCORE_MIN } from "@/lib/admin-results";
import { getIsAdmin } from "@/lib/auth-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ApplyMatchCorrectionResult =
  | { ok: true; correctionId: string }
  | { ok: false; error: string };

// Thin wrapper around public.apply_match_correction(...). The RPC itself
// enforces admin via is_admin(); we double-check on the server so normal
// users never pay for a round-trip with a predictable error message.
export async function applyMatchCorrection(
  matchId: string,
  newHomeScore: number,
  newAwayScore: number,
  reason: string | null,
): Promise<ApplyMatchCorrectionResult> {
  if (typeof matchId !== "string" || !UUID_PATTERN.test(matchId)) {
    return { ok: false, error: "Invalid match id." };
  }

  const homeErr = validateAdminScore(newHomeScore, "Home");
  if (homeErr) return { ok: false, error: homeErr };
  const awayErr = validateAdminScore(newAwayScore, "Away");
  if (awayErr) return { ok: false, error: awayErr };

  const trimmedReason = reason?.trim() ?? "";
  if (trimmedReason.length > 2000) {
    return { ok: false, error: "Reason must be 2000 characters or fewer." };
  }

  if (!(await getIsAdmin())) {
    return { ok: false, error: "You do not have permission to enter results." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("apply_match_correction", {
    target_match_id: matchId,
    new_home_score: newHomeScore,
    new_away_score: newAwayScore,
    reason: trimmedReason.length > 0 ? trimmedReason : null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (typeof data !== "string") {
    return { ok: false, error: "Unexpected response from database." };
  }

  revalidatePath("/admin/results");
  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  return { ok: true, correctionId: data };
}

function validateAdminScore(value: unknown, label: string): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    return `${label} score must be a whole number.`;
  }
  if (value < ADMIN_SCORE_MIN || value > ADMIN_SCORE_MAX) {
    return `${label} score must be between ${ADMIN_SCORE_MIN} and ${ADMIN_SCORE_MAX}.`;
  }
  return null;
}
