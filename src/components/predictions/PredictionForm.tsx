"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ScoreInput } from "@/components/predictions/ScoreInput";
import { savePrediction } from "@/lib/actions/predictions";
import type { PredictionUIStatus } from "@/lib/match";
import type { MatchWithTeams, Prediction } from "@/types/domain";

type PredictionFormProps = {
  match: MatchWithTeams;
  initialPrediction: Prediction | null;
  status: PredictionUIStatus;
};

// The full prediction card rendered at the bottom of /matches/[id].
// Branches on `status`:
//   - 'finished'     -> read-only result + points breakdown
//   - 'cancelled'    -> brief notice, no form
//   - 'locked'       -> read-only view of the saved pick (or "no pick" note)
//   - 'saved'        -> editable form pre-filled with the saved pick
//   - 'not_predicted'-> editable form starting at 0-0
export function PredictionForm({ match, initialPrediction, status }: PredictionFormProps) {
  if (status === "cancelled") {
    return (
      <Shell>
        <Heading title="Match cancelled" subtitle="No points are awarded for this fixture." />
      </Shell>
    );
  }

  if (status === "finished") {
    return <FinishedView match={match} prediction={initialPrediction} />;
  }

  if (status === "locked") {
    return <LockedView prediction={initialPrediction} />;
  }

  return (
    <EditableForm
      match={match}
      initialPrediction={initialPrediction}
      isSaved={status === "saved"}
    />
  );
}

// ---------------------------------------------------------------------------
// Editable state (status: not_predicted | saved)
// ---------------------------------------------------------------------------

function EditableForm({
  match,
  initialPrediction,
  isSaved,
}: {
  match: MatchWithTeams;
  initialPrediction: Prediction | null;
  isSaved: boolean;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(initialPrediction?.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(initialPrediction?.away_score ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [pending, startTransition] = useTransition();

  // Dirty = current inputs differ from the last saved snapshot.
  const isDirty =
    !initialPrediction ||
    homeScore !== initialPrediction.home_score ||
    awayScore !== initialPrediction.away_score;

  useEffect(() => {
    if (!initialPrediction) return;
    setHomeScore(initialPrediction.home_score);
    setAwayScore(initialPrediction.away_score);
  }, [initialPrediction?.id, initialPrediction?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps -- sync only after server saves

  const handleSubmit = () => {
    setError(null);
    setSavedFeedback(false);
    startTransition(async () => {
      const result = await savePrediction(match.id, homeScore, awayScore);
      if (result.ok) {
        setSavedFeedback(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Shell>
      <Heading
        title={isSaved ? "Your prediction" : "Make your prediction"}
        subtitle={
          isSaved
            ? "Change your mind? Update your pick any time before kickoff."
            : "Lock in your final score. Exact = 3 pts, correct result = 1 pt."
        }
      />

      <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
        <ScoreInput
          label={match.home?.name ?? match.home_team ?? "Home"}
          sublabel={match.home?.code ?? match.home_team ?? undefined}
          value={homeScore}
          onChange={setHomeScore}
          disabled={pending}
        />
        <span aria-hidden className="text-2xl font-bold text-muted">
          :
        </span>
        <ScoreInput
          label={match.away?.name ?? match.away_team ?? "Away"}
          sublabel={match.away?.code ?? match.away_team ?? undefined}
          value={awayScore}
          onChange={setAwayScore}
          disabled={pending}
        />
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !isDirty}
          whileTap={reduce || pending || !isDirty ? undefined : { scale: 0.98 }}
          className="hover:bg-team-primary/90 inline-flex h-11 min-w-[10rem] items-center justify-center rounded-xl border border-team-secondary/25 bg-team-primary px-5 text-sm font-semibold text-team-ink shadow-glow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Saving..."
            : isSaved
              ? isDirty
                ? "Update prediction"
                : "Saved"
              : "Save prediction"}
        </motion.button>

        {error ? (
          <p role="alert" className="text-xs font-medium text-rose-400">
            {error}
          </p>
        ) : null}
        {!error && savedFeedback ? (
          <p role="status" className="text-xs font-medium text-emerald-400">
            Saved.
          </p>
        ) : null}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Locked state (kickoff passed, match not finished yet)
// ---------------------------------------------------------------------------

function LockedView({ prediction }: { prediction: Prediction | null }) {
  return (
    <Shell>
      <Heading
        title="Predictions locked"
        subtitle="Kickoff has started. Points will be awarded once the final result is confirmed."
      />

      <div className="mt-4 flex items-center justify-center">
        {prediction ? (
          <ScorePill
            label="Your pick"
            home={prediction.home_score}
            away={prediction.away_score}
            tone="slate"
          />
        ) : (
          <p className="text-sm text-muted">
            You didn&apos;t submit a prediction for this match.
          </p>
        )}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Finished state (show your pick vs final, + points earned)
// ---------------------------------------------------------------------------

function FinishedView({
  match,
  prediction,
}: {
  match: MatchWithTeams;
  prediction: Prediction | null;
}) {
  const hasFinal = match.home_score !== null && match.away_score !== null;
  const points = prediction?.points ?? null;
  const isExact = prediction?.is_exact ?? null;

  return (
    <Shell>
      <Heading title="Result" subtitle="Full-time. See how your prediction did." />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {hasFinal ? (
          <ScorePill
            label="Final"
            home={match.home_score!}
            away={match.away_score!}
            tone="primary"
          />
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-sm text-muted">
            Final score pending.
          </div>
        )}

        {prediction ? (
          <ScorePill
            label="Your pick"
            home={prediction.home_score}
            away={prediction.away_score}
            tone="slate"
          />
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-sm text-muted">
            No prediction submitted.
          </div>
        )}
      </div>

      {prediction && points !== null ? (
        <div className="mt-5 flex items-center justify-center">
          <PointsBanner points={points} isExact={isExact ?? false} />
        </div>
      ) : null}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Shared UI bits
// ---------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="glass-panel team-border-gradient relative overflow-hidden rounded-2xl p-6 shadow-card ring-1 ring-team-secondary/15 sm:p-8">
      <div
        aria-hidden
        className="team-pulse-bg pointer-events-none absolute inset-0 opacity-[0.18]"
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col gap-1 text-center sm:text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
        Your prediction
      </p>
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      <p className="text-sm text-muted">{subtitle}</p>
    </header>
  );
}

function ScorePill({
  label,
  home,
  away,
  tone,
}: {
  label: string;
  home: number;
  away: number;
  tone: "primary" | "slate";
}) {
  const numClass = tone === "primary" ? "text-team-primary" : "text-heading";
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-surface-muted/50 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-baseline gap-2 font-bold tabular-nums">
        <span className={`text-3xl ${numClass}`}>{home}</span>
        <span className="text-xl text-muted/80">:</span>
        <span className={`text-3xl ${numClass}`}>{away}</span>
      </span>
    </div>
  );
}

function PointsBanner({ points, isExact }: { points: number; isExact: boolean }) {
  const earned = points > 0;
  const bg = earned
    ? "bg-emerald-500/12 border-emerald-400/35"
    : "bg-white/[0.04] border-white/10";
  const text = earned ? "text-emerald-300" : "text-muted";
  const message = isExact
    ? "Exact score. Nice one."
    : points === 1
      ? "Correct result."
      : "No points this time.";

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-2 ${bg} ${text}`}>
      <span className="text-2xl font-bold tabular-nums">
        +{points} pt{points === 1 ? "" : "s"}
      </span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
