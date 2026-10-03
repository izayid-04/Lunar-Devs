"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchServices, type Service, type ServiceAvailability } from "@/lib/api";
import { useAccessibility } from "@/lib/accessibility-context";

export interface ZoneSlide {
  id: string;
  name: string;
  sectorTag: string;
  image: string;
  description: string;
  coordinates: string;
  status: string;
  availability: ServiceAvailability;
}

// Présentation visuelle des 5 vrais quartiers de Nova Terra : seules
// l'image et l'accroche restent de la mise en scène, les coordonnées et
// le statut proviennent réellement de GET /services (plus de "Biosphère
// Optimale 1013 hPa" ou "99.8% O2" inventés).
const DISTRICT_PRESENTATION: Record<string, { sectorTag: string; image: string; fallbackCoords: [number, number] }> = {
  "Centre-Ville": {
    sectorTag: "Administration & vie civique",
    image: "/dome-alpha.webp",
    fallbackCoords: [45.2, 12.8],
  },
  "Faubourg Est": {
    sectorTag: "Eau, énergie & biosphère",
    image: "/biocentre.webp",
    fallbackCoords: [34.8, -5.2],
  },
  "Port Stellaire": {
    sectorTag: "Santé, tourisme & transit",
    image: "/port-spatial.webp",
    fallbackCoords: [-15.5, 48.2],
  },
  "Hauts de Nova": {
    sectorTag: "Voirie & habitat résidentiel",
    image: "/residentiel.webp",
    fallbackCoords: [52.1, 28.4],
  },
  "Quartier des Dunes": {
    sectorTag: "Éducation & tourisme",
    image: "/nova-terra-planet.webp",
    fallbackCoords: [-30.6, 20.4],
  },
};

const AVAILABILITY_LABEL: Record<ServiceAvailability, string> = {
  disponible: "Tous les services disponibles",
  maintenance: "Un service en maintenance",
  incident: "Un service signale un incident",
};

function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(1)}°${latDir} • ${Math.abs(lon).toFixed(1)}°${lonDir}`;
}

function buildZones(services: Service[]): ZoneSlide[] {
  return Object.entries(DISTRICT_PRESENTATION).map(([name, meta]) => {
    const districtServices = services.filter((s) => s.district === name);
    const withCoords = districtServices.find((s) => s.latitude && s.longitude);
    const coordinates = withCoords
      ? formatCoord(Number(withCoords.latitude), Number(withCoords.longitude))
      : formatCoord(meta.fallbackCoords[0], meta.fallbackCoords[1]);
    const worstAvailability: ServiceAvailability =
      districtServices.find((s) => s.availability === "incident")?.availability ??
      districtServices.find((s) => s.availability === "maintenance")?.availability ??
      "disponible";
    return {
      id: name,
      name,
      sectorTag: meta.sectorTag,
      image: meta.image,
      description:
        districtServices.length === 0
          ? "Aucun service municipal recensé dans ce quartier pour le moment."
          : `${districtServices.length} service${districtServices.length === 1 ? "" : "s"} municipal${districtServices.length === 1 ? "" : "aux"} : ${districtServices.slice(0, 3).map((s) => s.name).join(", ")}${districtServices.length > 3 ? "…" : ""}.`,
      coordinates,
      status: AVAILABILITY_LABEL[worstAvailability],
      availability: worstAvailability,
    };
  });
}

export default function CurvedPlanetCarousel() {
  const { lightMode, reducedMotion } = useAccessibility();
  const [services, setServices] = useState<Service[]>([]);
  const ZONES = useMemo(() => buildZones(services), [services]);
  // Doublon pour boucle infinie transparente (seamless marquee)
  const DOUBLE_ZONES = useMemo(() => [...ZONES, ...ZONES], [ZONES]);
  const [activeZone, setActiveZone] = useState<ZoneSlide | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetchServices().then(setServices).catch(() => setServices([]));
  }, []);

  // Respecte la préférence système ou le mode accessibilité : pas de défilement automatique si
  // l'utilisateur a demandé moins de mouvement ou le mode léger
  useEffect(() => {
    if (reducedMotion || lightMode) {
      Promise.resolve().then(() => setPaused(true));
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    Promise.resolve().then(() => setPaused(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setPaused(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [reducedMotion, lightMode]);

  return (
    <section
      aria-label="Carrousel panoramique des quartiers et infrastructures de Nova Terra"
      aria-roledescription="carrousel"
      className="relative w-full py-8 select-none"
    >
      <div className="sr-only" aria-live="polite">
        {activeZone
          ? `Secteur sélectionné : ${activeZone.name}. ${activeZone.description}. Coordonnées : ${activeZone.coordinates}.`
          : "Carrousel en défilement automatique des dômes de Nova Terra. Survolez ou naviguez au clavier pour figer une zone."}
      </div>
      {/* Curved Perspective CSS */}
      <style jsx>{`
        @keyframes curvedMarquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-track {
          display: flex;
          gap: 2rem;
          width: max-content;
          animation: curvedMarquee 38s linear infinite;
          padding: 3rem 1rem;
        }

        .marquee-container:hover .marquee-track,
        .marquee-container:focus-within .marquee-track {
          animation-play-state: paused !important;
        }

        /* L'effet incurvé : les extrémités de la scène s'affaissent et se tournent */
        .curved-viewport {
          perspective: 1200px;
          perspective-origin: center 30%;
          overflow: hidden;
          width: 100%;
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .curved-card {
          transform-origin: center bottom;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }

        .curved-card:hover {
          transform: translateY(-16px) scale(1.05) !important;
          z-index: 50;
        }
      `}</style>

      {/* Viewport incurvé avec masque progressif et perspective */}
      <div className="marquee-container curved-viewport relative">
        <div className="marquee-track" style={{ animationPlayState: paused ? "paused" : "running" }}>
          {DOUBLE_ZONES.map((zone, idx) => (
            <div
              key={`${zone.id}-${idx}`}
              tabIndex={0}
              onMouseEnter={() => setActiveZone(zone)}
              onFocus={() => setActiveZone(zone)}
              className="curved-card group relative w-[320px] sm:w-[420px] md:w-[480px] aspect-[16/10] shrink-0 rounded-3xl overflow-hidden border border-border/80 bg-card shadow-xl cursor-pointer hover:border-primary/60 hover:shadow-[0_20px_50px_-10px_rgba(224,93,56,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {!lightMode ? (
                <Image
                  src={zone.image}
                  alt={zone.name}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 340px, 480px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />
              ) : (
                <div className="absolute inset-0 bg-muted/70 flex items-center justify-center p-4 text-center">
                  <span className="font-mono text-xs text-muted-foreground">{zone.name} • {zone.sectorTag}</span>
                </div>
              )}

              {/* Gradient ombré cinématique */}
              <div data-eco-decorative className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />
              <div data-eco-decorative className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />

              {/* Badges télémétrie */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                <Badge className="bg-background/85 text-foreground backdrop-blur-md border border-border font-mono text-[10px] gap-1 py-0.5 px-2.5">
                  <MapPin className="size-3 text-primary" />
                  {zone.coordinates}
                </Badge>
                <Badge
                  className={`bg-background/85 backdrop-blur-md border border-border text-[10px] gap-1 py-0.5 px-2.5 ${
                    zone.availability === "disponible" ? "text-success" : "text-destructive"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      zone.availability === "disponible" ? "bg-success animate-ping" : "bg-destructive"
                    }`}
                  />
                  {zone.status}
                </Badge>
              </div>

              {/* Informations du dôme */}
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  {zone.sectorTag}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 group-hover:text-primary transition-colors">
                  {zone.name}
                </h3>
                <p className="text-xs text-white/80 line-clamp-2 mt-1">
                  {zone.description}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Survolez pour figer le défilement
                  </span>
                  <Button asChild size="sm" variant="secondary" className="h-7 px-3 text-[11px] gap-1 rounded-full">
                    <Link href={`/districts?quartier=${encodeURIComponent(zone.name)}`}>
                      Explorer
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contrôle de pause explicite et navigation clavier */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const curIdx = activeZone ? ZONES.findIndex((z) => z.id === activeZone.id) : 0;
            const prevIdx = (curIdx - 1 + ZONES.length) % ZONES.length;
            setActiveZone(ZONES[prevIdx]);
            setPaused(true);
          }}
          className="h-7 gap-1 px-2.5 text-xs"
          aria-label="Zone précédente du carrousel"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          <span>Précédent</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setPaused((p) => !p)}
          className="h-7 gap-1.5 px-2 text-xs"
          aria-label={paused ? "Reprendre le défilement automatique du carrousel" : "Mettre en pause le défilement automatique du carrousel"}
        >
          {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
          {paused ? "Reprendre" : "Pause"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const curIdx = activeZone ? ZONES.findIndex((z) => z.id === activeZone.id) : 0;
            const nextIdx = (curIdx + 1) % ZONES.length;
            setActiveZone(ZONES[nextIdx]);
            setPaused(true);
          }}
          className="h-7 gap-1 px-2.5 text-xs"
          aria-label="Zone suivante du carrousel"
        >
          <span>Suivant</span>
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>

        {activeZone && (
          <span className="hidden sm:inline font-medium text-foreground">
            Zone affichée : {activeZone.name}
          </span>
        )}
      </div>

      <div className="mt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-2">
        <span>Lexique Nova Terra :</span>
        <abbr title="Structure pressurisée transparente abritant un quartier complet de la colonie." className="underline decoration-dotted cursor-help text-foreground font-medium">Dôme</abbr>
        <span>•</span>
        <abbr title="Train à sustentation magnétique reliant à grande vitesse les dômes et les gares." className="underline decoration-dotted cursor-help text-foreground font-medium">Maglev</abbr>
      </div>
    </section>
  );
}
