"use client";

import { useEffect, useState } from "react";

type KickoffCountdownProps = {
  /** ISO 8601 kickoff timestamp. */
  kickoffAt: string;
  /** Optional label used before kickoff (e.g. "Kicks off in"). */
  label?: string;
};

// Live ticking countdown until kickoff. Updates every second, cleans up on
// unmount. After kickoff the "Kicks off in" header swaps to "Kickoff!" and
// the timer stops updating so we don't spin the main thread.
export function KickoffCountdown({ kickoffAt, label = "Kicks off in" }: KickoffCountdownProps) {
  const target = Date.parse(kickoffAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Don't bother ticking if kickoff is already in the past.
    if (!Number.isFinite(target) || Date.now() >= target) return;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= target) {
        clearInterval(interval);
      }
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!Number.isFinite(target)) {
    return <p className="text-sm text-muted">Kickoff time unavailable.</p>;
  }

  const remaining = target - now;

  if (remaining <= 0) {
    return (
      <p className="text-sm font-bold uppercase tracking-wide text-rose-400">Kickoff!</p>
    );
  }

  const parts = splitDuration(remaining);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div
        className="mt-2 flex items-end gap-3 font-bold tabular-nums text-team-primary"
        aria-live="polite"
      >
        <Unit value={parts.days} label="d" />
        <Unit value={parts.hours} label="h" />
        <Unit value={parts.minutes} label="m" />
        <Unit value={parts.seconds} label="s" />
      </div>
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-3xl leading-none text-heading sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
    </span>
  );
}

function splitDuration(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}
