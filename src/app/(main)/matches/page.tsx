import { KickoffTimeDisclaimer } from "@/components/kickoff/KickoffTimeDisclaimer";
import { MatchesScheduleClient } from "@/components/matches/MatchesScheduleClient";
import { getAllMatches } from "@/lib/data/matches";
import { getUserPredictionsByMatchIds } from "@/lib/data/predictions";
import type { Prediction } from "@/types/domain";

export const metadata = { title: "Matches" };

export default async function MatchesPage() {
  const matches = await getAllMatches();
  const predictions = await getUserPredictionsByMatchIds(matches.map((m) => m.id));

  // Map -> plain object so it serialises cleanly across the RSC boundary
  // into the client schedule shell.
  const predictionsByMatchId: Record<string, Prediction> = Object.fromEntries(predictions);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Fixtures</p>
        <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">Group stage</h1>
        <p className="max-w-2xl text-sm text-muted">
          Every group-stage match with kickoff times, venues, and live status. Filter by team,
          group, or status to find what you&apos;re looking for.
        </p>
        <KickoffTimeDisclaimer className="mt-2 max-w-2xl" />
      </header>

      <MatchesScheduleClient matches={matches} predictionsByMatchId={predictionsByMatchId} />
    </div>
  );
}
