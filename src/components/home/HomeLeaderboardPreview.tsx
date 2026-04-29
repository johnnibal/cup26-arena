"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { AvatarFlag } from "@/components/profile/AvatarFlag";
import type { LeaderboardEntry } from "@/lib/data/leaderboard";

type HomeLeaderboardPreviewProps = {
  entries: LeaderboardEntry[];
  currentUserId: string;
};

function podiumClass(rank: number): string {
  if (rank === 1)
    return "border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-amber-600/5 to-transparent shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]";
  if (rank === 2)
    return "border-slate-400/30 bg-gradient-to-br from-slate-300/12 via-slate-500/5 to-transparent";
  if (rank === 3)
    return "border-orange-400/30 bg-gradient-to-br from-orange-500/12 via-amber-700/5 to-transparent";
  return "border-white/[0.06] bg-surface-muted/30";
}

function rankOrb(rank: number): string {
  if (rank === 1)
    return "bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950 shadow-md ring-1 ring-amber-200/50";
  if (rank === 2)
    return "bg-gradient-to-br from-slate-200 to-slate-500 text-slate-900 shadow-md ring-1 ring-white/20";
  if (rank === 3)
    return "bg-gradient-to-br from-orange-300 to-amber-800 text-white shadow-md ring-1 ring-orange-200/30";
  return "bg-white/[0.08] text-heading ring-1 ring-white/10";
}

export function HomeLeaderboardPreview({ entries, currentUserId }: HomeLeaderboardPreviewProps) {
  const reduce = useReducedMotion();

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-heading sm:text-xl">Top players</h2>
          <p className="text-sm text-muted">Leaderboard snapshot - top five by points.</p>
        </div>
        <Link
          href="/leaderboard"
          className="text-sm font-semibold text-team-primary transition hover:text-team-accent"
        >
          Full leaderboard →
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-muted">
          Rankings will appear once players have scored points.
        </div>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry, i) => {
            const isYou = entry.user_id === currentUserId;
            return (
              <motion.li
                key={entry.user_id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduce ? 0 : i * 0.045,
                  duration: reduce ? 0 : 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className={`glass-panel flex items-center gap-3 rounded-2xl border p-3.5 transition sm:p-4 ${podiumClass(entry.rank)} ${
                    isYou
                      ? "ring-2 ring-team-primary ring-offset-2 ring-offset-[#06080d] shadow-glow"
                      : ""
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${rankOrb(entry.rank)}`}
                  >
                    {entry.rank}
                  </span>
                  <AvatarFlag team={entry.team} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-heading">
                      {entry.display_name}
                      {isYou ? (
                        <span className="ml-2 rounded-md bg-team-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-team-primary">
                          You
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {entry.team?.name ?? "No team"} · {entry.exact_count} exact ·{" "}
                      {entry.correct_result_count} result
                      {entry.correct_result_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-team-primary">
                    {entry.total_points} pts
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
