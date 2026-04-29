import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type LoginShellProps = {
  next?: string;
  errorMessage: string | null;
};

const highlights = [
  {
    title: "Predict every group match",
    body: "Lock in scorelines before kickoff — then watch the drama unfold.",
  },
  {
    title: "Fair, transparent scoring",
    body: "Exact results earn more; right winner or draw still moves you up.",
  },
  {
    title: "Global leaderboard",
    body: "See how your calls stack up against everyone in the Arena.",
  },
];

export function LoginShell({ next, errorMessage }: LoginShellProps) {
  return (
    <div className="arena-shell flex min-h-screen flex-col">
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Marketing column */}
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-14 lg:py-16 xl:px-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_20%_15%,rgba(230,57,70,0.16),transparent_55%),radial-gradient(ellipse_70%_55%_at_95%_80%,rgba(59,130,246,0.09),transparent_50%),radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(255,255,255,0.04),transparent_65%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-brand-primary/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl"
          />

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-accent sm:text-xs">
              World Cup 2026
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-heading sm:text-5xl lg:text-[2.75rem] lg:leading-tight">
              Cup26 Arena
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              The prediction competition for North America 2026 — call the scores, earn points, and
              climb the board with fans everywhere.
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.08] bg-surface-muted/35 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4"
                >
                  <p className="text-sm font-semibold text-heading">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-muted">
                <span className="font-semibold text-heading">3 pts</span> exact score
                <span className="mx-2 text-surface-border">·</span>
                <span className="font-semibold text-heading">1 pt</span> correct result
              </div>
            </div>

            <p className="mt-8 text-xs leading-relaxed text-muted">
              Fixtures, predictions, and the live leaderboard are available{" "}
              <span className="font-medium text-heading">after you sign in</span> — the schedule and scoring
              stay tied to your profile.
            </p>
          </div>
        </div>

        {/* Sign-in column */}
        <div className="relative flex shrink-0 flex-col justify-center border-t border-white/[0.07] bg-[#070a10]/75 px-4 py-12 backdrop-blur-sm sm:px-8 lg:w-[min(100%,440px)] lg:border-l lg:border-t-0 xl:w-[460px]">
          <section className="glass-panel relative mx-auto w-full max-w-md rounded-2xl p-8 shadow-card sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-accent">
              Sign in
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-heading">Step into the Arena</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Use Google to create your profile, pick a nation to theme your experience, and start
              predicting.
            </p>

            <div className="mt-8">
              <GoogleSignInButton next={next} />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-brand-accent/35 bg-brand-accent/10 px-3 py-2 text-xs text-rose-300"
              >
                {errorMessage}
              </p>
            ) : null}

            <p className="mt-8 text-xs leading-relaxed text-muted">
              By continuing you agree to play fair and only use one account for the competition.
            </p>
          </section>
        </div>
      </div>

      <footer className="relative z-[1] border-t border-surface-border/80 glass-panel-soft">
        <div className="mx-auto flex min-h-11 max-w-6xl flex-col items-start justify-center gap-1 px-6 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span className="font-medium text-heading">Cup26 Arena</span>
          <span>World Cup 2026 · prediction competition</span>
        </div>
      </footer>
    </div>
  );
}
