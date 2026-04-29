/**
 * Canonical UI palette per FIFA code: recognizable kit/flag colors tuned for
 * dark-mode UI (contrast, glows, gradients). Not every color is suitable for
 * `text-team-ink` on `bg-team-primary` — that is handled by `inkOnColor(primary)`.
 *
 * Roles:
 * - primary: main brand / CTA fill
 * - secondary: mid-gradient, rings, second stripe
 * - accent: highlights, glow mix, third stripe
 * - tertiary: optional fourth gradient stop (defaults to `secondary` in theme)
 */
export type TeamUiPalette = {
  primary: string;
  secondary: string;
  accent: string;
  tertiary?: string;
};

/** All 48 Cup26 Arena nations; keys must match `public.teams.code`. */
export const TEAM_UI_PALETTE: Record<string, TeamUiPalette> = {
  // Group A
  MEX: { primary: "#0B6E4F", secondary: "#CE1126", accent: "#E8EAEF", tertiary: "#FFFFFF" },
  RSA: { primary: "#007749", secondary: "#FCB514", accent: "#1A1A1A" },
  KOR: { primary: "#ECEFF4", secondary: "#C60C30", accent: "#003478" },
  CZE: { primary: "#11457E", secondary: "#D7141A", accent: "#E8EAEF" },

  // Group B
  CAN: { primary: "#D52B1E", secondary: "#F4F4F8", accent: "#0B0B0B" },
  BIH: { primary: "#002395", secondary: "#FECB00", accent: "#E8EAEF" },
  QAT: { primary: "#8A1538", secondary: "#E8D8DD", accent: "#1A0F14" },
  SUI: { primary: "#DA291C", secondary: "#EEF0F4", accent: "#0B0B0B" },

  // Group C
  HAI: { primary: "#00209F", secondary: "#D21034", accent: "#E8EAEF" },
  SCO: { primary: "#005EB8", secondary: "#EDEDED", accent: "#001F5C" },
  BRA: { primary: "#009C3B", secondary: "#FFDF00", accent: "#002776" },
  MAR: { primary: "#C1272D", secondary: "#006233", accent: "#FCD116" },

  // Group D
  USA: { primary: "#3C3B6E", secondary: "#B22234", accent: "#F0F0F5" },
  PAR: { primary: "#D52B1C", secondary: "#0038A8", accent: "#F5F5F5" },
  AUS: { primary: "#012169", secondary: "#E4002B", accent: "#E8EAEF" },
  TUR: { primary: "#E30A17", secondary: "#0B0B0B", accent: "#F4F4F4" },

  // Group E
  CIV: { primary: "#009E60", secondary: "#FF9A1F", accent: "#00923F" },
  ECU: { primary: "#034EA2", secondary: "#FFDD00", accent: "#ED1C24" },
  GER: { primary: "#0A0A0A", secondary: "#DD0000", accent: "#E8C400" },
  CUW: { primary: "#002868", secondary: "#F9E814", accent: "#E8EAEF" },

  // Group F
  NED: { primary: "#F36C21", secondary: "#1B2B4A", accent: "#EEF1F6" },
  JPN: { primary: "#ECEFF4", secondary: "#BC002D", accent: "#141C2E" },
  SWE: { primary: "#006AA7", secondary: "#FECC00", accent: "#E8F0F7" },
  TUN: { primary: "#E70013", secondary: "#F5F5F5", accent: "#111111" },

  // Group G
  IRN: { primary: "#239F40", secondary: "#DA0000", accent: "#E8EAEF" },
  NZL: { primary: "#00247D", secondary: "#CC142B", accent: "#E8EAEF" },
  BEL: { primary: "#0B0B0B", secondary: "#FAE042", accent: "#C8102E" },
  EGY: { primary: "#CE1126", secondary: "#0B0B0B", accent: "#C6A000" },

  // Group H
  KSA: { primary: "#006C35", secondary: "#FFC72C", accent: "#F4F4F4" },
  URU: { primary: "#0038A8", secondary: "#FCD116", accent: "#E8F0FF" },
  ESP: { primary: "#AA151B", secondary: "#F1BF00", accent: "#5C0A0D" },
  CPV: { primary: "#003893", secondary: "#CF2027", accent: "#E8EAEF" },

  // Group I
  FRA: { primary: "#002654", secondary: "#F4F4F8", accent: "#ED2939" },
  SEN: { primary: "#00853F", secondary: "#FDEF42", accent: "#E31B23" },
  IRQ: { primary: "#CE1126", secondary: "#E8EAEF", accent: "#121212" },
  NOR: { primary: "#BA0C2F", secondary: "#00205B", accent: "#EEF2F6" },

  // Group J
  ARG: { primary: "#6CACE4", secondary: "#F5F6FA", accent: "#C9A227" },
  ALG: { primary: "#006633", secondary: "#D21034", accent: "#F4F4F4" },
  AUT: { primary: "#ED2939", secondary: "#F4F4F4", accent: "#0B0B0B" },
  JOR: { primary: "#0B0B0B", secondary: "#CE1126", accent: "#E8EAEF" },

  // Group K
  POR: { primary: "#046A38", secondary: "#DA291C", accent: "#E8C400" },
  COD: { primary: "#007FFF", secondary: "#F7D618", accent: "#CE1126" },
  UZB: { primary: "#1EB53A", secondary: "#0099B5", accent: "#E8EAEF" },
  COL: { primary: "#003893", secondary: "#FCD116", accent: "#CE1126" },

  // Group L
  GHA: { primary: "#006B3F", secondary: "#FCD116", accent: "#CE1126" },
  PAN: { primary: "#005293", secondary: "#D21034", accent: "#E8EAEF" },
  ENG: { primary: "#E8EAED", secondary: "#C8102E", accent: "#0B1B3A" },
  CRO: { primary: "#002D72", secondary: "#C8102E", accent: "#F4F4F8" },
};

export function getTeamUiPalette(code: string): TeamUiPalette | undefined {
  return TEAM_UI_PALETTE[code];
}
