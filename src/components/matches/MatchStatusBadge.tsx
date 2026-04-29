import type { MatchStatus } from "@/types/domain";

const BADGE_STYLES: Record<MatchStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Upcoming",
    className:
      "bg-white/[0.06] text-muted ring-1 ring-inset ring-white/10",
  },
  live: {
    label: "Live",
    className: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/40",
  },
  finished: {
    label: "Final",
    className: "bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/35",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-amber-500/12 text-amber-200 ring-1 ring-inset ring-amber-400/35",
  },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const style = BADGE_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.className}`}
    >
      {status === "live" ? (
        <span
          aria-hidden
          className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
        />
      ) : null}
      {style.label}
    </span>
  );
}
