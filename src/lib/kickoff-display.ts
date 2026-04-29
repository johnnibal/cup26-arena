// Kickoff display helpers: format `kickoff_at` (ISO timestamptz) in Europe/Berlin.
// SQL seeds interpret DATE+TIME as Germany wall-clock; the UI matches that zone.

import { KICKOFF_DISPLAY_TIME_ZONE } from "@/lib/kickoff-constants";
import type { MatchDateGroup } from "@/lib/match";
import type { MatchWithTeams } from "@/types/domain";

export { KICKOFF_DISPLAY_TIME_ZONE };

export const KICKOFF_TIME_DISCLAIMER =
  "Kickoff date and time are shown in Germany (Europe/Berlin), matching the schedule data.";

const dateOpts: Intl.DateTimeFormatOptions = {
  timeZone: KICKOFF_DISPLAY_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

const timeOpts: Intl.DateTimeFormatOptions = {
  timeZone: KICKOFF_DISPLAY_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
};

const dayKeyOpts: Intl.DateTimeFormatOptions = {
  timeZone: KICKOFF_DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

/** Long date in the user's locale, Europe/Berlin wall time. */
export function formatKickoffDateLocal(isoString: string): string {
  return new Intl.DateTimeFormat(undefined, dateOpts).format(new Date(isoString));
}

/** Time (locale default hour cycle) in Europe/Berlin. */
export function formatKickoffTimeLocal(isoString: string): string {
  return new Intl.DateTimeFormat(undefined, timeOpts).format(new Date(isoString));
}

/** Calendar day key in Europe/Berlin (YYYY-MM-DD). */
export function kickoffDayKeyLocal(isoString: string): string {
  return new Intl.DateTimeFormat("en-CA", dayKeyOpts).format(new Date(isoString));
}

// Group fixtures by Berlin calendar day (for /matches and other UIs).
export function groupMatchesByDateLocal(matches: MatchWithTeams[]): MatchDateGroup[] {
  const groups = new Map<string, MatchDateGroup>();
  for (const match of matches) {
    const key = kickoffDayKeyLocal(match.kickoff_at);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: formatKickoffDateLocal(match.kickoff_at),
        matches: [],
      };
      groups.set(key, group);
    }
    group.matches.push(match);
  }
  return Array.from(groups.values());
}
