import { AdminResultsClient } from "@/components/admin/AdminResultsClient";
import { KickoffTimeDisclaimer } from "@/components/kickoff/KickoffTimeDisclaimer";
import { requireAdmin } from "@/lib/auth-admin";
import { getCorrectionsByMatchIds } from "@/lib/data/corrections";
import { getGroupStageMatches } from "@/lib/data/matches";
import { getDisplayNameMap } from "@/lib/data/profiles";
import type { MatchResultCorrection } from "@/types/domain";

export const metadata = { title: "Admin · Results" };

export default async function AdminResultsPage() {
  await requireAdmin();

  const matches = await getGroupStageMatches();
  const matchIds = matches.map((m) => m.id);
  const correctionsMap = await getCorrectionsByMatchIds(matchIds);

  const allCorrections: MatchResultCorrection[] = [...correctionsMap.values()].flat();
  const correctorIds = [
    ...new Set(
      allCorrections
        .map((c) => c.corrected_by)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];
  const displayNameMap = await getDisplayNameMap(correctorIds);
  const correctorNames = Object.fromEntries(displayNameMap);

  const correctionsByMatchId = Object.fromEntries(correctionsMap) as Record<
    string,
    MatchResultCorrection[]
  >;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Admin</p>
        <h1 className="text-2xl font-bold tracking-tight text-heading">Result entry &amp; corrections</h1>
        <p className="max-w-3xl text-sm text-muted">
          Enter full-time scores for group-stage fixtures or correct mistakes. Each save runs{" "}
          <code className="rounded border border-white/10 bg-surface-muted/80 px-1.5 py-0.5 text-xs text-heading">
            apply_match_correction
          </code>{" "}
          so predictions are rescored and affected user stats recomputed automatically.
        </p>
        <KickoffTimeDisclaimer className="mt-2 max-w-2xl" />
      </header>

      <AdminResultsClient
        matches={matches}
        correctionsByMatchId={correctionsByMatchId}
        correctorNames={correctorNames}
      />
    </div>
  );
}
