"use client";

import { useReducedMotion } from "framer-motion";
import { useState } from "react";

import type { Team } from "@/types/domain";
import { circleFlagUrl } from "@/lib/flags";
import {
  DEFAULT_INK_ON_PRIMARY,
  DEFAULT_TEAM_ACCENT,
  DEFAULT_TEAM_PRIMARY,
  hexToRgb,
  inkOnColor,
} from "@/lib/theme";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-24 w-24 text-base",
  /** Wider match-row avatars (fixtures list). */
  xl: "h-[4.5rem] w-[4.5rem] text-sm sm:h-20 sm:w-20 sm:text-base",
} as const;

/** Drop-shadow blur by size (px) — kept tight so edges stay sharp, not mushy. */
const DROP_BLUR_BY_SIZE: Record<keyof typeof SIZE_CLASSES, number> = {
  sm: 5,
  md: 6,
  lg: 8,
  xl: 9,
};

type AvatarFlagProps = {
  team: Team | null;
  size?: keyof typeof SIZE_CLASSES;
  /** Show the team's 3-letter code when falling back to the color chip. */
  showCode?: boolean;
  className?: string;
  /**
   * When the avatar sits inside an element with Tailwind `group`, scale slightly
   * on parent hover (e.g. match card row).
   */
  parentGroupHover?: boolean;
  /** Team-colored halo around the circle; off for fixtures lists where it feels noisy. */
  coloredGlow?: boolean;
};

/**
 * Crisp circular frame: hairline highlight ring + compact lift shadow,
 * optional tight team-colored bloom (not a soft fog).
 */
function buildFlagShadow(
  size: keyof typeof SIZE_CLASSES,
  rgb: { r: number; g: number; b: number },
  boost: boolean,
  neutral: boolean,
  coloredGlow: boolean,
): string {
  const blur = DROP_BLUR_BY_SIZE[size];
  const edge = "0 0 0 1px rgba(255,255,255,0.18)";
  const dropY = boost ? 3 : 2;
  const dropA = boost ? 0.4 : 0.32;
  const drop = `0 ${dropY}px ${blur}px rgba(0,0,0,${dropA})`;

  if (!coloredGlow) {
    return [edge, drop].join(", ");
  }

  if (neutral) {
    const bloomA = boost ? 0.12 : 0.07;
    const bloom = `0 0 12px -2px rgba(255,255,255,${bloomA})`;
    return [edge, drop, bloom].join(", ");
  }

  const bloomA = boost ? 0.32 : 0.2;
  const bloom = `0 0 16px -3px rgba(${rgb.r},${rgb.g},${rgb.b},${bloomA})`;
  return [edge, drop, bloom].join(", ");
}

// Circular flag / chip avatar: crisp edge, modern depth, optional tight team bloom.
export function AvatarFlag({
  team,
  size = "md",
  showCode = true,
  className,
  parentGroupHover = false,
  coloredGlow = true,
}: AvatarFlagProps) {
  const sizeClass = SIZE_CLASSES[size];
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const boost = coloredGlow && hovered && !reduceMotion;

  const motionCls =
    !reduceMotion &&
    "transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03]";
  const groupCls = parentGroupHover && !reduceMotion && "group-hover:scale-[1.03]";

  if (!team) {
    const rgb = { r: 200, g: 210, b: 220 };
    return (
      <span
        className={cx(
          "inline-flex items-center justify-center rounded-full bg-surface-muted font-semibold text-muted",
          motionCls,
          groupCls,
          sizeClass,
          className,
        )}
        style={{ boxShadow: buildFlagShadow(size, rgb, boost, true, coloredGlow) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="No team selected"
      >
        ?
      </span>
    );
  }

  const flagUrl = circleFlagUrl(team.iso2_code);
  const primary = team.primary_color ?? DEFAULT_TEAM_PRIMARY;
  const accentHex = team.accent_color ?? team.primary_color ?? DEFAULT_TEAM_ACCENT;
  const glowRgb = hexToRgb(accentHex) ?? hexToRgb(primary) ?? { r: 230, g: 57, b: 70 };

  if (flagUrl) {
    return (
      <span
        className={cx(
          "relative isolate inline-flex overflow-hidden rounded-full bg-zinc-950",
          motionCls,
          groupCls,
          sizeClass,
          className,
        )}
        style={{
          boxShadow: buildFlagShadow(size, glowRgb, boost, false, coloredGlow),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={team.name}
        title={team.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagUrl}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full scale-[1.035] object-cover object-center transform-gpu"
        />
      </span>
    );
  }

  const accent = team.accent_color ?? DEFAULT_TEAM_ACCENT;
  const ink = inkOnColor(primary) ?? DEFAULT_INK_ON_PRIMARY;

  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full font-bold tracking-wide",
        motionCls,
        groupCls,
        sizeClass,
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${primary} 55%, ${accent} 55%, ${accent} 100%)`,
        color: ink,
        boxShadow: buildFlagShadow(size, glowRgb, boost, false, coloredGlow),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={team.name}
      title={team.name}
    >
      {showCode ? team.code : null}
    </span>
  );
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}
