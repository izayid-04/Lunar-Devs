"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import CurvedPlanetCarousel from "@/components/home/curved-planet-carousel";
import {
  ArrowRight,
  Eye
} from "lucide-react";

export default function Hero() {
  const { user, loading } = useAuth();
  const heroRef = useRef<HTMLElement>(null);

  // Effet de parallaxe au scroll fluide
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.1]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden border-b border-border pt-16 pb-20 sm:pt-24 sm:pb-32"
    >
      {/* Halos d'ambiance spatiale */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 right-10 size-80 rounded-full bg-success/5 blur-[100px]" />

      <motion.div style={{ opacity: textOpacity }} className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/70 px-4 py-1.5 backdrop-blur-md shadow-sm mb-6"
        >
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            Station Coloniale Sol-04 • Nova Terra
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.08]"
        >
          Bienvenue dans la Cité des{" "}
          <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent">
            Six Dômes
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-base text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          Une colonie planétaire autonome alliant biosphère haute fidélité, énergie stellaire et
          services municipaux en temps réel.
        </motion.p>

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {user ? (
              <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 gap-2 h-12 px-7 text-base">
                <Link href="/dashboard">
                  Ouvrir mon Cockpit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 gap-2 h-12 px-7 text-base">
                  <Link href="/inscription">
                    Rejoindre la Colonie
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-7 text-base">
                  <Link href="/districts">
                    <Eye className="size-4 mr-2" />
                    Explorer les Dômes
                  </Link>
                </Button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Carrousel Incurvé 3D Multizones de la Planète */}
      <div className="relative mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <CurvedPlanetCarousel />
      </div>
    </section>
  );
}
