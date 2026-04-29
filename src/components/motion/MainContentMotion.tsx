"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type MainContentMotionProps = {
  children: ReactNode;
};

/** Subtle page content entrance; respects `prefers-reduced-motion`. */
export function MainContentMotion({ children }: MainContentMotionProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="min-h-0"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
