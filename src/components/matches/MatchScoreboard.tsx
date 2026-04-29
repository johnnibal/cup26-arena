import { AvatarFlag } from "@/components/profile/AvatarFlag";
import type { MatchWithTeams } from "@/types/domain";

type MatchScoreboardProps = {
  match: MatchWithTeams;
};

export type MatchTeamBlockProps = {
  team: MatchWithTeams["home"];
  fallbackCode: string;
  align: "left" | "right";
  /** When the block sits inside a `group` hover target (e.g. list row link). */
  parentGroupHover?: boolean;
};

// Shared with the matches list so detail and list share the same team layout.
export function MatchTeamBlock({ team, fallbackCode, align, parentGroupHover }: MatchTeamBlockProps) {
  const alignCls = align === "right" ? "sm:text-right" : "sm:text-left";
  const flexCls = align === "right" ? "sm:flex-row-reverse" : "sm:flex-row";

  return (
    <div
      className={`flex flex-col items-center gap-4 text-center sm:items-center ${flexCls} ${alignCls}`}
    >
      <AvatarFlag
        team={team}
        size="lg"
        showCode={false}
        className="shrink-0"
        parentGroupHover={parentGroupHover}
        coloredGlow={false}
      />
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-heading sm:text-xl">
          {team?.name ?? fallbackCode}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {team?.code ?? fallbackCode}
          {team?.group_letter ? ` · Group ${team.group_letter}` : null}
        </p>
      </div>
    </div>
  );
}

// Big two-team header on the match detail page.
// Shows the home team on the left, away team on the right, and the score
// (or "vs" if none yet) in the middle. Server-safe.
export function MatchScoreboard({ match }: MatchScoreboardProps) {
  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <MatchTeamBlock team={match.home} fallbackCode={match.home_team ?? "???"} align="right" />

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

      <MatchTeamBlock team={match.away} fallbackCode={match.away_team ?? "???"} align="left" />
    </div>
  );
}
