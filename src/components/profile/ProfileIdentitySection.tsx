import { AvatarFlag } from "@/components/profile/AvatarFlag";
import { ProfileHeroAnimated } from "@/components/profile/ProfileHeroAnimated";
import type { Team } from "@/types/domain";

type ProfileIdentitySectionProps = {
  teamCode: string | null;
  displayName: string;
  team: Team | null;
  supporterNote: string | null | undefined;
  /** When set (e.g. edit mode), shown under the name. Omitted in public view. */
  email?: string | null;
  /** Eyebrow label above the name */
  eyebrow?: string;
};

export function ProfileIdentitySection({
  teamCode,
  displayName,
  team,
  supporterNote,
  email,
  eyebrow = "Profile",
}: ProfileIdentitySectionProps) {
  const note = supporterNote?.trim() ?? "";

  return (
    <ProfileHeroAnimated teamCode={teamCode}>
      <section className="glass-panel relative overflow-hidden rounded-2xl p-6 shadow-card sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: "var(--profile-gradient)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-team-primary/20 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <AvatarFlag team={team} size="lg" className="shrink-0" coloredGlow={false} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
              {displayName}
            </h1>
            {email ? <p className="mt-1 text-sm text-muted">{email}</p> : null}
            {note ? (
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-zinc-300 sm:max-w-none">
                {note}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-muted">No supporter note yet.</p>
            )}
          </div>
        </div>
      </section>
    </ProfileHeroAnimated>
  );
}
