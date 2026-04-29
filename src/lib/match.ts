import { KICKOFF_DISPLAY_TIME_ZONE } from "@/lib/kickoff-constants";
import type { Match, MatchStatus, MatchWithTeams, Prediction } from "@/types/domain";

/** UI-level status for the prediction card on the match detail page. */
export type PredictionUIStatus = "not_predicted" | "saved" | "locked" | "finished" | "cancelled";

// Combines match state + whether a prediction exists into a single state
// string the UI can switch on. Called both on the list (for the small badge)
// and on the detail page (to decide between form / locked / result card).
export function getPredictionStatus(
  match: Pick<Match, "status" | "kickoff_at">,
  prediction: Pick<Prediction, "id"> | null,
): PredictionUIStatus {
  if (match.status === "cancelled") return "cancelled";
  if (match.status === "finished") return "finished";
  const ui = displayStatus(match);
  if (ui === "live") return "locked";
  return prediction ? "saved" : "not_predicted";
}

// Intl formatters below use Europe/Berlin for deterministic grouping if these
// helpers are used. Prefer `@/lib/kickoff-display` for user-visible kickoff text.

// Intl formatters are lazily cached so the hot path in the list page
// doesn't re-allocate them per row.
let dateFormatter: Intl.DateTimeFormat | null = null;
let timeFormatter: Intl.DateTimeFormat | null = null;
let dayKeyFormatter: Intl.DateTimeFormat | null = null;

function getDateFormatter(): Intl.DateTimeFormat {
  dateFormatter ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: KICKOFF_DISPLAY_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return dateFormatter;
}

function getTimeFormatter(): Intl.DateTimeFormat {
  timeFormatter ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: KICKOFF_DISPLAY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return timeFormatter;
}

function getDayKeyFormatter(): Intl.DateTimeFormat {
  dayKeyFormatter ??= new Intl.DateTimeFormat("en-CA", {
    timeZone: KICKOFF_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dayKeyFormatter;
}

export function formatKickoffDate(isoString: string): string {
  return getDateFormatter().format(new Date(isoString));
}

export function formatKickoffTime(isoString: string): string {
  return getTimeFormatter().format(new Date(isoString));
}

export function kickoffDayKey(isoString: string): string {
  return getDayKeyFormatter().format(new Date(isoString));
}

// Computed UI status:
//   - 'scheduled' rows whose kickoff has already passed are displayed as 'live'
//     so the list doesn't show a stale "upcoming" badge after the whistle.
//   - Any row with status !== 'scheduled' is returned unchanged.
export function displayStatus(match: Pick<Match, "status" | "kickoff_at">): MatchStatus {
  if (match.status !== "scheduled") return match.status;
  const kickoff = Date.parse(match.kickoff_at);
  if (Number.isFinite(kickoff) && Date.now() >= kickoff) return "live";
  return "scheduled";
}

export type MatchDateGroup = {
  /** Stable YYYY-MM-DD key used for React keys + filtering. */
  key: string;
  /** Human-readable heading e.g. "Thursday, 11 June 2026". */
  label: string;
  matches: MatchWithTeams[];
};

// Groups matches into date buckets, preserving input chronological order
// (which is already what `getAllMatches()` returns).
export function groupMatchesByDate(matches: MatchWithTeams[]): MatchDateGroup[] {
  const groups = new Map<string, MatchDateGroup>();
  for (const match of matches) {
    const key = kickoffDayKey(match.kickoff_at);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: formatKickoffDate(match.kickoff_at),
        matches: [],
      };
      groups.set(key, group);
    }
    group.matches.push(match);
  }
  return Array.from(groups.values());
}

// Best-effort short team name for tight UI surfaces (e.g. list cards).
// Falls back to the 3-letter code when the team itself isn't joined.
export function teamShortLabel(
  team: { code: string; name: string } | null,
  fallback: string,
): string {
  if (!team) return fallback;
  return team.name;
}
