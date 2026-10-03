"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRight
} from "lucide-react";

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
    image: "/dome-alpha.jpg",
    description: "Cœur politique et social abritant le Haut Conseil, les universités quantiques et le Maglev suspendu.",
    coordinates: "45.2°N • 12.8°E",
    status: "Biosphère Optimale (1013 hPa)",
  },
  {
    id: "biocentre",
    name: "Biocentre Nova — Dôme Beta",
    sectorTag: "Agriculture Verticale & Oxygénation",
    image: "/biocentre.jpg",
    description: "Tours hélicoïdales de cultures aéroponiques et bassins de bio-algues produisant 85% de la nourriture fraîche.",
    coordinates: "34.8°N • 05.2°W",
    status: "Photosynthèse Continue (99.8% O₂)",
  },
  {
    id: "port-spatial",
    name: "Port Spatial Gamma",
    sectorTag: "Transit Orbital & Sas Fret",
    image: "/port-spatial.jpg",
    description: "Terminaux d'amarrage des navettes cargo et ascenseurs orbitaux ravitaillant la colonie.",
    coordinates: "15.5°S • 48.2°E",
    status: "Dépressurisation Sas Niv. 5",
  },
  {
    id: "residentiel",
    name: "Quartier Céleste — Habitat Familial",
    sectorTag: "Terrasses Suspendues & Jardins",
    image: "/residentiel.jpg",
    description: "Modules d'habitation avec passerelles transparentes, domotique régulée et parcs suspendus.",
    coordinates: "52.1°N • 28.4°E",
    status: "Confort Résidentiel Calme",
  },
  {
    id: "orbite-globale",
    name: "Nova Terra — Panorama Orbital",
    sectorTag: "Vue Cosmique • Solaria-04",
    image: "/nova-terra-planet.jpg",
    description: "Vue d'ensemble de la planète et du réseau de dômes scintillants dans la nuit stellaire.",
    coordinates: "Altitude : 420 km",
    status: "Bouclier Magnétique Actif",
  },
];

export default function CurvedPlanetCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotation du carrousel toutes les 5 secondes
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ZONES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ZONES.length) % ZONES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ZONES.length);
  };

  // Indices relatifs pour positionner l'arc incurvé : gauche (-1), centre (0), droite (+1)
  const getSlidePosition = (index: number) => {
    const diff = (index - currentIndex + ZONES.length) % ZONES.length;
    if (diff === 0) return "center";
    if (diff === 1 || diff === -ZONES.length + 1) return "right";
    if (diff === ZONES.length - 1 || diff === -1) return "left";
    return "hidden";
  };

  return (
    <div
      className="relative w-full py-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Perspective Curved Stage */}
      <div className="relative mx-auto h-[340px] sm:h-[440px] md:h-[500px] w-full max-w-6xl overflow-hidden [perspective:1400px] flex items-center justify-center">
        {ZONES.map((zone, index) => {
          const position = getSlidePosition(index);
          const isCenter = position === "center";

          if (position === "hidden") return null;

          return (
            <motion.div
              key={zone.id}
              onClick={() => {
                if (!isCenter) setCurrentIndex(index);
              }}
              initial={false}
              animate={{
                // Arc incurvé : les cartes sur les côtés sont plus basses (translateY positif),
                // tournées vers l'intérieur (rotateY), légèrement réduites et en retrait (translateZ)
                x: position === "center" ? "0%" : position === "left" ? "-48%" : "48%",
                y: position === "center" ? "0px" : "36px", // Les côtés descendent pour créer la courbe vers le haut au centre
                scale: position === "center" ? 1 : 0.82,
                rotateY: position === "center" ? 0 : position === "left" ? 18 : -18,
                rotateZ: position === "center" ? 0 : position === "left" ? -2.5 : 2.5,
                zIndex: position === "center" ? 30 : 10,
                opacity: position === "center" ? 1 : 0.55,
              }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1], // Cubic-bezier doux
              }}
              className={`absolute top-4 w-[85%] sm:w-[72%] md:w-[68%] aspect-[16/9] rounded-3xl overflow-hidden border transition-shadow cursor-pointer ${
                isCenter
                  ? "border-primary/60 shadow-[0_25px_60px_-15px_rgba(224,93,56,0.35)] ring-1 ring-primary/30 cursor-default"
                  : "border-border/70 hover:opacity-80 shadow-lg"
              }`}
            >
              <Image
                src={zone.image}
                alt={zone.name}
                fill
                priority={isCenter}
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 65vw"
              />

              {/* Gradient Overlay pour lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />

              {/* Badges télémétrie supérieurs (affichés surtout sur la carte centrale) */}
              <div
                className={`absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-2 transition-opacity duration-300 ${
                  isCenter ? "opacity-100" : "opacity-0"
                }`}
              >
                <Badge className="bg-background/85 text-foreground backdrop-blur-md border border-border font-mono text-[11px] gap-1.5 py-1 px-3">
                  <MapPin className="size-3 text-primary" />
                  {zone.coordinates}
                </Badge>
                <Badge className="bg-background/85 text-success backdrop-blur-md border border-border text-[11px] gap-1.5 py-1 px-3">
                  <span className="size-1.5 rounded-full bg-success animate-ping" />
                  {zone.status}
                </Badge>
              </div>

              {/* Panneau d'informations bas sur la carte active */}
              {isCenter && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                  className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 rounded-2xl border border-border/80 bg-card/85 p-3.5 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                        {zone.sectorTag}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                      {zone.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-xl">
                      {zone.description}
                    </p>
                  </div>

                  <Button asChild size="sm" className="shrink-0 text-xs gap-1.5 rounded-full">
                    <Link href="/districts">
                      Explorer
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Boutons de navigation Flèches + Puces */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          className="size-10 rounded-full border-border/80 bg-card/80 hover:bg-card hover:border-primary/50 text-foreground cursor-pointer shadow-md"
          title="Zone précédente"
        >
          <ChevronLeft className="size-5" />
        </Button>

        {/* Puces de pagination */}
        <div className="flex items-center gap-2 px-2">
          {ZONES.map((zone, idx) => {
            const isActive = currentIndex === idx;
            return (
              <button
                key={zone.id}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-8 h-2 bg-primary shadow-[0_0_10px_var(--primary)]"
                    : "size-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                title={zone.name}
              />
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="size-10 rounded-full border-border/80 bg-card/80 hover:bg-card hover:border-primary/50 text-foreground cursor-pointer shadow-md"
          title="Zone suivante"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Titre informatif sous le carrousel */}
      <p className="text-center text-xs text-muted-foreground font-mono mt-3">
        Faites défiler pour explorer les dômes • Perspective incurvée Nova Terra
      </p>
    </div>
  );
}
