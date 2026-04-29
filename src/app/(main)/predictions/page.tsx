import { PredictionsHistoryClient } from "@/components/predictions/PredictionsHistoryClient";
import { getUserPredictionHistory } from "@/lib/data/predictions";
import { requireAuthContext } from "@/lib/auth";

export const metadata = { title: "My Predictions" };

export default async function PredictionsPage() {
  await requireAuthContext();
  const rows = await getUserPredictionHistory();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">History</p>
        <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">
          Your predictions
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Every pick you&apos;ve saved, with results and points once matches finish. Filter by how
          you scored.
        </p>
      </header>

      <PredictionsHistoryClient rows={rows} />
    </div>
  );
}
