import Link from "next/link";

import { AvatarFlag } from "@/components/profile/AvatarFlag";
import { Container } from "@/components/ui/Container";
import { getAuthContext } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Matches" },
  { href: "/predictions", label: "Predictions" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export async function Navbar() {
  const auth = await getAuthContext();
  const team = auth?.team ?? null;
  const displayName = auth?.profile?.display_name?.trim() || auth?.user.email || null;
  const needsTeam = auth !== null && !team;

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border/80 glass-panel-soft">
      <div
        aria-hidden
        className="h-0.5 w-full bg-gradient-to-r from-transparent via-team-primary to-transparent opacity-90"
      />
      <Container className="flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-heading"
        >
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-team-primary to-team-primary/70 text-xs font-bold text-team-ink shadow-glow ring-1 ring-white/10 transition group-hover:brightness-110"
          >
            26
          </span>
          <span className="hidden min-[380px]:inline">
            Cup26<span className="font-normal text-muted"> Arena</span>
          </span>
        </Link>

        <nav
          className="-mx-1 flex min-w-0 flex-1 justify-center gap-0.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-heading sm:px-3 sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {needsTeam ? (
            <Link
              href="/profile"
              className="inline-flex max-w-[7.5rem] truncate rounded-full border border-team-accent/35 bg-team-accent/10 px-2.5 py-1 text-xs font-semibold text-team-accent transition hover:bg-team-accent/15 sm:max-w-none sm:px-3"
            >
              Pick team
            </Link>
          ) : null}

          {auth ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="group glass-panel-soft flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 shadow-card transition hover:border-team-primary/25 hover:shadow-glow hover:brightness-110 sm:pr-3"
                aria-label="Open profile"
              >
                <AvatarFlag team={team} size="sm" parentGroupHover className="min-h-0 min-w-0 shrink-0" />
                {displayName ? (
                  <span className="hidden max-w-[10ch] truncate text-xs font-medium text-heading sm:inline sm:max-w-[12ch] sm:text-sm">
                    {displayName}
                  </span>
                ) : null}
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="inline-flex h-8 items-center rounded-full border border-surface-border/80 bg-surface-muted/50 px-2.5 text-xs font-medium text-muted transition hover:border-white/15 hover:text-heading sm:px-3"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-full border border-surface-border/80 bg-surface-muted/50 px-3 text-xs font-medium text-heading transition hover:border-team-primary/40 hover:bg-team-primary/10"
            >
              Sign in
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
