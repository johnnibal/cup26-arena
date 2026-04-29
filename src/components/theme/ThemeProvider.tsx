import type { ReactNode } from "react";

import { buildProfileThemeVars, profileGradientPrefsFromProfile } from "@/lib/profile-gradient";
import { teamCssVars } from "@/lib/theme";
import type { Profile, Team } from "@/types/domain";

type ThemeProviderProps = {
  team: Team | null;
  /** Drives `--profile-gradient` / `--profile-glow` from saved prefs + team colors. */
  profile: Profile | null;
  children: ReactNode;
};

// Sets team-derived CSS custom properties on a wrapping <div>.
// Everything beneath inherits them via the cascade. When `team` is null
// or colors aren't seeded we render no inline style so the :root defaults
// from globals.css apply. Server-rendered so there's no FOUC on first
// paint - the correct colors land before any client JS runs.
export function ThemeProvider({ team, profile, children }: ThemeProviderProps) {
  const teamStyle = teamCssVars(team);
  const prefs = profileGradientPrefsFromProfile(profile);
  const profileStyle = buildProfileThemeVars(team, prefs);
  return (
    <div style={{ ...teamStyle, ...profileStyle }} className="arena-shell flex min-h-screen flex-col">
      {children}
    </div>
  );
}
