import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { requireAdmin } from "@/lib/auth-admin";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <PagePlaceholder
      step="Admin"
      title="Admin dashboard"
      description="Overview of fixtures, recent result entries, and quick actions for admins only."
    />
  );
}
