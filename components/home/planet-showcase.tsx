"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useAccessibility } from "@/lib/accessibility-context";
import { fetchServices, type Service } from "@/lib/api";
import { type MarkerLocation } from "@/components/ui/interactive-globe";

// F58 + F61 : Import dynamique du globe 3D lourd (cobe / WebGL)
const InteractiveGlobe = dynamic(() => import("@/components/ui/interactive-globe"), {
  ssr: false,
  loading: () => (
    <div className="size-full flex items-center justify-center rounded-full bg-primary/5 border border-primary/20 text-xs text-muted-foreground animate-pulse">
      Initialisation du globe…
    </div>
  ),
});
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

// Présentation des 5 vrais quartiers de Nova Terra (lib/alerts.ts, DISTRICTS)
// sur un globe 3D. Image, slug et sous-titre restent de la mise en scène
// (aucune route API ne décrit un quartier en tant que tel), mais les
// coordonnées, le nombre de services et la liste de services affichés sont
// ceux réellement renvoyés par GET /services — plus aucune statistique
// inventée (population, pression, énergie…).
const DISTRICT_PRESENTATION: Record<string, { image: string; imageAlt: string; badge: string; fallbackCoords: [number, number] }> = {
  "Centre-Ville": {
    image: "/dome-alpha.webp",
    imageAlt: "Vue intérieure du centre-ville avec verrière hexagonale et jardins suspendus",
    badge: "Cœur administratif",
    fallbackCoords: [45.2, 12.8],
  },
  "Port Stellaire": {
    image: "/port-spatial.webp",
    imageAlt: "Terminal du port avec navettes et quais",
    badge: "Logistique & santé",
    fallbackCoords: [-15.5, 48.2],
  },
  "Faubourg Est": {
    image: "/biocentre.webp",
    imageAlt: "Biosphère et installations de distribution d'eau et d'énergie",
    badge: "Eau & énergie",
    fallbackCoords: [22.4, -40.6],
  },
  "Hauts de Nova": {
    image: "/residentiel.webp",
    imageAlt: "Quartier résidentiel en hauteur",
    badge: "Résidentiel",
    fallbackCoords: [10.1, -60.3],
  },
  "Quartier des Dunes": {
    image: "/nova-terra-planet.webp",
    imageAlt: "Vue du quartier des Dunes",
    badge: "Éducation & tourisme",
    fallbackCoords: [-30.6, 20.4],
  },
};

type DistrictCard = {
  id: string;
  name: string;
  badge: string;
  coordinates: [number, number];
  image: string;
  imageAlt: string;
  services: Service[];
};

export default function PlanetShowcase() {
  const { lightMode, reducedMotion } = useAccessibility();
  const [services, setServices] = useState<Service[] | null>(null);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(0);

  useEffect(() => {
    fetchServices().then(setServices).catch(() => setServices([]));
  }, []);

  const cities: DistrictCard[] = Object.entries(DISTRICT_PRESENTATION).map(([name, meta]) => {
    const districtServices = (services ?? []).filter((s) => s.district === name);
    const withCoords = districtServices.find((s) => s.latitude && s.longitude);
    const coordinates: [number, number] = withCoords
      ? [Number(withCoords.latitude), Number(withCoords.longitude)]
      : meta.fallbackCoords;
    return {
      id: name,
      name,
      badge: meta.badge,
      coordinates,
      image: meta.image,
      imageAlt: meta.imageAlt,
      services: districtServices,
    };
  });

  const currentCity = cities[selectedCityIndex];

  const globeMarkers: MarkerLocation[] = cities.map((c, i) => ({
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
          {cities.map((city, idx) => {
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
          <div
            className="lg:col-span-5 flex flex-col items-center justify-center relative"
            role="region"
            aria-label="Représentation 3D interactive de la planète Nova Terra et de ses dômes"
          >
            <div className="sr-only" aria-live="polite">
              Quartier sélectionné sur la planète : {currentCity.name}, {currentCity.services.length} service
              {currentCity.services.length === 1 ? "" : "s"} municipal{currentCity.services.length === 1 ? "" : "aux"}.
            </div>
            <div className="relative size-[290px] sm:size-[360px] md:size-[400px] flex items-center justify-center">
              {!lightMode && !reducedMotion ? (
                <InteractiveGlobe
                  className="w-full h-full"
                  markers={globeMarkers}
                  selectedIndex={selectedCityIndex}
                  onSelectMarker={(idx) => setSelectedCityIndex(idx)}
                />
              ) : (
                <div className="size-[260px] sm:size-[300px] rounded-full border-2 border-primary/30 bg-primary/5 flex flex-col items-center justify-center p-6 text-center shadow-inner">
                  <div className="size-4 rounded-full bg-primary animate-none mb-3" />
                  <span className="font-mono text-xs font-semibold uppercase text-primary tracking-wider">
                    Mode Sobre • Représentation 2D
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Secteur actif : <strong className="text-foreground">{currentCity.name}</strong>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {currentCity.coordinates[0]}°N • {currentCity.coordinates[1]}°E
                  </p>
                </div>
              )}
            </div>

            {!lightMode && !reducedMotion && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <RotateCcw className="size-3.5 text-primary animate-spin" style={{ animationDuration: "12s" }} aria-hidden="true" />
                <span>Cliquez sur un point lumineux ou glissez le globe</span>
              </div>
            )}
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
                <div className="relative h-56 sm:h-72 w-full rounded-2xl overflow-hidden border border-border group bg-muted/40">
                  {!lightMode ? (
                    <Image
                      src={currentCity.image}
                      alt={currentCity.imageAlt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-card">
                      <span className="font-mono text-sm text-muted-foreground">Vue schématique : {currentCity.name}</span>
                    </div>
                  )}
                  <div data-eco-decorative className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />

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

                {/* Services réels du quartier */}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {services === null
                      ? "Chargement des services de ce quartier…"
                      : currentCity.services.length === 0
                      ? "Aucun service municipal recensé dans ce quartier pour le moment."
                      : `${currentCity.services.length} service${currentCity.services.length === 1 ? "" : "s"} municipal${currentCity.services.length === 1 ? "" : "aux"} dans ce quartier.`}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    {currentCity.services.slice(0, 4).map((svc) => (
                      <Link
                        key={svc.id}
                        href={`/services/${svc.slug}`}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CheckCircle2 className="size-3.5 text-success shrink-0" />
                        <span className="underline">{svc.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="gap-2 text-xs">
                    <Link href={`/districts?quartier=${encodeURIComponent(currentCity.name)}`}>
                      Explorer ce quartier
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
