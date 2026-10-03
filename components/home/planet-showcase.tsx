"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import InteractiveGlobe, { MarkerLocation } from "@/components/ui/interactive-globe";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Users,
  Compass,
  RotateCcw,
  CheckCircle2
} from "lucide-react";

interface PlanetCity {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  coordinates: [number, number]; // [lat, lon]
  description: string;
  image: string;
  imageAlt: string;
  stats: {
    label: string;
    value: string;
    icon: typeof Users;
  }[];
  features: string[];
}

const CITIES: PlanetCity[] = [
  {
    id: "dome-alpha",
    name: "Dôme Alpha (Capitale)",
    badge: "Secteur Urbain Central",
    subtitle: "Hexagones bioclimatiques & Maglev suspendu",
    coordinates: [45.2, 12.8],
    description:
      "Cœur politique et névralgique de Nova Terra abritant le Haut Conseil et 24 100 résidents. Les jardins suspendus purifient l'air en circuit fermé tandis que les rames à lévitation magnétique sillonnent la canopée.",
    image: "/dome-alpha.webp",
    imageAlt: "Vue intérieure du Dôme Alpha avec verrière hexagonale et jardins suspendus",
    stats: [
      { label: "Population", value: "24 100", icon: Users },
      { label: "Pression", value: "1013 hPa", icon: ShieldCheck },
      { label: "Énergie", value: "1.8 GW", icon: Zap },
    ],
    features: [
      "Verrière intelligente filtrant les vents solaires",
      "Réseau Maglev urbain accessible à tous les résidents",
      "Agora citoyenne holographique & consultations",
    ],
  },
  {
    id: "port-spatial",
    name: "Port Spatial Gamma",
    badge: "Logistique & Fret Orbital",
    subtitle: "Ascenseurs orbitaux & Sas cargo haute capacité",
    coordinates: [-15.5, 48.2],
    description:
      "La porte d'entrée de Nova Terra. Équipé d'ascenseurs orbitaux vers la flotte commerciale et de sas pressurisés automatiques, le Port Spatial Gamma orchestre l'arrivée des cargaisons de ravitaillement et des nouveaux arrivants.",
    image: "/port-spatial.webp",
    imageAlt: "Terminal du port spatial avec navettes cargo et ascenseur orbital",
    stats: [
      { label: "Fret transit", value: "1 450 t/j", icon: Radio },
      { label: "Fréquence", value: "45 min", icon: Compass },
      { label: "Sécurité", value: "Niveau 5", icon: ShieldCheck },
    ],
    features: [
      "Amarrage simultané de 8 navettes inter-dômes",
      "Contrôle de quarantaine automatisé en temps réel",
      "Corridor direct vers le réseau de fret souterrain",
    ],
  },
  {
    id: "solaria-energy",
    name: "Secteur Solaria (Énergie)",
    badge: "Centrale Stellaire",
    subtitle: "Tokamaks à fusion & concentrateurs photoniques",
    coordinates: [22.4, -40.6],
    description:
      "Vaste complexe énergétique captant les flux solaires et alimenté par 3 réacteurs tokamak à confinement magnétique. Il fournit 100% de l'électricité propre distribuée par câbles supraconducteurs à l'ensemble des dômes.",
    image: "/nova-terra-planet.webp",
    imageAlt: "Vue de la planète Nova Terra et de ses gisements énergétiques",
    stats: [
      { label: "Production", value: "5.0 GW", icon: Zap },
      { label: "Rendement", value: "98.4%", icon: ShieldCheck },
      { label: "Techniciens", value: "3 200", icon: Users },
    ],
    features: [
      "Stockage thermique en sels minéraux fondus",
      "Distribution haute tension supraconductrice",
      "Sécurité énergétique garantie sur 50 ans",
    ],
  },
];

export default function PlanetShowcase() {
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(0);
  const currentCity = CITIES[selectedCityIndex];

  const globeMarkers: MarkerLocation[] = CITIES.map((c, i) => ({
    id: c.id,
    name: c.name,
    location: c.coordinates,
    size: i === selectedCityIndex ? 0.08 : 0.05,
  }));

  return (
    <section className="relative overflow-hidden border-b border-border py-24 px-6 bg-card/10">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -left-40 top-1/3 size-96 rounded-full bg-primary/10 blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 size-96 rounded-full bg-primary/5 blur-[150px]" />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary px-3 py-1 text-xs">
            <Sparkles className="size-3.5" />
            Globe 3D Interactif & Cartographie Stellaire
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Explorez la Planète Nova Terra
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Faites tourner la planète et <strong>cliquez directement sur les balises lumineuses</strong> pour inspecter chaque dôme et afficher sa vue réelle avec sa télémétrie en temps réel.
          </p>
        </div>

        {/* City Quick Selector Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {CITIES.map((city, idx) => {
            const isSelected = selectedCityIndex === idx;
            return (
              <button
                key={city.id}
                onClick={() => setSelectedCityIndex(idx)}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "border border-border/80 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary/40"
                }`}
              >
                <span
                  className={`size-2 rounded-full transition-colors ${
                    isSelected ? "bg-white animate-pulse" : "bg-primary/70"
                  }`}
                />
                <span>{city.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Globe + Visual Inspector Grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border/80 bg-card/40 p-4 sm:p-6 lg:p-8 backdrop-blur-md shadow-2xl">
          {/* Interactive 3D Globe with Clickable Beacon Pins */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative size-[290px] sm:size-[360px] md:size-[400px] flex items-center justify-center">
              <InteractiveGlobe
                className="w-full h-full"
                markers={globeMarkers}
                selectedIndex={selectedCityIndex}
                onSelectMarker={(idx) => setSelectedCityIndex(idx)}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <RotateCcw className="size-3.5 text-primary animate-spin" style={{ animationDuration: "12s" }} />
              <span>Cliquez sur un point lumineux ou glissez le globe</span>
            </div>
          </div>

          {/* City Visual Display & Live Telemetry Panel */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* City Photographic Showcase */}
                <div className="relative h-56 sm:h-72 w-full rounded-2xl overflow-hidden border border-border group">
                  <Image
                    src={currentCity.image}
                    alt={currentCity.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />

                  {/* Telemetry live tag */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 backdrop-blur-md text-[11px] text-white">
                    <span className="size-2 rounded-full bg-success animate-pulse" />
                    <span className="font-mono">
                      COORD: {currentCity.coordinates[0]}°N • {currentCity.coordinates[1]}°E
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3.5 right-3.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                      {currentCity.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {currentCity.name}
                    </h3>
                  </div>
                </div>

                {/* Description & Features */}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {currentCity.description}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentCity.stats.map((st, i) => {
                      const Icon = st.icon;
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-border/80 bg-card/80 p-2.5 text-center"
                        >
                          <Icon className="size-3.5 text-primary mx-auto mb-1 opacity-80" />
                          <div className="text-xs sm:text-sm font-bold text-foreground font-mono">
                            {st.value}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {st.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
                    {currentCity.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-success shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="gap-2 text-xs">
                    <Link href="/districts">
                      Explorer tous les dômes
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="text-xs">
                    <Link href="/inscription">
                      Rejoindre ce secteur
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
