"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { PredictionHistoryRow } from "@/lib/data/predictions";
import { formatKickoffDateLocal, formatKickoffTimeLocal } from "@/lib/kickoff-display";
import {
  type PredictionHistoryFilter,
  type PredictionHistoryOutcome,
  getPredictionHistoryOutcome,
  historyRowMatchesFilter,
  outcomeLabel,
} from "@/lib/prediction-history";
import { displayStatus } from "@/lib/match";

const FILTERS: Array<{ id: PredictionHistoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "exact", label: "Exact score" },
  { id: "correct_result", label: "Correct result" },
  { id: "wrong", label: "Wrong" },
];

type PredictionsHistoryClientProps = {
  rows: PredictionHistoryRow[];
};

export function PredictionsHistoryClient({ rows }: PredictionsHistoryClientProps) {
  const [filter, setFilter] = useState<PredictionHistoryFilter>("all");

  const filtered = useMemo(
    () => rows.filter(({ match, prediction }) => historyRowMatchesFilter(filter, match, prediction)),
    [rows, filter],
  );

  if (rows.length === 0) {
    return (
      <div className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-muted">
        You don&apos;t have any predictions yet.{" "}
        <Link href="/matches" className="font-semibold text-team-primary hover:underline">
          Browse matches
        </Link>{" "}
        to make your first pick.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Filter predictions"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                active
                  ? "bg-team-primary/25 text-heading ring-2 ring-team-primary/40"
                  : "border border-white/10 bg-surface-muted/40 text-muted hover:border-white/20 hover:text-heading"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted">No predictions in this category.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map(({ prediction, match }) => (
            <HistoryCard key={prediction.id} prediction={prediction} match={match} />
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryCard({ prediction, match }: PredictionHistoryRow) {
  const outcome = getPredictionHistoryOutcome(match, prediction);
  const status = displayStatus(match);
  const homeName = match.home?.name ?? match.home_team ?? "TBD";
  const awayName = match.away?.name ?? match.away_team ?? "TBD";
  const hasFinal =
    status === "finished" && match.home_score !== null && match.away_score !== null;

  const pointsDisplay =
    prediction.points === null ? "—" : `+${prediction.points} pt${prediction.points === 1 ? "" : "s"}`;

  const dateStr = formatKickoffDateLocal(match.kickoff_at);
  const timeStr = formatKickoffTimeLocal(match.kickoff_at);

  return (
    <li>
      <Link
        href={`/matches/${match.id}`}
        className="glass-panel block rounded-2xl p-4 shadow-card transition hover:border-team-primary/30 hover:shadow-card-hover sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {match.group_letter ? (
                <span className="rounded-md border border-white/10 bg-surface-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Group {match.group_letter}
                </span>
              ) : null}
              <OutcomePill outcome={outcome} />
            </div>
            <p className="text-base font-semibold text-heading">
              {homeName}{" "}
              <span className="font-normal text-muted">vs</span> {awayName}
            </p>
            <p className="text-xs text-muted">
              <span suppressHydrationWarning>
                {dateStr} · {timeStr}
              </span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:shrink-0 sm:grid-cols-1 sm:text-right">
            <div className="rounded-lg border border-white/[0.06] bg-surface-muted/40 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0 sm:ring-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Your pick</dt>
              <dd className="font-bold tabular-nums text-heading">
                {prediction.home_score}–{prediction.away_score}
              </dd>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-surface-muted/40 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Result</dt>
              <dd className="font-bold tabular-nums text-heading">
                {hasFinal ? (
                  <>
                    {match.home_score}–{match.away_score}
                  </>
                ) : status === "live" &&
                  match.home_score !== null &&
                  match.away_score !== null ? (
                  <>
                    {match.home_score}–{match.away_score}{" "}
                    <span className="text-[10px] font-normal text-rose-400">(live)</span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="col-span-2 rounded-lg border border-white/[0.06] bg-surface-muted/40 px-3 py-2 sm:col-span-1 sm:bg-transparent sm:px-0 sm:py-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Points</dt>
              <dd
                className={`font-bold tabular-nums ${
                  prediction.points === null
                    ? "text-muted"
                    : prediction.points > 0
                      ? "text-team-primary"
                      : "text-muted"
                }`}
              >
                {pointsDisplay}
              </dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-muted">
          <span className="font-medium text-heading">Status:</span> {outcomeLabel(outcome)}
        </p>
      </Link>
    </li>
  );
}

function OutcomePill({ outcome }: { outcome: PredictionHistoryOutcome }) {
  const label = outcomeLabel(outcome);
  const cls =
    outcome === "exact"
      ? "bg-amber-500/15 text-amber-200 ring-amber-400/35"
      : outcome === "correct_result"
        ? "bg-emerald-500/12 text-emerald-300 ring-emerald-400/30"
        : outcome === "wrong"
          ? "bg-white/[0.06] text-muted ring-white/10"
          : outcome === "live"
            ? "bg-rose-500/15 text-rose-300 ring-rose-400/35"
            : outcome === "cancelled"
              ? "bg-amber-500/12 text-amber-200 ring-amber-400/25"
              : "bg-white/[0.06] text-muted ring-white/10";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}
