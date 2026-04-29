import { KICKOFF_TIME_DISCLAIMER } from "@/lib/kickoff-display";

type KickoffTimeDisclaimerProps = {
  className?: string;
};

export function KickoffTimeDisclaimer({ className = "" }: KickoffTimeDisclaimerProps) {
  if (!KICKOFF_TIME_DISCLAIMER) return null;
  return (
    <p role="note" className={`text-xs leading-relaxed text-muted ${className}`}>
      {KICKOFF_TIME_DISCLAIMER}
    </p>
  );
}
