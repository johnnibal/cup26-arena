import Link from "next/link";

import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { MatchTeamBlock } from "@/components/matches/MatchScoreboard";
import { PredictionBadge } from "@/components/predictions/PredictionBadge";
import { formatKickoffDateLocal, formatKickoffTimeLocal } from "@/lib/kickoff-display";
import { displayStatus, getPredictionStatus } from "@/lib/match";
import type { MatchWithTeams, Prediction } from "@/types/domain";

type MatchCardProps = {
  match: MatchWithTeams;
  prediction?: Prediction | null;
};

// One row in the matches list. Entire row is a link to the detail page.
// Server-safe: just renders from the precomputed data passed in.
// (Rendered under MatchList, which is client-only — locale formatting is OK.)
export function MatchCard({ match, prediction = null }: MatchCardProps) {
  const status = displayStatus(match);
  const predictionStatus = getPredictionStatus(match, prediction);
  const kickoffTime = formatKickoffTimeLocal(match.kickoff_at);
  const kickoffDate = formatKickoffDateLocal(match.kickoff_at);
  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="glass-panel group block rounded-2xl p-4 shadow-card transition hover:-translate-y-0.5 hover:border-team-secondary/40 hover:shadow-glow-sm hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-team-accent/35 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 gap-y-3 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-2">
          {match.group_letter ? (
            <span className="inline-flex items-center rounded-lg border border-white/10 bg-surface-muted/80 px-2 py-1 font-bold uppercase tracking-wide text-heading">
              Group {match.group_letter}
            </span>
          ) : null}
          <span className="hidden sm:inline" suppressHydrationWarning>
            {kickoffDate}
          </span>
          <span
            className="rounded-md bg-white/[0.06] px-2 py-1 font-semibold tabular-nums text-heading ring-1 ring-white/10 sm:font-bold"
            suppressHydrationWarning
          >
            {kickoffTime}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PredictionBadge prediction={prediction} status={predictionStatus} />
          <MatchStatusBadge status={status} />
        </div>
      </div>

      {/* Same layout as match detail (`MatchScoreboard`): stacked on mobile, 3-col from sm */}
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <MatchTeamBlock
          team={match.home}
          fallbackCode={match.home_team ?? "???"}
          align="right"
          parentGroupHover
        />

        <div className="flex items-center justify-center">
          {hasScore ? (
            <div className="flex items-baseline gap-3 font-bold tabular-nums text-heading">
              <span className="text-4xl sm:text-5xl">{match.home_score}</span>
              <span className="text-2xl text-muted">:</span>
              <span className="text-4xl sm:text-5xl">{match.away_score}</span>
            </div>
          ) : (
            <span className="text-lg font-bold uppercase tracking-[0.35em] text-muted">vs</span>
          )}
        </div>

        <MatchTeamBlock
          team={match.away}
          fallbackCode={match.away_team ?? "???"}
          align="left"
          parentGroupHover
        />
      </div>

      {match.venue ? (
        <p className="mt-4 truncate border-t border-white/[0.06] pt-3 text-xs text-muted">
          {match.venue}
        </p>
      ) : null}
    </Link>
  );
}
