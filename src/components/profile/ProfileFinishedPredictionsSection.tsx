import Link from "next/link";

import type { PredictionHistoryRow } from "@/lib/data/predictions";
import { formatKickoffDateLocal, formatKickoffTimeLocal } from "@/lib/kickoff-display";
import { displayStatus } from "@/lib/match";
import {
  type PredictionHistoryOutcome,
  getPredictionHistoryOutcome,
  outcomeLabel,
} from "@/lib/prediction-history";

type ProfileFinishedPredictionsSectionProps = {
  rows: PredictionHistoryRow[];
};

function OutcomePill({ outcome }: { outcome: PredictionHistoryOutcome }) {
  const label = outcomeLabel(outcome);
  const cls =
    outcome === "exact"
      ? "bg-amber-500/15 text-amber-200 ring-amber-400/35"
      : outcome === "correct_result"
        ? "bg-emerald-500/12 text-emerald-300 ring-emerald-400/30"
        : outcome === "wrong"
          ? "bg-white/[0.06] text-muted ring-white/10"
          : "bg-white/[0.06] text-muted ring-white/10";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

export function ProfileFinishedPredictionsSection({ rows }: ProfileFinishedPredictionsSectionProps) {
  return (
    <section className="glass-panel rounded-2xl p-6 shadow-card sm:p-8">
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-heading">Recent predictions</h2>
          <p className="mt-1 text-sm text-muted">
            Your picks on finished matches, with results and points. Upcoming games stay on{" "}
            <Link href="/predictions" className="font-medium text-team-primary hover:underline">
              My predictions
            </Link>
            .
          </p>
        </div>
        {rows.length > 0 ? (
          <Link
            href="/predictions"
            className="text-sm font-semibold text-team-primary transition hover:text-zinc-100 hover:underline hover:decoration-zinc-400/60 hover:underline-offset-4"
          >
            Full history →
          </Link>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-surface-muted/25 p-8 text-center text-sm text-muted">
          Nothing here yet. When matches end and scores are final, your results and points show up
          here.{" "}
          <Link href="/matches" className="font-semibold text-team-primary hover:underline">
            Call the scores on fixtures
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ prediction, match }) => {
            const outcome = getPredictionHistoryOutcome(match, prediction);
            const status = displayStatus(match);
            const homeName = match.home?.name ?? match.home_team ?? "TBD";
            const awayName = match.away?.name ?? match.away_team ?? "TBD";
            const hasFinal =
              status === "finished" && match.home_score !== null && match.away_score !== null;
            const pointsDisplay =
              prediction.points === null
                ? "—"
                : `+${prediction.points} pt${prediction.points === 1 ? "" : "s"}`;

            return (
              <li key={prediction.id}>
                <Link
                  href={`/matches/${match.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-surface-muted/30 p-4 transition hover:border-team-primary/25 hover:bg-surface-muted/45 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {match.group_letter ? (
                        <span className="rounded-md border border-white/10 bg-surface-muted/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                          Group {match.group_letter}
                        </span>
                      ) : null}
                      <OutcomePill outcome={outcome} />
                    </div>
                    <p className="mt-1.5 truncate text-sm font-semibold text-heading">
                      {homeName} <span className="font-normal text-muted">vs</span> {awayName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted" suppressHydrationWarning>
                      {formatKickoffDateLocal(match.kickoff_at)} ·{" "}
                      {formatKickoffTimeLocal(match.kickoff_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-4 text-sm sm:justify-end">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Your pick
                      </p>
                      <p className="font-bold tabular-nums text-heading">
                        {prediction.home_score}–{prediction.away_score}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Final
                      </p>
                      <p className="font-bold tabular-nums text-heading">
                        {hasFinal ? (
                          <>
                            {match.home_score}–{match.away_score}
                          </>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Points
                      </p>
                      <p
                        className={`font-bold tabular-nums ${
                          prediction.points === null
                            ? "text-muted"
                            : prediction.points > 0
                              ? "text-team-primary"
                              : "text-muted"
                        }`}
                      >
                        {pointsDisplay}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
