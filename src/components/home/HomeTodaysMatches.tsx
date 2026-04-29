"use client";

import Link from "next/link";
import { useMemo } from "react";

import { KickoffTimeDisclaimer } from "@/components/kickoff/KickoffTimeDisclaimer";
import { AvatarFlag } from "@/components/profile/AvatarFlag";
import { formatKickoffTimeLocal, kickoffDayKeyLocal } from "@/lib/kickoff-display";
import { displayStatus } from "@/lib/match";
import type { MatchWithTeams } from "@/types/domain";

type HomeTodaysMatchesProps = {
  matches: MatchWithTeams[];
};

export function HomeTodaysMatches({ matches }: HomeTodaysMatchesProps) {
  const { heading, subtitle, rows } = useMemo(() => {
    const now = Date.now();
    const todayKey = kickoffDayKeyLocal(new Date().toISOString());

    const todays = matches.filter((m) => kickoffDayKeyLocal(m.kickoff_at) === todayKey);

    if (todays.length > 0) {
      return {
        heading: "Today's matches",
        subtitle: "Kickoffs in Germany time (Europe/Berlin).",
        rows: todays,
      };
    }

    const upcoming = matches.filter((m) => new Date(m.kickoff_at).getTime() >= now);
    const fallback = upcoming.slice(0, 5);

    return {
      heading: "Next up",
      subtitle:
        upcoming.length > 0
          ? "No fixtures today, here's what's coming soon."
          : "The group stage has wrapped,see final results on the fixtures page.",
      rows: fallback,
    };
  }, [matches]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-heading sm:text-xl">{heading}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <Link
          href="/matches"
          className="text-sm font-semibold text-team-primary transition hover:text-team-accent"
        >
          All matches →
        </Link>
      </div>
      <KickoffTimeDisclaimer className="max-w-2xl" />

      {rows.length === 0 ? (
        <div className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-muted">
          No fixtures to show.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <HomeMatchPreview key={m.id} match={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

function HomeMatchPreview({ match }: { match: MatchWithTeams }) {
  const status = displayStatus(match);
  const home = match.home;
  const away = match.away;
  const homeName = home?.name ?? match.home_team ?? "TBD";
  const awayName = away?.name ?? match.away_team ?? "TBD";
  const time = formatKickoffTimeLocal(match.kickoff_at);

  return (
    <li>
      <Link
        href={`/matches/${match.id}`}
        className="glass-panel group flex flex-col gap-4 rounded-2xl p-4 shadow-card transition hover:-translate-y-0.5 hover:border-team-primary/25 hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex -space-x-3">
            <AvatarFlag team={home} size="md" showCode={false} parentGroupHover coloredGlow={false} />
            <AvatarFlag team={away} size="md" showCode={false} parentGroupHover coloredGlow={false} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-heading sm:text-base">
              {homeName} <span className="font-normal text-muted">vs</span> {awayName}
            </p>
            <p className="text-xs text-muted">
              Group {match.group_letter}
              {match.venue ? ` · ${match.venue}` : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
          <span
            className="text-sm font-semibold tabular-nums text-heading"
            suppressHydrationWarning
          >
            {time}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              status === "live"
                ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40"
                : status === "finished"
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/35"
                  : "bg-white/[0.06] text-muted ring-1 ring-white/10"
            }`}
          >
            {status === "live" ? "Live" : status === "finished" ? "Final" : "Upcoming"}
          </span>
        </div>
      </Link>
    </li>
  );
}
