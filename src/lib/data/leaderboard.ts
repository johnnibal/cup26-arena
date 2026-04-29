import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, Team } from "@/types/domain";

export const LEADERBOARD_PAGE_SIZE = 25;

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  display_name: string;
  favorite_team_code: string | null;
  team: Team | null;
  total_points: number;
  exact_count: number;
  correct_result_count: number;
};

type ProfileWithTeam = Pick<Profile, "id" | "display_name" | "favorite_team_code"> & {
  team: Team | Team[] | null;
};

type RawStatsRow = {
  user_id: string;
  total_points: number;
  exact_count: number;
  correct_result_count: number;
  profile: ProfileWithTeam | ProfileWithTeam[] | null;
};

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Paginated slice of the global leaderboard. Ordering matches the
// user_stats_leaderboard_idx definition (plus predictions_made as a final
// deterministic tie-break when the first three columns tie).
export const getLeaderboardPage = cache(
  async (
    requestedPage: number,
  ): Promise<{
    entries: LeaderboardEntry[];
    totalCount: number;
    pageCount: number;
    page: number;
  }> => {
    const supabase = await createSupabaseServerClient();

    const pageIn =
      Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.floor(requestedPage) : 1;

    const { count, error: countError } = await supabase
      .from("user_stats")
      .select("user_id", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Failed to load leaderboard: ${countError.message}`);
    }

    const totalCount = count ?? 0;
    const pageCount = Math.max(1, Math.ceil(totalCount / LEADERBOARD_PAGE_SIZE));
    const page = Math.min(pageIn, pageCount);
    const from = (page - 1) * LEADERBOARD_PAGE_SIZE;
    const to = from + LEADERBOARD_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("user_stats")
      .select(
        `
        user_id,
        total_points,
        exact_count,
        correct_result_count,
        profile:profiles!user_stats_user_id_fkey (
          id,
          display_name,
          favorite_team_code,
          team:teams!favorite_team_code (
            code,
            name,
            group_letter,
            primary_color,
            accent_color,
            iso2_code
          )
        )
      `,
      )
      .order("total_points", { ascending: false })
      .order("exact_count", { ascending: false })
      .order("correct_result_count", { ascending: false })
      .order("predictions_made", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load leaderboard: ${error.message}`);
    }

    const entries: LeaderboardEntry[] = (data ?? []).map((row, index) => {
      const raw = row as unknown as RawStatsRow;
      const profile = normalizeEmbed(raw.profile);
      const team = normalizeEmbed(profile?.team ?? null);

      return {
        rank: from + index + 1,
        user_id: raw.user_id,
        display_name: profile?.display_name?.trim() || "Player",
        favorite_team_code: profile?.favorite_team_code ?? null,
        team,
        total_points: raw.total_points,
        exact_count: raw.exact_count,
        correct_result_count: raw.correct_result_count,
      };
    });

    return { entries, totalCount, pageCount, page };
  },
);

// First N rows of the global leaderboard (same ordering as the full table).
// Used by the home page preview; does not run an extra count query.
export const getLeaderboardTopN = cache(async (n: number): Promise<LeaderboardEntry[]> => {
  const cap = Math.min(Math.max(1, Math.floor(n)), 50);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_stats")
    .select(
      `
        user_id,
        total_points,
        exact_count,
        correct_result_count,
        profile:profiles!user_stats_user_id_fkey (
          id,
          display_name,
          favorite_team_code,
          team:teams!favorite_team_code (
            code,
            name,
            group_letter,
            primary_color,
            accent_color,
            iso2_code
          )
        )
      `,
    )
    .order("total_points", { ascending: false })
    .order("exact_count", { ascending: false })
    .order("correct_result_count", { ascending: false })
    .order("predictions_made", { ascending: false })
    .limit(cap);

  if (error) {
    throw new Error(`Failed to load leaderboard preview: ${error.message}`);
  }

  return (data ?? []).map((row, index) => {
    const raw = row as unknown as RawStatsRow;
    const profile = normalizeEmbed(raw.profile);
    const team = normalizeEmbed(profile?.team ?? null);

    return {
      rank: index + 1,
      user_id: raw.user_id,
      display_name: profile?.display_name?.trim() || "Player",
      favorite_team_code: profile?.favorite_team_code ?? null,
      team,
      total_points: raw.total_points,
      exact_count: raw.exact_count,
      correct_result_count: raw.correct_result_count,
    };
  });
});
