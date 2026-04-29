import type { CSSProperties } from "react";

import { TEAM_UI_PALETTE } from "@/lib/team-ui-palette";
import type { Team } from "@/types/domain";

// Safe fallbacks that mirror the :root values in globals.css.
// The UI should always render even when favorite_team_code is null
// or when a team's colors haven't been seeded yet.
export const DEFAULT_TEAM_PRIMARY = "#0B1B3A";
export const DEFAULT_TEAM_ACCENT = "#E63946";
export const DEFAULT_TEAM_SECONDARY = "#3d5a80";
export const DEFAULT_INK_ON_PRIMARY = "#FFFFFF";

// Computes a readable ink color for text laid over `bgHex`.
// Uses the standard Rec. 709 luminance weights; returns white for
// dark backgrounds, near-black for light ones.
export function inkOnColor(bgHex: string): string {
  const rgb = parseHex(bgHex);
  if (!rgb) return DEFAULT_INK_ON_PRIMARY;
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55 ? "#FFFFFF" : "#0B0F1A";
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  return parseHex(hex);
}

// Returns the inline style object that sets the team CSS variables on
// a wrapping element. Returns an empty object when no team / no colors
// so the :root defaults keep applying.
export function teamCssVars(team: Team | null | undefined): CSSProperties {
  if (!team) return {};

  const palette = TEAM_UI_PALETTE[team.code];
  const primary = palette?.primary ?? team.primary_color ?? DEFAULT_TEAM_PRIMARY;
  const secondary =
    palette?.secondary ?? team.accent_color ?? team.primary_color ?? DEFAULT_TEAM_SECONDARY;
  const accent = palette?.accent ?? team.accent_color ?? DEFAULT_TEAM_ACCENT;
  const tertiary = palette?.tertiary ?? secondary;
  const ink = inkOnColor(primary);
  const rgb = hexToRgb(primary) ?? { r: 11, g: 27, b: 58 };
  const rgbAccent = hexToRgb(accent) ?? rgb;

  const gradient = `linear-gradient(135deg, ${primary} 0%, ${accent} 38%, ${secondary} 72%, ${tertiary} 100%)`;
  const gradientSubtle = `linear-gradient(145deg, rgba(${rgb.r},${rgb.g},${rgb.b},0.55) 0%, rgba(${rgbAccent.r},${rgbAccent.g},${rgbAccent.b},0.35) 50%, rgba(${rgb.r},${rgb.g},${rgb.b},0.12) 100%)`;

  const glow = `0 0 52px -8px rgba(${rgb.r},${rgb.g},${rgb.b},0.45), 0 0 100px -24px rgba(${rgbAccent.r},${rgbAccent.g},${rgbAccent.b},0.25)`;
  const ambient = `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
  const ambientSoft = `rgba(${rgbAccent.r},${rgbAccent.g},${rgbAccent.b},0.12)`;

  return {
    ["--team-primary" as never]: primary,
    ["--team-secondary" as never]: secondary,
    ["--team-accent" as never]: accent,
    ["--team-tertiary" as never]: tertiary,
    ["--team-ink" as never]: ink,
    ["--team-gradient" as never]: gradient,
    ["--team-gradient-subtle" as never]: gradientSubtle,
    ["--team-glow" as never]: glow,
    ["--team-ambient" as never]: ambient,
    ["--team-ambient-soft" as never]: ambientSoft,
  };
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "");
  if (!(h.length === 3 || h.length === 6)) return null;
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}
