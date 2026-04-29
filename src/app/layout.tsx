import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cup26 Arena",
    template: "%s | Cup26 Arena",
  },
  description: "Predict World Cup 2026 matches, earn points, climb the leaderboard.",
};

export const viewport: Viewport = {
  themeColor: "#06080d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={`${outfit.className} min-h-screen`}>{children}</body>
    </html>
  );
}
