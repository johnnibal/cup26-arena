"use client";

import { useEffect, useState } from "react";

import { formatKickoffDateLocal, formatKickoffTimeLocal } from "@/lib/kickoff-display";

type KickoffLocalLineProps = {
  iso: string;
  className?: string;
};

// Kickoff date/time use a fixed Europe/Berlin zone; locale may still differ
// between SSR and the browser, so we render after mount to avoid hydration mismatches.
export function KickoffLocalLine({ iso, className = "" }: KickoffLocalLineProps) {
  const [parts, setParts] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    setParts({
      date: formatKickoffDateLocal(iso),
      time: formatKickoffTimeLocal(iso),
    });
  }, [iso]);

  if (!parts) {
    return (
      <span className={className}>
        <span className="font-medium text-muted">…</span>
      </span>
    );
  }

  return (
    <span className={className}>
      <span className="font-medium">{parts.date}</span>
      <span className="tabular-nums"> · {parts.time}</span>
    </span>
  );
}
