"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { HomeHeroTrophyReveal } from "@/components/home/HomeHeroTrophyReveal";

type HomeHeroProps = {
  greetingName: string;
  hasFavoriteTeam: boolean;
};

export function HomeHero({ greetingName, hasFavoriteTeam }: HomeHeroProps) {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl px-6 py-12 text-white shadow-glow sm:px-10 sm:py-16">
      {/* Dark premium base */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#05070c]/95 via-[#080b12]/40 to-[#06080d]/90"
      />

      {/* Soft team-colored aura (favorite team drives CSS variables) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-[28%] left-1/2 h-[min(100%,560px)] w-[min(125vw,880px)] max-w-[900px] -translate-x-1/2 rounded-[50%] blur-[64px] sm:blur-[80px]"
        style={{
          background:
            "radial-gradient(ellipse 48% 42% at 50% 50%, color-mix(in srgb, var(--team-primary) 20%, transparent), transparent 72%)",
        }}
        animate={reduceMotion ? {} : { opacity: [0.42, 0.58, 0.42], scale: [1, 1.03, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-[20%] -right-[10%] h-72 w-72 rounded-full blur-[56px] sm:h-80 sm:w-80"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--team-accent) 12%, transparent), transparent 68%)",
        }}
        animate={reduceMotion ? {} : { opacity: [0.28, 0.42, 0.28] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Soft radial spotlight behind glass */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 28%, rgba(255,255,255,0.05), transparent 55%)",
        }}
        animate={reduceMotion ? {} : { opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Very subtle kit wash */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "var(--team-gradient-subtle)" }}
        animate={reduceMotion ? {} : { opacity: [0.06, 0.11, 0.06] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(90%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />

      <div className="relative z-[1] mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-8 lg:gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
          <div className="order-2 mx-auto max-w-2xl space-y-5 text-center sm:mx-0 sm:text-left md:order-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-xs">
              World Cup 2026
            </p>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Cup26 Arena</h1>
              <p className="text-lg font-medium text-white/90 sm:text-xl md:text-2xl">
                Predict the Cup. Own the Arena.
              </p>
            </div>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:mx-0 sm:text-base">
              Hey <span className="font-semibold text-white">{greetingName}</span>, call the scores,
              climb the board, and ride every kick with your nation behind you.
            </p>

            {!hasFavoriteTeam ? (
              <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-left shadow-card backdrop-blur-md sm:p-5">
                <p className="font-semibold text-white">Choose your team</p>
                <p className="mt-1 text-sm text-white/75">
                  Pick a favorite nation to theme the arena and personalize your home pitch.
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-white/95"
                >
                  Pick your team
                </Link>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/matches"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-team-primary px-6 text-sm font-semibold text-team-ink shadow-lg ring-1 ring-white/10 transition hover:brightness-110 hover:ring-team-accent/40"
              >
                View fixtures
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/[0.06] px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/12"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <HomeHeroTrophyReveal reducedMotion={reduceMotion} />
          </div>
        </div>
      </div>
    </section>
  );
}
