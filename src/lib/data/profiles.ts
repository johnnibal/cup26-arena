import { createSupabaseServerClient } from "@/lib/supabase/server";

// Resolves profile display names for a set of user ids (e.g. correction authors).
export async function getDisplayNameMap(userIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);

  if (error) {
    throw new Error(`Failed to load profile names: ${error.message}`);
  }

  for (const row of data ?? []) {
    map.set(row.id as string, (row.display_name as string | null) ?? null);
  }
  return map;
}
