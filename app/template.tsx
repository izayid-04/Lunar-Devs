"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Un `template.tsx` est remonté à chaque navigation (contrairement à
// `layout.tsx`, qui persiste). Sur le dashboard, pour éviter tout clignotement
// ou re-montage de la sidebar, on ne met pas d'animation de transition.
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/espace") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/admin");

  if (reduceMotion || isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
