"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type District = {
  name: string;
  services: string[];
};

const DISTRICTS: District[] = [
  {
    name: "Port Spatial",
    services: ["Transports en commun", "Mobilité urbaine", "Navettes inter-quartiers"],
  },
  {
    name: "Centre Administratif",
    services: ["Mairie en ligne", "État civil", "Démarches citoyennes"],
  },
  {
    name: "Parc Écologique",
    services: ["Espaces verts", "Environnement", "Recyclage"],
  },
  {
    name: "District Culturel",
    services: ["Événements", "Bibliothèques", "Musées"],
  },
  {
    name: "Zone Industrielle",
    services: ["Économie locale", "Emploi", "Entreprises"],
  },
  {
    name: "Secteur Résidentiel",
    services: ["Logement", "État civil", "Vie de quartier"],
  },
];

const CX = 150;
const CY = 150;
const OUTER_R = 128;
const INNER_R = 52;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(index: number, count: number) {
  const step = 360 / count;
  const a0 = index * step;
  const a1 = a0 + step;
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

  return (
    <div className="mx-auto max-w-xs sm:max-w-sm">
      <svg
        viewBox="0 0 300 300"
        className="w-full"
        role="group"
        aria-label="Carte des quartiers de Nova Terra"
      >
        {DISTRICTS.map((district, i) => (
          <motion.path
            key={district.name}
            d={sectorPath(i, DISTRICTS.length)}
            fill={hovered === i ? "var(--primary)" : "var(--card)"}
            stroke="var(--background)"
            strokeWidth={2}
            role="button"
            tabIndex={0}
            aria-label={`${district.name} — voir les services`}
            className="cursor-pointer outline-none focus-visible:stroke-ring"
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
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            whileInView={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileFocus={reduceMotion ? undefined : { scale: 1.03 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
            style={{
              transition: "fill 0.15s ease",
              transformOrigin: "150px 150px",
            }}
          />
        ))}
        <circle cx={CX} cy={CY} r={INNER_R - 6} fill="var(--card)" />
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          className="fill-foreground font-heading"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          NOVA
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 10, letterSpacing: "0.1em" }}
        >
          TERRA
        </text>
      </svg>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {hovered !== null
          ? DISTRICTS[hovered].name
          : "Survolez ou touchez un quartier"}
      </p>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {active?.name}
            </DialogTitle>
            <DialogDescription>
              Services illustratifs de ce quartier (aperçu).
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 text-sm">
            {active?.services.map((service) => (
              <li key={service} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                {service}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
