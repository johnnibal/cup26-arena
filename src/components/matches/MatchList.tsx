"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { MatchCard } from "@/components/matches/MatchCard";
import { groupMatchesByDateLocal } from "@/lib/kickoff-display";
import { displayStatus } from "@/lib/match";
import type { MatchStatus, MatchWithTeams, Prediction } from "@/types/domain";

type StatusFilter = "all" | "upcoming" | "live" | "finished";

type MatchListProps = {
  matches: MatchWithTeams[];
  /** Optional map of the current user's predictions, keyed by match id. */
  predictionsByMatchId?: Record<string, Prediction>;
};

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

// Client-side interactive list: keeps filter state locally, reuses the
// preloaded matches array (no refetches). Rendered from the server page
// which fetched matches once.
export function MatchList({ matches, predictionsByMatchId = {} }: MatchListProps) {
  const reduce = useReducedMotion();
  const [groupFilter, setGroupFilter] = useState<"all" | (typeof GROUP_LETTERS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [teamQuery, setTeamQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = teamQuery.trim().toLowerCase();
    return matches.filter((match) => {
      if (groupFilter !== "all" && match.group_letter !== groupFilter) return false;

      if (statusFilter !== "all") {
        const status = displayStatus(match);
        if (!statusMatches(status, statusFilter)) return false;
      }

      if (needle.length > 0) {
        const haystack = [
          match.home?.name,
          match.home?.code,
          match.home_team,
          match.away?.name,
          match.away?.code,
          match.away_team,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [matches, groupFilter, statusFilter, teamQuery]);

  const groups = useMemo(() => groupMatchesByDateLocal(filtered), [filtered]);

  const clearFilters = () => {
    setGroupFilter("all");
    setStatusFilter("all");
    setTeamQuery("");
  };

  const hasActiveFilter =
    groupFilter !== "all" || statusFilter !== "all" || teamQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4 shadow-card sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Team
            <input
              type="search"
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
              placeholder="Search team name or code"
              className="focus:ring-team-primary/20 h-10 rounded-lg border border-white/10 bg-surface-muted/50 px-3 text-sm font-normal normal-case text-heading shadow-inner outline-none transition placeholder:text-muted/60 focus:border-team-primary focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Group
            <select
              value={groupFilter}
              onChange={(e) =>
                setGroupFilter(e.target.value as "all" | (typeof GROUP_LETTERS)[number])
              }
              className="focus:ring-team-primary/20 h-10 rounded-lg border border-white/10 bg-surface-muted/50 px-3 text-sm font-medium normal-case text-heading shadow-inner outline-none transition focus:border-team-primary focus:ring-2"
            >
              <option value="all">All groups</option>
              {GROUP_LETTERS.map((letter) => (
                <option key={letter} value={letter}>
                  Group {letter}
                </option>
              ))}
            </select>
          </label>

          <StatusToggle value={statusFilter} onChange={setStatusFilter} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            Showing <span className="font-semibold text-heading">{filtered.length}</span> of{" "}
            {matches.length} matches
          </span>
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-7 items-center rounded-lg border border-white/10 bg-surface-muted/40 px-2 text-xs font-medium text-muted transition hover:border-team-primary/30 hover:text-heading"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-muted">
          No matches match your filters.
        </p>
      ) : (
        <div className="space-y-8">
          {(() => {
            let rowIndex = 0;
            return groups.map((group) => (
              <section key={group.key} aria-labelledby={`match-day-${group.key}`}>
                <h2
                  id={`match-day-${group.key}`}
                  className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted"
                >
                  {group.label}
                </h2>
                <ul className="space-y-3">
                  {group.matches.map((match) => {
                    const i = rowIndex++;
                    return (
                      <motion.li
                        key={match.id}
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: reduce ? 0 : i * 0.03,
                          duration: reduce ? 0 : 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <MatchCard
                          match={match}
                          prediction={predictionsByMatchId[match.id] ?? null}
                        />
                      </motion.li>
                    );
                  })}
                </ul>
              </section>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Final" },
];

function StatusToggle({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Status</span>
      <div
        role="tablist"
        aria-label="Filter matches by status"
        className="inline-flex h-10 max-w-full items-stretch overflow-x-auto rounded-lg border border-white/10 bg-surface-muted/40 p-0.5 shadow-inner [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STATUS_TABS.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={`shrink-0 rounded-md px-3 text-xs font-semibold transition ${
                active
                  ? "bg-team-primary/25 text-heading shadow-sm ring-1 ring-team-primary/35"
                  : "text-muted hover:text-heading"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function statusMatches(status: MatchStatus, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "upcoming") return status === "scheduled";
  if (filter === "live") return status === "live";
  if (filter === "finished") return status === "finished";
  return true;
}
