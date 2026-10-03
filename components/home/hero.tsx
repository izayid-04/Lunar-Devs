"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Globe,
  Radio,
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

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
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

      {/* Visuel Planétaire Phare & Cadre Holographique Immersif */}
      <div className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <motion.div
          style={{ y: imageY, scale: imageScale }}
          className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl transition-all duration-500 hover:border-primary/50"
        >
          {/* L'image générée cinématique de Nova Terra */}
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src="/nova-terra-planet.jpg"
              alt="Vue orbitale cinématique de la planète Nova Terra et ses biodômes éclairés"
              fill
              priority
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Dégradé doux sur les bords pour fondre avec le thème */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
          </div>

          {/* Cartouches Flottants d'Informations Planétaires en Temps Réel */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-2">
            <Badge className="bg-background/80 text-foreground backdrop-blur-md border border-border/80 font-mono text-xs gap-1.5 py-1 px-3">
              <Globe className="size-3.5 text-primary" />
              COORD: SOL-42 • DÔME ALPHA
            </Badge>
            <Badge className="bg-background/80 text-success backdrop-blur-md border border-border/80 text-xs gap-1.5 py-1 px-3">
              <span className="size-1.5 rounded-full bg-success animate-ping" />
              BIOSPHERE ACTIVE (1013 hPa)
            </Badge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/85 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Radio className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Télémétrie Coloniale en Direct
                </h4>
                <p className="text-xs text-muted-foreground">
                  48 920 habitants répartis sous les 6 dômes interconnectés par Maglev.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button asChild size="sm" variant="secondary" className="text-xs h-9">
                <Link href="/districts">Voir la carte détaillée ↗</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
