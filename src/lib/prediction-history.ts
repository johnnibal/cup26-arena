import { displayStatus } from "@/lib/match";
import type { MatchWithTeams, Prediction } from "@/types/domain";

export type PredictionHistoryFilter = "all" | "exact" | "correct_result" | "wrong";

export type PredictionHistoryOutcome =
  | "upcoming"
  | "live"
  | "pending_result"
  | "exact"
  | "correct_result"
  | "wrong"
  | "cancelled";

export function getPredictionHistoryOutcome(
  match: MatchWithTeams,
  prediction: Prediction,
): PredictionHistoryOutcome {
  if (match.status === "cancelled") return "cancelled";
  const ui = displayStatus(match);
  if (ui === "scheduled") return "upcoming";
  if (ui === "live") return "live";
  if (prediction.points === null || prediction.is_exact === null) return "pending_result";
  if (prediction.is_exact) return "exact";
  if (prediction.points === 1) return "correct_result";
  return "wrong";
}

export function historyRowMatchesFilter(
  filter: PredictionHistoryFilter,
  match: MatchWithTeams,
  prediction: Prediction,
): boolean {
  if (filter === "all") return true;
  const o = getPredictionHistoryOutcome(match, prediction);
  if (filter === "exact") return o === "exact";
  if (filter === "correct_result") return o === "correct_result";
  if (filter === "wrong") return o === "wrong";
  return true;
}

export function outcomeLabel(outcome: PredictionHistoryOutcome): string {
  switch (outcome) {
    case "upcoming":
      return "Upcoming";
    case "live":
      return "Live";
    case "pending_result":
      return "Awaiting points";
    case "exact":
      return "Exact score";
    case "correct_result":
      return "Correct result";
    case "wrong":
      return "No points";
    case "cancelled":
      return "Cancelled";
    default:
      return outcome;
  }
}
