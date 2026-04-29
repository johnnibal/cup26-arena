import type { CSSProperties } from "react";

import { TEAM_UI_PALETTE } from "@/lib/team-ui-palette";
import {
  DEFAULT_TEAM_ACCENT,
  DEFAULT_TEAM_PRIMARY,
  DEFAULT_TEAM_SECONDARY,
  hexToRgb,
} from "@/lib/theme";
import type { Profile, Team } from "@/types/domain";

export type ProfileGradientStyle = "smooth" | "wave" | "radial" | "spotlight";

export const PROFILE_GRADIENT_STYLES: ProfileGradientStyle[] = [
  "smooth",
  "wave",
  "radial",
  "spotlight",
];

export type ProfileGradientPrefs = {
  gradient_angle: number;
  gradient_primary_stop: number;
  gradient_secondary_stop: number;
  gradient_accent_stop: number;
  gradient_style: ProfileGradientStyle;
};

export const DEFAULT_PROFILE_GRADIENT_PREFS: ProfileGradientPrefs = {
  gradient_angle: 135,
  gradient_primary_stop: 0,
  gradient_secondary_stop: 55,
  gradient_accent_stop: 100,
  gradient_style: "wave",
};

function parseGradientStyle(raw: string | null | undefined): ProfileGradientStyle {
  if (raw && PROFILE_GRADIENT_STYLES.includes(raw as ProfileGradientStyle)) {
    return raw as ProfileGradientStyle;
  }
  return DEFAULT_PROFILE_GRADIENT_PREFS.gradient_style;
}

/** Normalize DB row → prefs (defaults if column missing in older clients). */
export function profileGradientPrefsFromProfile(profile: Profile | null): ProfileGradientPrefs {
  if (!profile) return { ...DEFAULT_PROFILE_GRADIENT_PREFS };
  return {
    gradient_angle: profile.gradient_angle ?? DEFAULT_PROFILE_GRADIENT_PREFS.gradient_angle,
    gradient_primary_stop:
      profile.gradient_primary_stop ?? DEFAULT_PROFILE_GRADIENT_PREFS.gradient_primary_stop,
    gradient_secondary_stop:
      profile.gradient_secondary_stop ?? DEFAULT_PROFILE_GRADIENT_PREFS.gradient_secondary_stop,
    gradient_accent_stop:
      profile.gradient_accent_stop ?? DEFAULT_PROFILE_GRADIENT_PREFS.gradient_accent_stop,
    gradient_style: parseGradientStyle(profile.gradient_style),
  };
}

function teamColors(team: Team | null): { primary: string; secondary: string; accent: string } {
  const palette = team ? TEAM_UI_PALETTE[team.code] : undefined;
  /** Empty DB strings break `linear-gradient(...,  0%, ...)` — treat as missing. */
  const pick = (v: string | null | undefined, fallback: string) => {
    const s = v?.trim();
    return s ? s : fallback;
  };
  const primary = pick(palette?.primary ?? team?.primary_color, DEFAULT_TEAM_PRIMARY);
  const secondary = pick(
    palette?.secondary ?? team?.accent_color ?? team?.primary_color,
    DEFAULT_TEAM_SECONDARY,
  );
  const accent = pick(palette?.accent ?? team?.accent_color, DEFAULT_TEAM_ACCENT);
  return { primary, secondary, accent };
}

function clampStops(p1: number, p2: number, p3: number): [number, number, number] {
  const a = Math.min(100, Math.max(0, p1));
  let b = Math.min(100, Math.max(0, p2));
  let c = Math.min(100, Math.max(0, p3));
  if (b < a) b = a;
  if (c < b) c = b;
  return [a, b, c];
}

/** Clean multi-stop blend — no overlays (reads as a soft kit fade). */
function buildSmoothGradient(
  primary: string,
  secondary: string,
  accent: string,
  angle: number,
  p1: number,
  p2: number,
  p3: number,
): string {
  const mid1 = Math.round(p1 + (p2 - p1) * 0.5);
  const mid2 = Math.round(p2 + (p3 - p2) * 0.5);
  const mixPs = `color-mix(in srgb, ${primary} 50%, ${secondary})`;
  const mixSa = `color-mix(in srgb, ${secondary} 50%, ${accent})`;
  return `linear-gradient(${angle}deg, ${primary} ${p1}%, ${mixPs} ${mid1}%, ${secondary} ${p2}%, ${mixSa} ${mid2}%, ${accent} ${p3}%)`;
}

/**
 * Flag-inspired: curved bands + swell (no stripe/rib overlay — those read as grey lines on glass).
 * First layer = top.
 */
function buildWaveGradient(
  primary: string,
  secondary: string,
  accent: string,
  angle: number,
  p1: number,
  p2: number,
  p3: number,
): string {
  const base = `linear-gradient(${angle}deg, ${primary} ${p1}%, ${secondary} ${p2}%, ${accent} ${p3}%)`;
  const rp = hexToRgb(primary) ?? { r: 11, g: 27, b: 58 };
  const rs = hexToRgb(secondary) ?? rp;
  const ra = hexToRgb(accent) ?? rp;
  const foldA = `radial-gradient(ellipse 145% 110% at 88% 0%, rgba(${rs.r},${rs.g},${rs.b},0.58) 0%, transparent 50%)`;
  const foldB = `radial-gradient(ellipse 125% 100% at 0% 100%, rgba(${rp.r},${rp.g},${rp.b},0.52) 0%, transparent 48%)`;
  const swell = `radial-gradient(ellipse 75% 65% at 58% 42%, rgba(${ra.r},${ra.g},${ra.b},0.32) 0%, transparent 58%)`;
  return [swell, foldB, foldA, base].join(", ");
}

/** Classic circular kit burst from center. */
function buildRadialStyle(
  primary: string,
  secondary: string,
  accent: string,
  p1: number,
  p2: number,
  _p3: number,
): string {
  const mid = Math.min(100, Math.max(0, p2));
  const inner = Math.max(0, Math.min(35, p1 * 0.35));
  return `radial-gradient(ellipse 120% 115% at 50% 42%, ${accent} ${inner}%, ${secondary} ${mid}%, ${primary} 100%)`;
}

/**
 * Stage lighting: full kit wash underneath; soft diagonal “key” and “fill” as linear overlays.
 * (Avoids stacked radials + vignette that can read as flat grey on glass or fail in some engines.)
 */
function buildSpotlightGradient(
  primary: string,
  secondary: string,
  accent: string,
  angle: number,
  p1: number,
  p2: number,
  p3: number,
): string {
  const wash = `linear-gradient(${angle}deg, ${primary} ${p1}%, ${secondary} ${p2}%, ${accent} ${p3}%)`;
  const ra = hexToRgb(accent) ?? { r: 230, g: 57, b: 70 };
  const rs = hexToRgb(secondary) ?? ra;
  const rp = hexToRgb(primary) ?? ra;
  const keyAngle = angle - 38;
  const fillAngle = angle + 42;
  const key = `linear-gradient(${keyAngle}deg, rgba(${ra.r},${ra.g},${ra.b},0.42) 0%, rgba(${rs.r},${rs.g},${rs.b},0.12) 42%, transparent 62%)`;
  const fill = `linear-gradient(${fillAngle}deg, rgba(${rp.r},${rp.g},${rp.b},0.28) 0%, transparent 55%)`;
  const sheen = `linear-gradient(195deg, rgba(255,255,255,0.14) 0%, transparent 28%)`;
  return [sheen, key, fill, wash].join(", ");
}

/** Build CSS custom properties for profile hero / preview. Pure function (safe on client). */
export function buildProfileThemeVars(
  team: Team | null,
  prefs: ProfileGradientPrefs,
): CSSProperties {
  const { primary, secondary, accent } = teamColors(team);
  const angle = Math.min(360, Math.max(0, prefs.gradient_angle));
  const [p1, p2, p3] = clampStops(
    prefs.gradient_primary_stop,
    prefs.gradient_secondary_stop,
    prefs.gradient_accent_stop,
  );

  let gradient: string;
  switch (prefs.gradient_style) {
    case "smooth":
      gradient = buildSmoothGradient(primary, secondary, accent, angle, p1, p2, p3);
      break;
    case "wave":
      gradient = buildWaveGradient(primary, secondary, accent, angle, p1, p2, p3);
      break;
    case "radial":
      gradient = buildRadialStyle(primary, secondary, accent, p1, p2, p3);
      break;
    case "spotlight":
      gradient = buildSpotlightGradient(primary, secondary, accent, angle, p1, p2, p3);
      break;
    default:
      gradient = buildWaveGradient(primary, secondary, accent, angle, p1, p2, p3);
  }

  const pr = hexToRgb(primary) ?? { r: 11, g: 27, b: 58 };
  const ar = hexToRgb(accent) ?? pr;
  const glow = `0 0 52px -8px rgba(${pr.r},${pr.g},${pr.b},0.4), 0 0 100px -24px rgba(${ar.r},${ar.g},${ar.b},0.24)`;

  return {
    ["--profile-gradient" as string]: gradient,
    ["--profile-glow" as string]: glow,
  } as CSSProperties;
}
