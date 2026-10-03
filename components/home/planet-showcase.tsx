"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Building2,
  Rocket,
  Globe2,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Users
} from "lucide-react";

interface SectorDetail {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  stats: {
    label: string;
    value: string;
    icon: typeof Activity;
  }[];
  highlights: string[];
}

const SECTORS: SectorDetail[] = [
  {
    id: "dome-alpha",
    tabLabel: "Dôme Alpha (Capitale)",
    badge: "Secteur Urbain & Conseil",
    title: "Le Dôme Alpha : Cité Vivante sous Verrière",
    subtitle: "Hexagones bioclimatiques & Maglev suspendu",
    description:
      "Abritant le Haut Conseil et plus de 24 000 résidents, le Dôme Alpha fusionne architecture organique et biosphère régulée. Les jardins suspendus purifient l'air en circuit fermé tandis que les rames à lévitation magnétique sillonnent la canopée.",
    image: "/dome-alpha.jpg",
    imageAlt: "Vue intérieure du Dôme Alpha avec verrière hexagonale et jardins suspendus",
    stats: [
      { label: "Population active", value: "24 100", icon: Users },
      { label: "Pression régulée", value: "1013 hPa", icon: ShieldCheck },
      { label: "Énergie propre", value: "1.8 GW", icon: Zap },
    ],
    highlights: [
      "Verrière intelligente filtrant les vents solaires",
      "Réseau Maglev urbain accessible à tous les résidents",
      "Chambres civiques et agora citoyenne connectée",
    ],
  },
  {
    id: "port-spatial",
    tabLabel: "Port Spatial Gamma",
    badge: "Logistique & Fret Orbital",
    title: "Port Spatial Gamma : La Porte des Étoiles",
    subtitle: "Ascenseurs orbitaux & Sas cargo haute capacité",
    description:
      "Point d'ancrage névralgique de Nova Terra, le Port Spatial Gamma orchestre l'arrivée des cargos interplanétaires et le flux des nouveaux arrivants. Équipé de sas pressurisés et d'un contrôle automatique de biosécurité, il garantit la résilience de toute la colonie.",
    image: "/port-spatial.jpg",
    imageAlt: "Terminal du port spatial avec navettes cargo et ascenseur orbital",
    stats: [
      { label: "Transit journalier", value: "1 450 t", icon: Rocket },
      { label: "Fréquence navettes", value: "Toutes les 45m", icon: Radio },
      { label: "Sécurité sas", value: "Niveau 5", icon: ShieldCheck },
    ],
    highlights: [
      "Amarrage simultané de 8 navettes inter-dômes",
      "Contrôle de quarantaine automatisé en temps réel",
      "Corridor direct vers le réseau de fret souterrain",
    ],
  },
  {
    id: "orbite-terra",
    tabLabel: "Vue Orbitale Globale",
    badge: "Télémétrie Planétaire",
    title: "Nova Terra depuis l'Espace",
    subtitle: "Anneaux de détection & surveillance cosmique",
    description:
      "Perchée sur les reliefs dorés de Solaria, la constellation de dômes brille dans la nuit stellaire. Les capteurs orbitaux mesurent en continu l'activité géothermique, le flux photonique et l'équilibre atmosphérique pour préserver les générations futures.",
    image: "/nova-terra-planet.jpg",
    imageAlt: "Nova Terra vue depuis l'orbite avec ses reliefs et halos lumineux",
    stats: [
      { label: "Diamètre dôme", value: "12.4 km", icon: Globe2 },
      { label: "Stabilité biosphère", value: "99.8%", icon: Activity },
      { label: "Autonomie globale", value: "100%", icon: Zap },
    ],
    highlights: [
      "Réseau de 12 satellites météorologiques géostationnaires",
      "Bouclier magnétique global contre les éruptions solaires",
      "Démocratie numérique distribuée sur registre inviolable",
    ],
  },
];

export default function PlanetShowcase() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const current = SECTORS[activeTab];

  return (
    <section className="relative overflow-hidden border-b border-border py-24 px-6 bg-card/10">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -left-40 top-1/3 size-96 rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 size-96 rounded-full bg-primary/5 blur-[140px]" />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary px-3 py-1 text-xs">
            <Sparkles className="size-3.5" />
            Exploration Visuelle de la Colonie
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Vivre sur Nova Terra : Au Cœur des Dômes
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Découvrez les infrastructures réelles et la vie quotidienne dans notre cité spatiale.
            Naviguez entre les secteurs pour observer la technologie et l&apos;organisation de notre biosphère.
          </p>
        </div>

        {/* Tab selection */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {SECTORS.map((sector, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={sector.id}
                onClick={() => setActiveTab(idx)}
                className={`group relative flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "border border-border/80 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary/40"
                }`}
              >
                {idx === 0 && <Building2 className="size-4" />}
                {idx === 1 && <Rocket className="size-4" />}
                {idx === 2 && <Globe2 className="size-4" />}
                <span>{sector.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Panel */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl border border-border/80 bg-card/50 p-4 sm:p-6 lg:p-8 backdrop-blur-md shadow-xl"
            >
              {/* Image Frame with glowing overlay and badge */}
              <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-border group">
                <Image
                  src={current.image}
                  alt={current.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  priority
                />
                {/* Vignette & cinematic gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                {/* Overlaid telemetry tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md text-xs text-white">
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  <span className="font-mono uppercase tracking-wider text-[11px]">
                    Flux Caméra Direct • Solaria
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                    {current.badge}
                  </p>
                  <p className="text-sm font-medium text-white/90 mt-0.5 line-clamp-1">
                    {current.subtitle}
                  </p>
                </div>
              </div>

              {/* Text & Live Telemetry Details */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  <Badge variant="outline" className="border-primary/40 text-primary text-[11px] mb-3">
                    {current.badge}
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                    {current.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed">
                    {current.description}
                  </p>

                  {/* Highlights checklist */}
                  <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
                    {current.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <span className="mt-0.5 size-1.5 rounded-full bg-primary shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats cards row */}
                <div>
                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-border/60">
                    {current.stats.map((st, i) => {
                      const Icon = st.icon;
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-border/70 bg-card p-3 text-center transition-colors hover:border-primary/40"
                        >
                          <Icon className="size-3.5 text-primary mx-auto mb-1 opacity-80" />
                          <div className="text-xs sm:text-sm font-bold text-foreground font-mono">
                            {st.value}
                          </div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {st.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Button asChild size="sm" className="w-full gap-2">
                      <Link href="/districts">
                        Explorer tous les dômes
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
