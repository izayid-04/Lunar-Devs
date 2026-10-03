"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Un `template.tsx` est remonté à chaque navigation (contrairement à
// `layout.tsx`, qui persiste) — c'est ce qui permet une transition d'entrée
// douce par page.
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
