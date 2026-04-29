"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type ProfileHeroAnimatedProps = {
  teamCode: string | null;
  children: ReactNode;
};

/** Re-animates the profile hero when the favorite team changes. */
export function ProfileHeroAnimated({ teamCode, children }: ProfileHeroAnimatedProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={teamCode ?? "none"}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
