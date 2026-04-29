import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { requireAdmin } from "@/lib/auth-admin";

export const metadata = { title: "Admin - Matches" };

export default async function AdminMatchesPage() {
  await requireAdmin();

  return (
    <PagePlaceholder
      step="Admin / Matches"
      title="Manage fixtures"
      description="Create and edit group-stage fixtures here. Access restricted to admin users."
    />
  );
}
