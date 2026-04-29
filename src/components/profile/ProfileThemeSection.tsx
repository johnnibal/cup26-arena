"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { AvatarFlag } from "@/components/profile/AvatarFlag";
import { updateProfileTheme } from "@/lib/actions/profile";
import {
  buildProfileThemeVars,
  DEFAULT_PROFILE_GRADIENT_PREFS,
  PROFILE_GRADIENT_STYLES,
  type ProfileGradientPrefs,
  type ProfileGradientStyle,
} from "@/lib/profile-gradient";
import type { Team } from "@/types/domain";

type ProfileThemeSectionProps = {
  team: Team | null;
  initialPrefs: ProfileGradientPrefs;
  previewName: string;
  previewEmail: string;
  previewSupporterNote: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ProfileThemeSection({
  team,
  initialPrefs,
  previewName,
  previewEmail,
  previewSupporterNote,
}: ProfileThemeSectionProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<ProfileGradientPrefs>(initialPrefs);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPrefs(initialPrefs);
  }, [initialPrefs]);

  const previewShellStyle = buildProfileThemeVars(team, prefs);

  const setAngle = useCallback((v: number) => {
    setPrefs((p) => ({ ...p, gradient_angle: clamp(Math.round(v), 0, 360) }));
  }, []);

  const setPrimaryStop = useCallback((v: number) => {
    const np = clamp(Math.round(v), 0, 100);
    setPrefs((p) => {
      let s = p.gradient_secondary_stop;
      let a = p.gradient_accent_stop;
      if (s < np) s = np;
      if (a < s) a = s;
      return { ...p, gradient_primary_stop: np, gradient_secondary_stop: s, gradient_accent_stop: a };
    });
  }, []);

  const setSecondaryStop = useCallback((v: number) => {
    const ns = clamp(Math.round(v), 0, 100);
    setPrefs((p) => {
      const lo = p.gradient_primary_stop;
      const hi = p.gradient_accent_stop;
      const n = clamp(ns, lo, hi);
      return { ...p, gradient_secondary_stop: n };
    });
  }, []);

  const setAccentStop = useCallback((v: number) => {
    const na = clamp(Math.round(v), 0, 100);
    setPrefs((p) => {
      let s = p.gradient_secondary_stop;
      if (na < s) s = na;
      const lo = p.gradient_primary_stop;
      if (s < lo) s = lo;
      return { ...p, gradient_accent_stop: na, gradient_secondary_stop: s };
    });
  }, []);

  const setStyle = useCallback((v: ProfileGradientStyle) => {
    setPrefs((p) => ({ ...p, gradient_style: v }));
  }, []);

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileTheme(prefs);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const reset = () => {
    setPrefs({ ...DEFAULT_PROFILE_GRADIENT_PREFS });
    setError(null);
    setSaved(false);
  };

  return (
    <section className="glass-panel scheme-dark rounded-2xl p-6 shadow-card sm:p-8">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-heading">Profile theme</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tune how your team colors blend on your profile card. Team colors themselves stay the
          same, only the gradient layout changes.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-200">
              Gradient angle ({prefs.gradient_angle}°)
            </span>
            <input
              type="range"
              min={0}
              max={360}
              value={prefs.gradient_angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-team-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-200">
              Primary color stop ({prefs.gradient_primary_stop}%)
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.gradient_primary_stop}
              onChange={(e) => setPrimaryStop(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-team-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-200">
              Secondary color stop ({prefs.gradient_secondary_stop}%)
            </span>
            <input
              type="range"
              min={prefs.gradient_primary_stop}
              max={prefs.gradient_accent_stop}
              value={prefs.gradient_secondary_stop}
              onChange={(e) => setSecondaryStop(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-team-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-200">
              Accent color stop ({prefs.gradient_accent_stop}%)
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.gradient_accent_stop}
              onChange={(e) => setAccentStop(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-team-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-200">Style</span>
            <select
              value={prefs.gradient_style}
              onChange={(e) => setStyle(e.target.value as ProfileGradientStyle)}
              className="focus:ring-team-primary/20 h-11 rounded-xl border border-zinc-600/35 bg-[#121722] px-3 text-sm font-medium text-zinc-100 shadow-inner outline-none transition focus:border-team-primary/60 focus:ring-2"
            >
              {PROFILE_GRADIENT_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s === "smooth"
                    ? "Smooth (linear)"
                    : s === "wave"
                      ? "Wave (layered)"
                      : s === "radial"
                        ? "Radial"
                        : "Spotlight"}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-team-primary px-5 text-sm font-semibold text-team-ink shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save theme"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-600/35 bg-[#121722] px-4 text-sm font-medium text-zinc-200 transition hover:border-zinc-500/50 hover:text-white"
            >
              Reset to defaults
            </button>
          </div>
          {saved ? (
            <p className="text-xs text-emerald-400" role="status">
              Theme saved.
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="w-full shrink-0 lg:w-[min(100%,320px)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-200">Live preview</p>
          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.1] shadow-[var(--profile-glow)]"
            style={previewShellStyle}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.52]"
              style={{ backgroundImage: "var(--profile-gradient)" }}
            />
            <div className="relative space-y-3 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <AvatarFlag team={team} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-heading">{previewName}</p>
                  <p className="truncate text-xs text-muted">{previewEmail}</p>
                </div>
              </div>
              {previewSupporterNote.trim() ? (
                <p className="text-xs leading-relaxed text-zinc-400">{previewSupporterNote.trim()}</p>
              ) : (
                <p className="text-xs italic text-zinc-500">
                  Your supporter note will show here once you save it in Supporter note.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
