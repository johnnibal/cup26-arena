"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminMatchResultRow } from "@/components/admin/AdminMatchResultRow";
import { groupMatchesByDateLocal } from "@/lib/kickoff-display";
import type { MatchResultCorrection, MatchWithTeams } from "@/types/domain";

type AdminResultsClientProps = {
  matches: MatchWithTeams[];
  correctionsByMatchId: Record<string, MatchResultCorrection[]>;
  correctorNames: Record<string, string | null>;
};

export function AdminResultsClient({
  matches,
  correctionsByMatchId,
  correctorNames,
}: AdminResultsClientProps) {
  const groups = useMemo(() => groupMatchesByDateLocal(matches), [matches]);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const notify = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
  }, []);

  return (
    <>
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`admin-day-${group.key}`}>
            <h2
              id={`admin-day-${group.key}`}
              className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              {group.label}
            </h2>
            <ul className="space-y-4">
              {group.matches.map((m) => (
                <li key={`${m.id}-${m.home_score ?? "x"}-${m.away_score ?? "x"}-${m.status}`}>
                  <AdminMatchResultRow
                    match={m}
                    corrections={correctionsByMatchId[m.id] ?? []}
                    correctorNames={correctorNames}
                    onNotify={notify}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {toast ? (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-card ${
            toast.type === "success"
              ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
              : "border-rose-400/35 bg-rose-500/15 text-rose-200"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </>
  );
}
