import Link from "next/link";

import { KickoffLocalLine } from "@/components/kickoff/KickoffLocalLine";
import { KickoffTimeDisclaimer } from "@/components/kickoff/KickoffTimeDisclaimer";
import { AvatarFlag } from "@/components/profile/AvatarFlag";
import type { MatchWithTeams, Team } from "@/types/domain";

type HomeFavoriteNextProps = {
  team: Team | null;
  nextMatch: MatchWithTeams | null;
};

export function HomeFavoriteNext({ team, nextMatch }: HomeFavoriteNextProps) {
  if (!team) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-dashed border-team-accent/35 bg-gradient-to-br from-team-primary/15 via-surface-muted/40 to-transparent p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-brand-accent/10 blur-3xl"
        />
        <h2 className="text-lg font-semibold tracking-tight text-heading sm:text-xl">
          Your team&apos;s next match
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Choose a favorite nation to see their next kickoff here and unlock team colors across the
          arena.
        </p>
        <Link
          href="/profile"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
        >
          Pick your team
        </Link>
      </section>
    );
  }

  if (!nextMatch) {
    return (
      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <AvatarFlag team={team} size="lg" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-heading sm:text-xl">
              Your team&apos;s next match
            </h2>
            <p className="mt-1 text-sm text-muted">
              No upcoming group-stage fixture found for {team.name}. Check the full schedule for
              updates.
            </p>
          </div>
        </div>
        <Link
          href="/matches"
          className="mt-5 inline-flex text-sm font-semibold text-team-primary transition hover:text-team-accent"
        >
          Browse all matches →
        </Link>
      </section>
    );
  }

  const home = nextMatch.home;
  const away = nextMatch.away;
  const homeName = home?.name ?? nextMatch.home_team ?? "TBD";
  const awayName = away?.name ?? nextMatch.away_team ?? "TBD";
  const isHome = nextMatch.home_team === team.code;

  return (
    <section className="glass-panel team-border-gradient relative overflow-hidden rounded-3xl p-6 shadow-glow sm:p-8">
      <div
        aria-hidden
        className="team-pulse-bg pointer-events-none absolute inset-0 opacity-35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-team-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-team-secondary/15 blur-2xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <AvatarFlag team={team} size="lg" className="shrink-0" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-team-primary">
              {team.name} · Group {team.group_letter}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-heading">Next match</h2>
            <p className="mt-1 text-sm text-muted">
              {isHome ? "Home" : "Away"} vs {isHome ? awayName : homeName}
            </p>
            <p className="mt-3 text-sm font-medium text-heading">
              <KickoffLocalLine iso={nextMatch.kickoff_at} />
            </p>
            <KickoffTimeDisclaimer className="mt-2 max-w-xl" />
            {nextMatch.venue ? (
              <p className="mt-2 text-xs text-muted">{nextMatch.venue}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl border border-team-secondary/20 bg-surface-muted/55 px-5 py-4 shadow-inner sm:gap-4">
          <AvatarFlag team={home} size="md" showCode={false} coloredGlow={false} />
          <span className="text-xs font-bold uppercase tracking-widest text-muted">vs</span>
          <AvatarFlag team={away} size="md" showCode={false} coloredGlow={false} />
        </div>
      </div>
      <Link
        href={`/matches/${nextMatch.id}`}
        className="relative mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-team-primary px-5 text-sm font-semibold text-team-ink transition hover:brightness-110"
      >
        Match details
      </Link>
    </section>
  );
}
