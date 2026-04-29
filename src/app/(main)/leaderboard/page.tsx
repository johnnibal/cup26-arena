import Link from "next/link";

import { LeaderboardPagination } from "@/components/leaderboard/LeaderboardPagination";
import { LeaderboardTable, LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { getAuthContext } from "@/lib/auth";
import { getLeaderboardPage, LEADERBOARD_PAGE_SIZE } from "@/lib/data/leaderboard";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: raw } = await searchParams;
  const parsed = parseInt(raw ?? "1", 10);
  const requested = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;

  const [{ entries, totalCount, pageCount, page }, auth] = await Promise.all([
    getLeaderboardPage(requested),
    getAuthContext(),
  ]);

  const currentUserId = auth?.user.id ?? null;
  const isEmpty = entries.length === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Standings</p>
        <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">Leaderboard</h1>
        <p className="max-w-2xl text-sm text-muted">
          {isEmpty ? (
            <>
              Rankings appear after matches finish and predictions are scored. Make picks on{" "}
              <Link
                href="/matches"
                className="font-medium text-team-primary underline-offset-2 hover:underline"
              >
                Matches
              </Link>{" "}
              to get on the board.
            </>
          ) : (
            <>
              Rankings from live stats. Order: total points, then exact scores, then correct results
              only. {LEADERBOARD_PAGE_SIZE} players per page.
            </>
          )}
        </p>
      </header>

      <LeaderboardTable entries={entries} currentUserId={currentUserId} />
      <LeaderboardView entries={entries} currentUserId={currentUserId} />

      {!isEmpty ? (
        <LeaderboardPagination page={page} pageCount={pageCount} totalCount={totalCount} />
      ) : null}
    </div>
  );
}
