import { DisplayNameForm } from "@/components/profile/DisplayNameForm";
import { FlagPicker } from "@/components/profile/FlagPicker";
import { ProfileFinishedPredictionsSection } from "@/components/profile/ProfileFinishedPredictionsSection";
import { ProfileHeroAnimated } from "@/components/profile/ProfileHeroAnimated";
import { ProfileIdentitySection } from "@/components/profile/ProfileIdentitySection";
import { ProfileThemeSection } from "@/components/profile/ProfileThemeSection";
import { ProfileViewEditLinks } from "@/components/profile/ProfileViewEditLinks";
import { SupporterNoteForm } from "@/components/profile/SupporterNoteForm";
import { requireAuthContext } from "@/lib/auth";
import { getUserPredictionHistory } from "@/lib/data/predictions";
import { getAllTeams } from "@/lib/data/teams";
import { profileGradientPrefsFromProfile } from "@/lib/profile-gradient";

export const metadata = { title: "Profile" };

const RECENT_FINISHED_LIMIT = 15;

type ProfilePageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { edit } = await searchParams;
  const isEditMode = edit === "1" || edit === "true";

  const [{ user, profile, team }, teams, predictionHistory] = await Promise.all([
    requireAuthContext(),
    getAllTeams(),
    getUserPredictionHistory(),
  ]);

  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || "Player";
  const teamCode = profile?.favorite_team_code ?? null;
  const gradientPrefs = profileGradientPrefsFromProfile(profile);

  const finishedRecent = predictionHistory
    .filter(({ match }) => match.status === "finished")
    .slice(0, RECENT_FINISHED_LIMIT);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
            {isEditMode ? "Settings" : "Account"}
          </p>
          <p className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">
            {isEditMode ? "Edit your profile" : "Your profile"}
          </p>
          <p className="max-w-xl text-sm text-muted">
            {isEditMode
              ? "Update your name, supporter note, arena theme, and favorite nation."
              : "This is how other players see you on the leaderboard and around the arena."}
          </p>
        </div>
        <ProfileViewEditLinks isEditMode={isEditMode} />
      </header>

      {isEditMode ? (
        <>
          <ProfileIdentitySection
            teamCode={teamCode}
            displayName={displayName}
            team={team}
            supporterNote={profile?.supporter_note}
            email={user.email ?? undefined}
            eyebrow="Profile preview"
          />

          <section className="glass-panel rounded-2xl p-6 shadow-card sm:p-8">
            <header className="mb-5">
              <h2 className="text-lg font-semibold tracking-tight text-heading">Your name</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Shown on the leaderboard and anywhere your predictions appear.
              </p>
            </header>
            <DisplayNameForm initialValue={profile?.display_name ?? ""} />
          </section>

          <section className="glass-panel scheme-dark rounded-2xl p-6 shadow-card sm:p-8">
            <header className="mb-5">
              <h2 className="text-lg font-semibold tracking-tight text-heading">Supporter note</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Shown under your name on the profile card — chants, a motto, or a line for your
                nation.
              </p>
            </header>
            <SupporterNoteForm initialValue={profile?.supporter_note ?? ""} />
          </section>

          <ProfileThemeSection
            team={team}
            initialPrefs={gradientPrefs}
            previewName={displayName}
            previewEmail={user.email ?? ""}
            previewSupporterNote={profile?.supporter_note ?? ""}
          />

          <ProfileHeroAnimated teamCode={teamCode}>
            <section className="glass-panel relative overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{ backgroundImage: "var(--profile-gradient)" }}
              />
              <header className="relative mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-heading">Favorite team</h2>
                  <p className="mt-1 text-sm text-muted">
                    Search and tap a flag so your pick drives the navbar, cards, and pitch accents.
                  </p>
                </div>
                {team ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-team-primary/35 bg-team-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-team-primary shadow-glow">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-team-primary shadow-[0_0_10px_var(--team-primary)]"
                    />
                    {team.name}
                  </span>
                ) : null}
              </header>
              <div className="relative">
                <FlagPicker teams={teams} currentCode={profile?.favorite_team_code ?? null} />
              </div>
            </section>
          </ProfileHeroAnimated>
        </>
      ) : (
        <>
          <ProfileIdentitySection
            teamCode={teamCode}
            displayName={displayName}
            team={team}
            supporterNote={profile?.supporter_note}
            eyebrow="Public profile"
          />
          <ProfileFinishedPredictionsSection rows={finishedRecent} />
        </>
      )}
    </div>
  );
}
