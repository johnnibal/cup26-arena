import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        heading: "var(--heading)",
        muted: "var(--muted)",
        brand: {
          primary: "var(--brand-primary)",
          accent: "var(--brand-accent)",
          ink: "var(--brand-ink)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
          border: "var(--surface-border)",
        },
        team: {
          primary: "var(--team-primary)",
          secondary: "var(--team-secondary)",
          accent: "var(--team-accent)",
          tertiary: "var(--team-tertiary)",
          ink: "var(--team-ink)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 32px -10px rgba(0, 0, 0, 0.52), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
        "card-hover":
          "0 14px 44px -12px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(255, 255, 255, 0.07) inset",
        glow: "var(--team-glow)",
        "glow-sm": "0 0 28px -8px color-mix(in srgb, var(--team-primary) 55%, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
