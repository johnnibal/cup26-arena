import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, Team } from "@/types/domain";

export type AuthContext = {
  user: User;
  profile: Profile | null;
  team: Team | null;
};

type ProfileWithTeamRow = Profile & {
  // Supabase embeds may come back as an object or a single-element array
  // depending on SDK/Postgrest version. Normalised in code below.
  team: Team | Team[] | null;
};

// Cached for the lifetime of a single RSC render so layout + children
// (e.g. MainLayout, ThemeProvider, Navbar) share one round-trip to Supabase.
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Core profile + embedded team (no gradient_* here — if those columns are missing
  // in DB, listing them would make the whole query fail and you'd lose team + profile).
  const { data, error: profileError } = await supabase
    .from("profiles")
    .select(
      `id, display_name, avatar_url, favorite_team_code,
       team:teams!favorite_team_code (code, name, group_letter, primary_color, accent_color, iso2_code)`,
    )
    .eq("id", user.id)
    .maybeSingle<ProfileWithTeamRow>();

  if (profileError || !data) {
    return { user, profile: null, team: null };
  }

  const { team: rawTeam, ...profileBase } = data;
  let team: Team | null = Array.isArray(rawTeam) ? (rawTeam[0] ?? null) : (rawTeam ?? null);

  // If PostgREST embed is empty but FK is set, load the team row directly.
  if (!team && profileBase.favorite_team_code) {
    const { data: teamRow } = await supabase
      .from("teams")
      .select("code, name, group_letter, primary_color, accent_color, iso2_code")
      .eq("code", profileBase.favorite_team_code)
      .maybeSingle<Team>();
    team = teamRow ?? null;
  }

  // Optional theme columns (migration may not be applied yet).
  const { data: gradRow, error: gradError } = await supabase
    .from("profiles")
    .select("gradient_angle, gradient_primary_stop, gradient_secondary_stop, gradient_accent_stop, gradient_style")
    .eq("id", user.id)
    .maybeSingle();

  const { data: noteRow, error: noteError } = await supabase
    .from("profiles")
    .select("supporter_note")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = {
    ...profileBase,
    ...(gradError || !gradRow ? {} : gradRow),
    ...(noteError || !noteRow ? {} : { supporter_note: noteRow.supporter_note }),
  };

  return { user, profile, team };
});

// Use inside server components / route handlers that must not render for
// unauthenticated users. Middleware already redirects, this is a belt-and-braces
// check so a forgotten matcher can never leak authenticated-only content.
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}
