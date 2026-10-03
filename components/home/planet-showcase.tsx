"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Globe2,
  Wind,
  Shield,
  Thermometer,
  Sparkles
} from "lucide-react";

const PLANET_FEATURES = [
  {
    id: "atmosphere",
    title: "Biosphère & Oxygénation",
    tag: "99.8% O₂ Purifié",
    icon: Wind,
    description: "Système de photosynthèse géothermique alimenté par les bio-algues du Dôme Beta. Cycle de respiration régulé à 1013 hPa.",
    stat: "1013 hPa",
    statLabel: "Pression moyenne",
  },
  {
    id: "energy",
    title: "Centrale à Fusion Stellaire",
    tag: "5.0 GW Continu",
    icon: Zap,
    description: "Capteurs photoniques et réacteurs tokamak à confinement magnétique captant les vents solaires. Énergie propre et inépuisable.",
    stat: "94.2%",
    statLabel: "Rendement global",
  },
  {
    id: "shield",
    title: "Bouclier Magnétique Dôme Alpha",
    tag: "Protection Niv. 5",
    icon: Shield,
    description: "Défense active contre les rayonnements cosmiques et micrométéorites. Ciel transparent à transmittance photonique réglable.",
    stat: "100%",
    statLabel: "Intégrité structurelle",
  },
  {
    id: "climate",
    title: "Climatisation Planétaire",
    tag: "21.5°C Stable",
    icon: Thermometer,
    description: "Cycles thermiques jour/nuit artificiels synchronisés pour le biorythme humain et les cultures hydroponiques de haute altitude.",
    stat: "21.5°C",
    statLabel: "Température dôme",
  },
];

export default function PlanetShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="relative overflow-hidden border-b border-border py-24 px-6">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary px-3 py-1 text-xs">
            <Sparkles className="size-3.5" />
            Exploration de la Colonie
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Vivre sur Nova Terra : La Cité du Futur
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Bâtie sur les hauts plateaux de Solaria, Nova Terra combine écologie de pointe,
            technologies de survie autonomes et démocratie participative en temps réel.
          </p>
        </div>

        {/* Interactive Holographic Planet Visual */}
        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative flex items-center justify-center">
            {/* Ambient Rings */}
            <div className="relative size-72 sm:size-88 rounded-full border border-dashed border-primary/30 flex items-center justify-center animate-[spin_60s_linear_infinite]">
              <div className="absolute top-0 size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
              <div className="absolute bottom-10 right-4 size-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
            </div>

            {/* Inner Ring */}
            <div className="absolute size-60 sm:size-72 rounded-full border border-border/70 animate-[spin_40s_linear_infinite_reverse]" />

            {/* The Planet Sphere */}
            <motion.div
              className="absolute size-44 sm:size-56 rounded-full bg-gradient-to-tr from-[#151516] via-[#262628] to-primary/40 shadow-[inset_-15px_-15px_40px_rgba(0,0,0,0.8),0_0_50px_rgba(224,93,56,0.25)] border border-primary/30 flex flex-col items-center justify-center text-center p-4 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Globe2 className="size-12 text-primary opacity-80" />
              <span className="mt-2 text-xs font-mono font-bold tracking-widest uppercase text-foreground">
                NOVA TERRA
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                COORD: 42°N • 108°E
              </span>
            </motion.div>

            {/* Interactive Pulse Indicators */}
            <div className="absolute bottom-4 left-6 rounded-lg border border-border bg-card/90 px-3 py-1.5 shadow-md backdrop-blur-md text-xs">
              <span className="text-muted-foreground">Population active :</span>{" "}
              <strong className="text-foreground">48 920 habitants</strong>
            </div>

            <div className="absolute top-6 right-6 rounded-lg border border-border bg-card/90 px-3 py-1.5 shadow-md backdrop-blur-md text-xs">
              <span className="inline-block size-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
              <strong className="text-foreground">Biosphère Équilibrée</strong>
            </div>
          </div>

          {/* Features Selector Accordion / Tabs */}
          <div className="flex flex-col gap-3">
            {PLANET_FEATURES.map((feat, index) => {
              const isSelected = activeFeature === index;
              const Icon = feat.icon;

              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveFeature(index)}
                  className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-primary/60 bg-card shadow-md"
                      : "border-border/70 bg-card/50 hover:border-border hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {feat.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {feat.statLabel}: <span className="font-semibold text-foreground">{feat.stat}</span>
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] transition-colors ${
                        isSelected ? "border-primary text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {feat.tag}
                    </Badge>
                  </div>

                  {isSelected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-2.5"
                    >
                      {feat.description}
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
