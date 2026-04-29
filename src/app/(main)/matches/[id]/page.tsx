import Link from "next/link";
import { notFound } from "next/navigation";

import { KickoffLocalLine } from "@/components/kickoff/KickoffLocalLine";
import { KickoffTimeDisclaimer } from "@/components/kickoff/KickoffTimeDisclaimer";
import { KickoffCountdown } from "@/components/matches/KickoffCountdown";
import { MatchScoreboard } from "@/components/matches/MatchScoreboard";
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { PredictionForm } from "@/components/predictions/PredictionForm";
import { getMatchById } from "@/lib/data/matches";
import { getUserPredictionForMatch } from "@/lib/data/predictions";
import { displayStatus, getPredictionStatus } from "@/lib/match";

// UUIDs make cheap metadata titles cryptic, so we fetch the match once
// and reuse it for both the title and the page. Next will de-dupe calls
// to `getMatchById` thanks to React.cache, so this adds zero extra cost.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) return { title: "Match" };
  const home = match.home?.name ?? match.home_team ?? "TBD";
  const away = match.away?.name ?? match.away_team ?? "TBD";
  return { title: `${home} vs ${away}` };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, prediction] = await Promise.all([getMatchById(id), getUserPredictionForMatch(id)]);
  if (!match) notFound();

  const status = displayStatus(match);
  const isFinished = status === "finished";
  const predictionStatus = getPredictionStatus(match, prediction);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/matches" className="font-medium transition hover:text-team-primary">
          ← All matches
        </Link>
      </nav>

      <article className="glass-panel overflow-hidden rounded-2xl shadow-card">
        <div className="border-b border-white/[0.06] bg-surface-muted/50 px-5 py-3.5 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {match.group_letter ? (
                <span className="inline-flex items-center rounded-lg border border-white/10 bg-surface-muted/80 px-2 py-0.5 font-bold uppercase tracking-wide text-heading">
                  Group {match.group_letter}
                </span>
              ) : null}
              <KickoffLocalLine iso={match.kickoff_at} />
            </div>
            <MatchStatusBadge status={status} />
          </div>
          <KickoffTimeDisclaimer className="mt-2 max-w-2xl" />
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          <MatchScoreboard match={match} />

          <div className="grid gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-2">
            <section className="rounded-xl border border-white/[0.06] bg-surface-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Venue</p>
              <p className="mt-1 text-sm font-medium text-brand-ink">
                {match.venue ?? "To be announced"}
              </p>
            </section>

            <section className="rounded-xl border border-white/[0.06] bg-surface-muted/40 p-4">
              {isFinished ? (
                <FinalResult homeScore={match.home_score} awayScore={match.away_score} />
              ) : status === "cancelled" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-300">
                    This match has been cancelled.
                  </p>
                </>
              ) : (
                <KickoffCountdown
                  kickoffAt={match.kickoff_at}
                  label={status === "live" ? "Started" : "Kicks off in"}
                />
              )}
            </section>
          </div>
        </div>
      </article>

      <PredictionForm match={match} initialPrediction={prediction} status={predictionStatus} />
    </div>
  );
}

function FinalResult({
  homeScore,
  awayScore,
}: {
  homeScore: number | null;
  awayScore: number | null;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Final score</p>
      <p className="mt-1 font-bold tabular-nums text-heading">
        <span className="text-2xl">{homeScore}</span>
        <span className="mx-2 text-muted">–</span>
        <span className="text-2xl">{awayScore}</span>
      </p>
    </>
  );
}
