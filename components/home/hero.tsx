"use client";

import { useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Meteors } from "@/components/ui/meteors";
import StarfieldCanvas from "@/components/starfield-canvas";
import PlanetVisual from "@/components/home/planet-visual";
import { MapPin, Users, Gauge, Clock } from "lucide-react";

export default function Hero() {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const reduceMotion = useReducedMotion();

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const planetScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 1.4]
  );
  const planetRotate = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 110]
  );
  const hyperspaceOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 1]
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-border"
    >
      <StarfieldCanvas className="absolute inset-0" />
      {isDark && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ opacity: hyperspaceOpacity }}
        >
          <Meteors
            number={16}
            className="bg-nova-2 shadow-[0_0_6px_var(--nova-2)]"
          />
        </motion.div>
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          SYSTÈME EN LIGNE · NOVA TERRA
        </div>

        <PlanetVisual scale={planetScale} rotate={planetRotate} />

        <h1 className="mt-8 text-3xl font-semibold tracking-wide sm:text-4xl">
          Les services de la ville, en un seul endroit
        </h1>
        <p className="mt-3 text-muted-foreground">
          Créez votre compte habitant pour accéder à votre espace personnel
          et suivre vos démarches auprès des services municipaux.
        </p>

        {!loading && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/espace">Accéder à mon espace</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/inscription">Créer un compte</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/connexion">Connexion</Link>
                </Button>
              </>
            )}
          </div>
        )}

        <dl className="mx-auto mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat icon={MapPin} value={6} label="Quartiers" />
          <Stat icon={Users} value={3} label="Profils" />
          <Stat icon={Clock} value={24} suffix="/7" label="Accès à l'espace" />
          <Stat icon={Gauge} value={100} suffix="%" label="Auto-hébergé" />
        </dl>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  suffix,
  label,
}: {
  icon: typeof MapPin;
  value: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="size-4 text-nova-2" aria-hidden="true" />
      <p className="font-heading text-2xl font-semibold tracking-wide text-foreground dark:text-foreground">
        <NumberTicker
          value={value}
          className="text-foreground dark:text-foreground"
        />
        {suffix}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
