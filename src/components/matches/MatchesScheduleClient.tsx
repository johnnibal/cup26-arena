"use client";

import dynamic from "next/dynamic";

import type { MatchWithTeams, Prediction } from "@/types/domain";

const MatchList = dynamic(
  () => import("@/components/matches/MatchList").then((m) => ({ default: m.MatchList })),
  {
    ssr: false,
    loading: () => (
      <div className="glass-panel animate-pulse rounded-2xl p-8 text-sm text-muted">
        Loading schedule…
      </div>
    ),
  },
);

type MatchesScheduleClientProps = {
  matches: MatchWithTeams[];
  predictionsByMatchId: Record<string, Prediction>;
};

// Client-only shell so `next/dynamic` can use `ssr: false` (disallowed in
// Server Components). Match grouping and kickoff times use the browser TZ.
export function MatchesScheduleClient({
  matches,
  predictionsByMatchId,
}: MatchesScheduleClientProps) {
  return <MatchList matches={matches} predictionsByMatchId={predictionsByMatchId} />;
}
