import type { PredictionUIStatus } from "@/lib/match";
import type { Prediction } from "@/types/domain";

type PredictionBadgeProps = {
  prediction: Prediction | null;
  status: PredictionUIStatus;
};

// Tiny pill rendered on each /matches list card. Compact enough to fit
// next to the status badge without stealing attention. Hidden entirely
// for cancelled matches.
export function PredictionBadge({ prediction, status }: PredictionBadgeProps) {
  if (status === "cancelled") return null;

  if (status === "finished") {
    const points = prediction?.points ?? null;
    if (!prediction) {
      return <Pill tone="muted">No pick</Pill>;
    }
    if (points === null) {
      return (
        <Pill tone="muted">
          {prediction.home_score}–{prediction.away_score}
        </Pill>
      );
    }
    return (
      <Pill tone={points > 0 ? "success" : "muted"}>
        +{points} pt{points === 1 ? "" : "s"}
      </Pill>
    );
  }

  if (!prediction) {
    return <Pill tone="accent">Predict</Pill>;
  }

  return (
    <Pill tone="info">
      {status === "locked" ? "Locked" : "Your pick"} · {prediction.home_score}–
      {prediction.away_score}
    </Pill>
  );
}

type Tone = "muted" | "accent" | "info" | "success";

const TONE_CLASSES: Record<Tone, string> = {
  muted: "bg-white/[0.06] text-muted ring-1 ring-inset ring-white/10",
  accent:
    "bg-brand-accent/15 text-rose-200 ring-1 ring-inset ring-brand-accent/35",
  info: "bg-team-primary/20 text-heading ring-1 ring-inset ring-team-primary/35",
  success: "bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/35",
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex max-w-[11rem] items-center truncate rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
