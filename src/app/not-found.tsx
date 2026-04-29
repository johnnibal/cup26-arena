import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">404</p>
      <h1 className="text-3xl font-bold tracking-tight text-heading">Page not found</h1>
      <p className="max-w-md text-sm text-muted">
        This match isn&apos;t on the schedule. Head back to the arena.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-team-primary px-5 py-2.5 text-sm font-semibold text-team-ink shadow-lg transition hover:brightness-110"
      >
        Go home
      </Link>
    </main>
  );
}
