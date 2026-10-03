"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  TrainFront,
  Zap,
  Trees,
  Activity,
  Shield,
  ArrowRight
} from "lucide-react";

type District = {
  id: string;
  name: string;
  tagline: string;
  icon: typeof Compass;
  pressure: string;
  population: string;
  services: string[];
};

const DISTRICTS: District[] = [
  {
    id: "port-spatial",
    name: "Port Spatial Gamma",
    tagline: "Logistique & Fret Orbital",
    icon: TrainFront,
    pressure: "1010 hPa",
    population: "6 500 agents",
    services: [
      "Ascenseurs orbitaux et quais de transit",
      "Liaison directe par navette vers la Terre",
      "Douanes pressurisées & biosécurité",
    ],
  },
  {
    id: "centre-admin",
    name: "Dôme Alpha (Capitale)",
    tagline: "Conseil & Agora Citoyenne",
    icon: Compass,
    pressure: "1013 hPa",
    population: "24 100 résidents",
    services: [
      "Siège du Conseil Municipal & Guichets",
      "Passeport citoyen & démarches en ligne",
      "Agora holographique et votes directs",
    ],
  },
  {
    id: "biocentre",
    name: "Biocentre Nova (Dôme Beta)",
    tagline: "Biosphère & Hydroponie",
    icon: Trees,
    pressure: "1015 hPa",
    population: "8 400 biologistes",
    services: [
      "Tours aéroponiques & nourriture fraîche",
      "Parcs botaniques à haute oxygénation",
      "Recyclage cyclique de l'eau à 99.4%",
    ],
  },
  {
    id: "technopole",
    name: "Parc Tech & Innovation",
    tagline: "Laboratoires & Métallurgie",
    icon: Shield,
    pressure: "1011 hPa",
    population: "4 100 ingénieurs",
    services: [
      "Fablabs en gravité allégée",
      "Prototypage de boucliers magnétiques",
      "Incubateur de technologies stellaires",
    ],
  },
  {
    id: "energie",
    name: "Secteur Solaria",
    tagline: "Centrale Énergétique Stellaire",
    icon: Zap,
    pressure: "1008 hPa",
    population: "3 200 techniciens",
    services: [
      "Réacteurs Tokamak à fusion propre",
      "Champs de concentrateurs solaires",
      "Grille de supraconductivité dôme-à-dôme",
    ],
  },
  {
    id: "residentiel",
    name: "Quartier Résidentiel Céleste",
    tagline: "Habitat & Espaces Familiaux",
    icon: Activity,
    pressure: "1012 hPa",
    population: "14 200 familles",
    services: [
      "Modules d'habitation avec domotique verte",
      "Centres médicaux de régénération",
      "Micro-marchés & écoles connectées",
    ],
  },
];

const CX = 160;
const CY = 160;
const OUTER_R = 135;
const INNER_R = 56;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(index: number, count: number) {
  const step = 360 / count;
  const a0 = index * step + 2; // small gap for futuristic segmented look
  const a1 = a0 + step - 4;
  const o0 = polar(CX, CY, OUTER_R, a0);
  const o1 = polar(CX, CY, OUTER_R, a1);
  const i1 = polar(CX, CY, INNER_R, a1);
  const i0 = polar(CX, CY, INNER_R, a0);
  return `M ${o0.x} ${o0.y} A ${OUTER_R} ${OUTER_R} 0 0 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${INNER_R} ${INNER_R} 0 0 0 ${i0.x} ${i0.y} Z`;
}

export default function DistrictMap() {
  const [active, setActive] = useState<District | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const selectedOrHovered = hovered !== null ? DISTRICTS[hovered] : DISTRICTS[1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
      {/* Interactive Radial Radar Canvas */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="relative size-72 sm:size-84 flex items-center justify-center">
          {/* Subtle radar sweep line */}
          <div className="pointer-events-none absolute size-72 sm:size-84 rounded-full border border-dashed border-primary/20 animate-[spin_30s_linear_infinite]" />

          <svg
            viewBox="0 0 320 320"
            className="w-full h-full drop-shadow-[0_0_25px_rgba(224,93,56,0.15)]"
            role="group"
            aria-label="Carte interactive des quartiers de Nova Terra"
          >
            {DISTRICTS.map((district, i) => {
              const isHovered = hovered === i;
              return (
                <motion.path
                  key={district.name}
                  d={sectorPath(i, DISTRICTS.length)}
                  fill={isHovered ? "var(--primary)" : "var(--card)"}
                  stroke={isHovered ? "var(--primary)" : "var(--border)"}
                  strokeWidth={1.5}
                  role="button"
                  tabIndex={0}
                  aria-label={`${district.name} — voir les services`}
                  className="cursor-pointer outline-none transition-colors duration-200"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  onClick={() => setActive(district)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActive(district);
                    }
                  }}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  style={{
                    transformOrigin: `${CX}px ${CY}px`,
                  }}
                />
              );
            })}

            {/* Center Core of the City */}
            <circle
              cx={CX}
              cy={CY}
              r={INNER_R - 6}
              fill="var(--card)"
              stroke="var(--primary)"
              strokeWidth={2}
              className="filter drop-shadow-md"
            />
            <text
              x={CX}
              y={CY - 5}
              textAnchor="middle"
              className="fill-foreground font-heading font-bold"
              style={{ fontSize: 13, letterSpacing: "0.05em" }}
            >
              NOVA
            </text>
            <text
              x={CX}
              y={CY + 12}
              textAnchor="middle"
              className="fill-primary font-mono font-semibold"
              style={{ fontSize: 9, letterSpacing: "0.2em" }}
            >
              TERRA
            </text>
          </svg>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground font-mono">
          {hovered !== null
            ? `Secteur sélectionné : ${DISTRICTS[hovered].name}`
            : "Survolez un quadrant pour inspecter le secteur"}
        </p>
      </div>

      {/* Real-time Sector Telemetry Card */}
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <selectedOrHovered.icon className="size-4" />
            </span>
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
              {selectedOrHovered.pressure}
            </Badge>
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {selectedOrHovered.name}
          </h3>
          <p className="text-xs text-primary font-medium mt-0.5">
            {selectedOrHovered.tagline}
          </p>

          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Population estimée : <strong className="text-foreground">{selectedOrHovered.population}</strong>
          </p>

          <div className="mt-4 border-t border-border/60 pt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Infrastructures Clés :
            </p>
            {selectedOrHovered.services.map((svc, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 size-1 rounded-full bg-primary shrink-0" />
                <span>{svc}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="w-full text-xs gap-1.5"
              onClick={() => setActive(selectedOrHovered)}
            >
              Détails complets
            </Button>
            <Button size="sm" variant="outline" asChild className="text-xs">
              <Link href="/districts">
                Tous les dômes
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Dialog for detailed inspect */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
              {active?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {active?.tagline} • Pression {active?.pressure}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted/40 p-3 text-xs flex justify-between font-mono">
              <span className="text-muted-foreground">Population résidente :</span>
              <span className="font-semibold text-foreground">{active?.population}</span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Services & Missions assurés :
              </p>
              <ul className="flex flex-col gap-2 text-xs">
                {active?.services.map((service) => (
                  <li key={service} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-2.5">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button asChild className="w-full text-xs mt-2">
              <Link href="/districts">
                Consulter la carte complète de Nova Terra
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
