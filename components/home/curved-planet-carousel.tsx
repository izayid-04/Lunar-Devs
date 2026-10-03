"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";

export interface ZoneSlide {
  id: string;
  name: string;
  sectorTag: string;
  image: string;
  description: string;
  coordinates: string;
  status: string;
}

const ZONES: ZoneSlide[] = [
  {
    id: "dome-alpha",
    name: "Dôme Alpha — Capitale Civique",
    sectorTag: "Secteur Central • Verrière Bioclimatique",
    image: "/dome-alpha.webp",
    description: "Cœur politique et social abritant le Haut Conseil, les universités quantiques et le Maglev suspendu.",
    coordinates: "45.2°N • 12.8°E",
    status: "Biosphère Optimale (1013 hPa)",
  },
  {
    id: "biocentre",
    name: "Biocentre Nova — Dôme Beta",
    sectorTag: "Agriculture Verticale & Oxygénation",
    image: "/biocentre.webp",
    description: "Tours hélicoïdales de cultures aéroponiques et bassins de bio-algues produisant 85% de la nourriture fraîche.",
    coordinates: "34.8°N • 05.2°W",
    status: "Photosynthèse Continue (99.8% O₂)",
  },
  {
    id: "port-spatial",
    name: "Port Spatial Gamma",
    sectorTag: "Transit Orbital & Sas Fret",
    image: "/port-spatial.webp",
    description: "Terminaux d'amarrage des navettes cargo et ascenseurs orbitaux ravitaillant la colonie.",
    coordinates: "15.5°S • 48.2°E",
    status: "Dépressurisation Sas Niv. 5",
  },
  {
    id: "residentiel",
    name: "Quartier Céleste — Habitat Familial",
    sectorTag: "Terrasses Suspendues & Jardins",
    image: "/residentiel.webp",
    description: "Modules d'habitation avec passerelles transparentes, domotique régulée et parcs suspendus.",
    coordinates: "52.1°N • 28.4°E",
    status: "Confort Résidentiel Calme",
  },
  {
    id: "orbite-globale",
    name: "Nova Terra — Panorama Orbital",
    sectorTag: "Vue Cosmique • Solaria-04",
    image: "/nova-terra-planet.webp",
    description: "Vue d'ensemble de la planète et du réseau de dômes scintillants dans la nuit stellaire.",
    coordinates: "Altitude : 420 km",
    status: "Bouclier Magnétique Actif",
  },
];

// Doublon pour boucle infinie transparente (seamless marquee)
const DOUBLE_ZONES = [...ZONES, ...ZONES];

export default function CurvedPlanetCarousel() {
  const [activeZone, setActiveZone] = useState<ZoneSlide | null>(null);
  const [paused, setPaused] = useState(false);

  // Respecte la préférence système : pas de défilement automatique si
  // l'utilisateur a demandé moins de mouvement.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    Promise.resolve().then(() => setPaused(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setPaused(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
              <Image
                src={zone.image}
                alt={zone.name}
                fill
                sizes="(max-width: 768px) 340px, 480px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />

              {/* Gradient ombré cinématique */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />

              {/* Badges télémétrie */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                <Badge className="bg-background/85 text-foreground backdrop-blur-md border border-border font-mono text-[10px] gap-1 py-0.5 px-2.5">
                  <MapPin className="size-3 text-primary" />
                  {zone.coordinates}
                </Badge>
                <Badge className="bg-background/85 text-success backdrop-blur-md border border-border text-[10px] gap-1 py-0.5 px-2.5">
                  <span className="size-1.5 rounded-full bg-success animate-ping" />
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
                    <Link href="/districts">
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
