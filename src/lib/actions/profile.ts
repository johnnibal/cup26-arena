"use server";

import { revalidatePath } from "next/cache";

import {
  PROFILE_GRADIENT_STYLES,
  type ProfileGradientPrefs,
  type ProfileGradientStyle,
} from "@/lib/profile-gradient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DISPLAY_NAME_MIN = 1;
const DISPLAY_NAME_MAX = 40;
const SUPPORTER_NOTE_MAX = 500;
const TEAM_CODE_PATTERN = /^[A-Z]{3}$/;

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateDisplayName(formData: FormData): Promise<ActionResult> {
  const raw = formData.get("display_name");
  if (typeof raw !== "string") {
    return { ok: false, error: "Display name is required." };
  }

  const trimmed = raw.trim();
  if (trimmed.length < DISPLAY_NAME_MIN) {
    return { ok: false, error: "Display name cannot be empty." };
  }
  if (trimmed.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.` };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateSupporterNote(formData: FormData): Promise<ActionResult> {
  const raw = formData.get("supporter_note");
  if (typeof raw !== "string") {
    return { ok: false, error: "Invalid form data." };
  }

  const trimmed = raw.trim();
  if (trimmed.length > SUPPORTER_NOTE_MAX) {
    return {
      ok: false,
      error: `Supporter note must be ${SUPPORTER_NOTE_MAX} characters or fewer.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ supporter_note: trimmed.length ? trimmed : null })
    .eq("id", user.id);

  if (error) {
    const rawMsg = error.message ?? "";
    if (/supporter_note|schema cache|column.*profiles|Could not find the.*column/i.test(rawMsg)) {
      return {
        ok: false,
        error:
          "Your database is missing the supporter note column. Run the migration supabase/migrations/20260426150000_profile_supporter_note.sql in the Supabase SQL editor (or supabase db push), then try again.",
      };
    }
    return { ok: false, error: rawMsg };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateFavoriteTeam(code: string | null): Promise<ActionResult> {
  if (code !== null && !TEAM_CODE_PATTERN.test(code)) {
    return { ok: false, error: "Invalid team code." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  // Defence in depth: confirm the code really is a seeded team before writing.
  // The FK would reject an invalid code anyway, but this gives a nicer error.
  if (code !== null) {
    const { data: team } = await supabase
      .from("teams")
      .select("code")
      .eq("code", code)
      .maybeSingle<{ code: string }>();

    if (!team) {
      return { ok: false, error: `Team "${code}" not found.` };
    }
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ favorite_team_code: code })
    .eq("id", user.id)
    .select("id, favorite_team_code")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!updated) {
    return {
      ok: false,
      error:
        "No profile row was updated. Try refreshing the page or signing out and back in.",
    };
  }

  // Favorite team drives ThemeProvider + Navbar; profile page must refetch too.
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalizeStops(p1: number, p2: number, p3: number): [number, number, number] {
  const a = clampInt(p1, 0, 100);
  let b = clampInt(p2, 0, 100);
  let c = clampInt(p3, 0, 100);
  if (b < a) b = a;
  if (c < b) c = b;
  return [a, b, c];
}

export async function updateProfileTheme(prefs: ProfileGradientPrefs): Promise<ActionResult> {
  const angle = clampInt(prefs.gradient_angle, 0, 360);
  const [gp1, gp2, gp3] = normalizeStops(
    prefs.gradient_primary_stop,
    prefs.gradient_secondary_stop,
    prefs.gradient_accent_stop,
  );
  const style: ProfileGradientStyle = PROFILE_GRADIENT_STYLES.includes(prefs.gradient_style)
    ? prefs.gradient_style
    : "wave";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      gradient_angle: angle,
      gradient_primary_stop: gp1,
      gradient_secondary_stop: gp2,
      gradient_accent_stop: gp3,
      gradient_style: style,
    })
    .eq("id", user.id);

  if (error) {
    const raw = error.message ?? "";
    if (/gradient_|schema cache|column.*profiles|Could not find the.*column/i.test(raw)) {
      return {
        ok: false,
        error:
          "Your Supabase database is missing the profile theme columns. Open the SQL Editor in the Supabase dashboard, paste and run the file supabase/migrations/20260426140000_profile_gradient_prefs.sql, wait a few seconds for the schema cache to refresh, then save again. (Or run: supabase db push / migrate.)",
      };
    }
    return { ok: false, error: raw };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}
