"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AvatarFlag } from "@/components/profile/AvatarFlag";
import type { LeaderboardEntry } from "@/lib/data/leaderboard";

type LeaderboardViewProps = {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
};

export function LeaderboardView({ entries, currentUserId }: LeaderboardViewProps) {
  const reduce = useReducedMotion();

  if (entries.length === 0) {
    return (
      <div className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-muted">
        No leaderboard data yet. Once matches finish and predictions are scored, rankings will
        appear here.
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {entries.map((entry, i) => (
        <LeaderboardCard
          key={entry.user_id}
          entry={entry}
          isCurrentUser={entry.user_id === currentUserId}
          index={i}
          reduce={!!reduce}
        />
      ))}
    </div>
  );
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardViewProps) {
  const reduce = useReducedMotion();

  if (entries.length === 0) return null;

  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-white/[0.08] glass-panel md:block">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-white/[0.06] bg-surface-muted/95 text-[11px] font-bold uppercase tracking-wide text-muted backdrop-blur-md">
          <tr>
            <th className="w-14 px-4 py-3.5">Rank</th>
            <th className="px-4 py-3.5">Player</th>
            <th className="px-4 py-3.5">Team</th>
            <th className="px-4 py-3.5 text-right tabular-nums">Pts</th>
            <th className="px-4 py-3.5 text-right tabular-nums">Exact</th>
            <th className="px-4 py-3.5 text-right tabular-nums">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06] bg-surface-muted/30">
          {entries.map((entry, i) => (
            <LeaderboardTableRow
              key={entry.user_id}
              entry={entry}
              isCurrentUser={entry.user_id === currentUserId}
              index={i}
              reduce={!!reduce}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardCard({
  entry,
  isCurrentUser,
  index,
  reduce,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
  reduce: boolean;
}) {
  const podium = podiumStyle(entry.rank);
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduce ? 0 : index * 0.04,
        duration: reduce ? 0 : 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`rounded-2xl border p-4 shadow-card transition ${podium?.card ?? "border-white/[0.08] bg-surface-muted/40"} ${
        isCurrentUser
          ? "ring-2 ring-team-primary ring-offset-2 ring-offset-[#06080d] shadow-glow"
          : ""
      } ${isCurrentUser ? "bg-team-primary/10" : ""}`}
    >
      <div className="flex items-start gap-3">
        <RankBadge rank={entry.rank} />
        <AvatarFlag team={entry.team} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 truncate font-semibold text-heading">
            <span className="truncate">{entry.display_name}</span>
            {isCurrentUser ? (
              <span className="shrink-0 rounded-md bg-team-primary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-team-primary">
                You
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-muted">
            {entry.team?.name ?? "No team picked"}
            {entry.team ? ` · ${entry.team.code}` : null}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-white/[0.06] bg-surface-muted/60 px-2 py-2">
              <dt className="text-muted">Pts</dt>
              <dd className="font-bold tabular-nums text-team-primary">{entry.total_points}</dd>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-surface-muted/60 px-2 py-2">
              <dt className="text-muted">Exact</dt>
              <dd className="font-bold tabular-nums text-heading">{entry.exact_count}</dd>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-surface-muted/60 px-2 py-2">
              <dt className="text-muted">Result</dt>
              <dd className="font-bold tabular-nums text-heading">{entry.correct_result_count}</dd>
            </div>
          </dl>
        </div>
      </div>
    </motion.article>
  );
}

function LeaderboardTableRow({
  entry,
  isCurrentUser,
  index,
  reduce,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
  reduce: boolean;
}) {
  const podium = podiumStyle(entry.rank);
  return (
    <motion.tr
      initial={reduce ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: reduce ? 0 : index * 0.035,
        duration: reduce ? 0 : 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`transition-colors ${podium?.row ?? ""} ${
        isCurrentUser
          ? "bg-team-primary/15 ring-2 ring-inset ring-team-primary shadow-glow"
          : "hover:bg-white/[0.03]"
      }`}
    >
      <td className="px-4 py-3.5 align-middle">
        <RankBadge rank={entry.rank} />
      </td>
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-center gap-3">
          <AvatarFlag team={entry.team} size="sm" />
          <span className="font-medium text-heading">{entry.display_name}</span>
          {isCurrentUser ? (
            <span className="rounded-md bg-team-primary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-team-primary">
              You
            </span>
          ) : null}
        </div>
      </td>
      <td className="max-w-[200px] px-4 py-3.5 align-middle">
        <span className="block truncate text-muted">
          {entry.team ? (
            <>
              {entry.team.name} <span className="text-muted/70">({entry.team.code})</span>
            </>
          ) : (
            <span className="text-muted/70">—</span>
          )}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right align-middle text-base font-bold tabular-nums text-team-primary">
        {entry.total_points}
      </td>
      <td className="px-4 py-3.5 text-right align-middle tabular-nums text-heading">
        {entry.exact_count}
      </td>
      <td className="px-4 py-3.5 text-right align-middle tabular-nums text-heading">
        {entry.correct_result_count}
      </td>
    </motion.tr>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const podium = podiumStyle(rank);
  if (podium) {
    return (
      <span
        className={`inline-flex h-9 min-w-[2.35rem] items-center justify-center rounded-full text-xs font-bold tabular-nums ${podium.badge}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 min-w-[2.35rem] items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold tabular-nums text-muted ring-1 ring-white/10">
      {rank}
    </span>
  );
}

function podiumStyle(rank: number): {
  badge: string;
  card: string;
  row: string;
} | null {
  if (rank === 1) {
    return {
      badge:
        "bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950 shadow-md ring-1 ring-amber-200/60",
      card: "border-amber-400/40 bg-gradient-to-br from-amber-500/12 via-amber-600/5 to-transparent shadow-[0_0_36px_-10px_rgba(245,158,11,0.35)]",
      row: "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
    };
  }
  if (rank === 2) {
    return {
      badge:
        "bg-gradient-to-br from-slate-200 to-slate-500 text-slate-950 shadow-md ring-1 ring-white/25",
      card: "border-slate-400/35 bg-gradient-to-br from-slate-300/10 via-slate-500/5 to-transparent",
      row: "bg-gradient-to-r from-slate-400/10 via-slate-500/5 to-transparent",
    };
  }
  if (rank === 3) {
    return {
      badge:
        "bg-gradient-to-br from-orange-300 to-amber-800 text-white shadow-md ring-1 ring-orange-300/40",
      card: "border-orange-400/35 bg-gradient-to-br from-orange-500/12 via-amber-800/5 to-transparent",
      row: "bg-gradient-to-r from-orange-500/10 via-amber-700/5 to-transparent",
    };
  }
  return null;
}
