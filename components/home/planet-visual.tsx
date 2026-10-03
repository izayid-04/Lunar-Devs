"use client";

import { motion, type MotionValue } from "motion/react";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";

export default function PlanetVisual({
  scale,
  rotate,
}: {
  scale: MotionValue<number> | number;
  rotate: MotionValue<number> | number;
}) {
  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
      {/* Anneaux statiques (alignés sur le rayon des orbites ci-dessous) */}
      <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <circle
          cx="50%"
          cy="50%"
          r="88"
          fill="none"
          stroke="var(--nova-2)"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
        <circle
          cx="50%"
          cy="50%"
          r="112"
          fill="none"
          stroke="var(--nova)"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
      </svg>

      <OrbitingCircles radius={88} duration={14} path={false}>
        <span className="block size-2 rounded-full bg-nova-2 shadow-[0_0_8px_var(--nova-2)]" />
      </OrbitingCircles>
      <OrbitingCircles radius={112} duration={22} reverse path={false}>
        <span className="block size-1.5 rounded-full bg-nova shadow-[0_0_8px_var(--nova)]" />
      </OrbitingCircles>

      <motion.div
        style={{ scale, rotate }}
        className="h-24 w-24 rounded-full"
        aria-hidden="true"
      >
        <div
          className="size-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, var(--nova-2), var(--nova) 70%)",
            boxShadow: "0 0 50px -6px var(--nova-2)",
          }}
        />
      </motion.div>
    </div>
  );
}
