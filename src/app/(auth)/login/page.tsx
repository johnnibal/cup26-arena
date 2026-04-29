import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Google didn't return an authorization code. Please try again.",
  oauth_failed: "We couldn't complete sign-in with Google. Please try again.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.")
    : null;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,57,70,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(59,130,246,0.06),transparent)]"
      />
      <div className="relative w-full max-w-md">
        <section className="glass-panel rounded-2xl p-8 shadow-card sm:p-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-accent">
            Sign in
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-heading">Welcome to Cup26 Arena</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in with Google to predict World Cup 2026 matches and climb the leaderboard.
          </p>

          <div className="mt-6">
            <GoogleSignInButton next={safeNext} />
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-brand-accent/35 bg-brand-accent/10 px-3 py-2 text-xs text-rose-300">
              {errorMessage}
            </p>
          ) : null}

          <p className="mt-6 text-xs text-muted">
            By continuing you agree to be a good sport and predict responsibly.
          </p>
        </section>
      </div>
    </main>
  );
}
