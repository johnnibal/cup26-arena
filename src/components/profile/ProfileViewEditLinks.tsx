import Link from "next/link";

type ProfileViewEditLinksProps = {
  isEditMode: boolean;
};

export function ProfileViewEditLinks({ isEditMode }: ProfileViewEditLinksProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isEditMode ? (
        <Link
          href="/profile"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-surface-muted/50 px-4 text-sm font-semibold text-heading transition hover:border-white/25 hover:bg-surface-muted/70"
        >
          View profile
        </Link>
      ) : (
        <Link
          href="/profile?edit=1"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-team-primary px-4 text-sm font-semibold text-team-ink shadow-lg transition hover:brightness-110"
        >
          Edit profile
        </Link>
      )}
    </div>
  );
}
