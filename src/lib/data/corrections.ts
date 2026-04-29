import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchResultCorrection } from "@/types/domain";

const CORRECTION_COLUMNS =
  "id, match_id, previous_home_score, previous_away_score, new_home_score, new_away_score, reason, corrected_by, created_at";

// Loads every correction row for the given matches, newest first per match
// when you iterate the grouped map (caller sorts within each bucket).
export const getCorrectionsByMatchIds = cache(
  async (matchIds: string[]): Promise<Map<string, MatchResultCorrection[]>> => {
    const map = new Map<string, MatchResultCorrection[]>();
    if (matchIds.length === 0) return map;

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("match_result_corrections")
      .select(CORRECTION_COLUMNS)
      .in("match_id", matchIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load correction history: ${error.message}`);
    }

    for (const row of (data ?? []) as MatchResultCorrection[]) {
      const list = map.get(row.match_id) ?? [];
      list.push(row);
      map.set(row.match_id, list);
    }

    return map;
  },
);
