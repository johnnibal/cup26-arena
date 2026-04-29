// Cup26 Arena - shared prediction constants.
// Lives in its own module so both the "use server" action file and
// client components (ScoreInput) can import without hitting Next's
// "only async exports from a 'use server' file" rule.

export const SCORE_MIN = 0;
export const SCORE_MAX = 20;
