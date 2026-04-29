import Link from "next/link";

const LINKS = [
  {
    href: "/matches",
    title: "Matches",
    description: "Full schedule, filters, and every group fixture.",
    abbr: "Mx",
  },
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description: "See how you stack up against the competition.",
    abbr: "Lb",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Display name, favorite team, and theme colors.",
    abbr: "Me",
  },
] as const;

export function HomeQuickLinks() {
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold tracking-tight text-heading sm:text-xl">Quick links</h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="glass-panel group flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-team-primary/25 hover:shadow-card-hover"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-team-primary/15 text-xs font-bold uppercase tracking-wide text-team-primary ring-1 ring-team-primary/20 transition group-hover:bg-team-primary/25"
              >
                {item.abbr}
              </span>
              <span className="mt-4 text-base font-semibold text-heading">{item.title}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{item.description}</span>
              <span className="mt-4 text-sm font-semibold text-team-primary transition group-hover:text-zinc-100 group-hover:underline group-hover:decoration-zinc-400/60 group-hover:underline-offset-4">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
