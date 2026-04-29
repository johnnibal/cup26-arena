import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Team } from "@/types/domain";

// Fetches every team, ordered for display in the flag picker:
// group letter first, then alphabetical by name.
// Cached per-request so /profile doesn't double-fetch when the navbar
// happens to render the same data.
export const getAllTeams = cache(async (): Promise<Team[]> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("teams")
    .select("code, name, group_letter, primary_color, accent_color, iso2_code")
    .order("group_letter", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load teams: ${error.message}`);
  }

  return data ?? [];
});
