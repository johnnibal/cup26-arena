"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ScoreInput } from "@/components/predictions/ScoreInput";
import { applyMatchCorrection } from "@/lib/actions/admin-results";
import { ADMIN_SCORE_MAX, ADMIN_SCORE_MIN } from "@/lib/admin-results";
import { KICKOFF_DISPLAY_TIME_ZONE } from "@/lib/kickoff-constants";
import { formatKickoffDateLocal, formatKickoffTimeLocal } from "@/lib/kickoff-display";
import type { MatchResultCorrection, MatchWithTeams } from "@/types/domain";

type AdminMatchResultRowProps = {
  match: MatchWithTeams;
  corrections: MatchResultCorrection[];
  correctorNames: Record<string, string | null>;
  onNotify: (type: "success" | "error", message: string) => void;
};

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: KICKOFF_DISPLAY_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AdminMatchResultRow({
  match,
  corrections,
  correctorNames,
  onNotify,
}: AdminMatchResultRowProps) {
  const router = useRouter();
  const [home, setHome] = useState(match.home_score ?? 0);
  const [away, setAway] = useState(match.away_score ?? 0);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setHome(match.home_score ?? 0);
    setAway(match.away_score ?? 0);
  }, [match.home_score, match.away_score, match.id]);

  const isFinished = match.status === "finished";
  const homeLabel = match.home?.name ?? match.home_team ?? "Home";
  const awayLabel = match.away?.name ?? match.away_team ?? "Away";

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await applyMatchCorrection(match.id, home, away, reason.trim() || null);
      if (result.ok) {
        onNotify(
          "success",
          isFinished
            ? "Correction applied. Predictions and stats were rescored."
            : "Final result saved. Predictions scored and user stats updated.",
        );
        setReason("");
        router.refresh();
      } else {
        onNotify("error", result.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide text-muted"
            suppressHydrationWarning
          >
            Group {match.group_letter} · {formatKickoffDateLocal(match.kickoff_at)} ·{" "}
            {formatKickoffTimeLocal(match.kickoff_at)}
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-ink">
            {homeLabel} <span className="font-normal text-muted">vs</span> {awayLabel}
          </p>
          {match.venue ? <p className="mt-0.5 text-xs text-muted">{match.venue}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isFinished
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                : match.status === "cancelled"
                  ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30"
                  : "bg-white/[0.06] text-muted ring-1 ring-white/10"
            }`}
          >
            {match.status}
          </span>
        </div>
      </div>

      {isFinished && match.home_score !== null && match.away_score !== null ? (
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-heading">Current result:</span>{" "}
          <span className="font-bold tabular-nums text-team-primary">
            {match.home_score} – {match.away_score}
          </span>
        </p>
      ) : !isFinished ? (
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-heading">No final result yet.</span> Enter the
          full-time score below.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-4 border-t border-surface-border pt-4 sm:flex-row sm:items-end sm:justify-center">
        <ScoreInput
          label={homeLabel}
          sublabel={match.home?.code ?? match.home_team ?? undefined}
          value={home}
          onChange={setHome}
          disabled={pending}
          min={ADMIN_SCORE_MIN}
          max={ADMIN_SCORE_MAX}
        />
        <span
          aria-hidden
          className="text-center text-2xl font-bold leading-none text-muted sm:mb-6 sm:self-end"
        >
          :
        </span>
        <ScoreInput
          label={awayLabel}
          sublabel={match.away?.code ?? match.away_team ?? undefined}
          value={away}
          onChange={setAway}
          disabled={pending}
          min={ADMIN_SCORE_MIN}
          max={ADMIN_SCORE_MAX}
        />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Note (optional)
        </span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={pending}
          rows={2}
          maxLength={2000}
          placeholder="e.g. VAR correction, typo fix…"
          className="focus:ring-team-primary/20 mt-1 w-full rounded-lg border border-white/10 bg-surface-muted/50 px-3 py-2 text-sm text-heading outline-none transition focus:border-team-primary focus:ring-2 disabled:bg-surface-muted"
        />
      </label>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="hover:bg-team-primary/90 inline-flex h-10 items-center justify-center rounded-md bg-team-primary px-4 text-sm font-semibold text-team-ink shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : isFinished ? "Apply correction" : "Save final result"}
        </button>
      </div>

      {corrections.length > 0 ? (
        <div className="mt-5 border-t border-surface-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Correction history
          </h3>
          <ul className="mt-2 space-y-2">
            {corrections.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-white/[0.08] bg-surface-muted/50 px-3 py-2 text-xs text-muted"
              >
                <p className="font-medium text-brand-ink">
                  {formatCorrectionDelta(c)}{" "}
                  <span className="font-normal text-muted/80">
                    · {dateTimeFmt.format(new Date(c.created_at))}
                  </span>
                </p>
                <p className="mt-0.5 text-muted/90">
                  By{" "}
                  {c.corrected_by
                    ? (correctorNames[c.corrected_by] ?? c.corrected_by.slice(0, 8) + "…")
                    : "—"}
                </p>
                {c.reason ? (
                  <p className="mt-1 italic text-muted">&ldquo;{c.reason}&rdquo;</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatCorrectionDelta(c: MatchResultCorrection): string {
  const prev =
    c.previous_home_score !== null && c.previous_away_score !== null
      ? `${c.previous_home_score}–${c.previous_away_score}`
      : "—";
  const next = `${c.new_home_score}–${c.new_away_score}`;
  return `${prev} → ${next}`;
}
