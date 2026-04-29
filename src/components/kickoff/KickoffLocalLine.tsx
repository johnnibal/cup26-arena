import { formatKickoffDateLocal, formatKickoffTimeLocal } from "@/lib/kickoff-display";

type KickoffLocalLineProps = {
  iso: string;
  className?: string;
};

/** Date and 24h time in Europe/Berlin; formatting is locale-fixed for stable SSR/hydration. */
export function KickoffLocalLine({ iso, className = "" }: KickoffLocalLineProps) {
  return (
    <span className={className}>
      <span className="font-medium">{formatKickoffDateLocal(iso)}</span>
      <span className="tabular-nums"> · {formatKickoffTimeLocal(iso)}</span>
    </span>
  );
}
