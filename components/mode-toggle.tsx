"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Une seule icône à la fois (celle du thème vers lequel on bascule), pas
// une paire soleil/lune + interrupteur.
export default function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {reduceMotion ? (
        isDark ? <Sun className="size-4" /> : <Moon className="size-4" />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "sun" : "moon"}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </motion.span>
        </AnimatePresence>
      )}
    </Button>
  );
}
