"use client";

import { useId } from "react";

import { SCORE_MAX, SCORE_MIN } from "@/lib/predictions";

type ScoreInputProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  /** Optional sub-label shown under the main one (e.g. team code). */
  sublabel?: string;
  /** Override clamp range (defaults to prediction bounds 0–20). */
  min?: number;
  max?: number;
};

// Single-digit-style score picker with plus/minus steppers. The underlying
// <input type="number"> keeps the keyboard story sane: Up/Down arrows
// nudge by one, touch devices get the numeric keypad, and tabbing works.
// Clamp happens in `clamp()` so out-of-range values can never hit the
// server action (which has its own hard validator as a belt-and-braces
// defense).
export function ScoreInput({
  label,
  value,
  onChange,
  disabled,
  sublabel,
  min = SCORE_MIN,
  max = SCORE_MAX,
}: ScoreInputProps) {
  const id = useId();

  const step = (delta: number) => {
    if (disabled) return;
    onChange(clamp(value + delta, min, max));
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label
        htmlFor={id}
        className="text-center text-xs font-semibold uppercase tracking-wide text-muted"
      >
        {label}
        {sublabel ? (
          <span className="mt-0.5 block text-[10px] font-medium text-muted/80">{sublabel}</span>
        ) : null}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-muted/60 text-lg font-semibold text-heading shadow-sm transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>

        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10), min, max))}
          disabled={disabled}
          aria-label={label}
          className="focus:ring-team-primary/20 h-14 w-16 rounded-lg border border-zinc-600/40 bg-[#121722] text-center text-3xl font-bold tabular-nums text-zinc-50 caret-team-primary shadow-inner outline-none transition [appearance:textfield] [color-scheme:dark] placeholder:text-zinc-600 focus:border-team-primary/60 focus:ring-2 disabled:cursor-not-allowed disabled:border-zinc-700/50 disabled:bg-zinc-900/80 disabled:text-zinc-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-muted/60 text-lg font-semibold text-heading shadow-sm transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const integer = Math.trunc(value);
  if (integer < min) return min;
  if (integer > max) return max;
  return integer;
}
