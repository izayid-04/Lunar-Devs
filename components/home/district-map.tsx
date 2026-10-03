"use client";

import { useEffect, useState } from "react";
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
import { fetchServices, type Service } from "@/lib/api";
import { DISTRICTS } from "@/lib/alerts";
import {
  Compass,
  TrainFront,
  Trees,
  Shield,
  Zap,
  ArrowRight,
  Info,
} from "lucide-react";

const ICONS = [Compass, TrainFront, Trees, Shield, Zap];

type DistrictPanel = {
  name: string;
  icon: (typeof ICONS)[number];
  services: Service[];
};

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
  const a0 = index * step + 2;
  const a1 = a0 + step - 4;
  const o0 = polar(CX, CY, OUTER_R, a0);
  const o1 = polar(CX, CY, OUTER_R, a1);
  const i1 = polar(CX, CY, INNER_R, a1);
  const i0 = polar(CX, CY, INNER_R, a0);
  return `M ${o0.x} ${o0.y} A ${OUTER_R} ${OUTER_R} 0 0 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${INNER_R} ${INNER_R} 0 0 0 ${i0.x} ${i0.y} Z`;
}

export default function DistrictMap() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [active, setActive] = useState<DistrictPanel | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    fetchServices().then(setServices).catch(() => setServices([]));
  }, []);

  const districts: DistrictPanel[] = DISTRICTS.map((name, i) => ({
    name,
    icon: ICONS[i % ICONS.length],
    services: (services ?? []).filter((s) => s.district === name),
  }));

  const selectedOrHovered = hovered !== null ? districts[hovered] : districts[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Interactive Radial Radar Canvas */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="relative size-72 sm:size-84 flex items-center justify-center">
            {/* Subtle radar sweep line */}
            <div className="pointer-events-none absolute size-72 sm:size-84 rounded-full border border-dashed border-primary/20 animate-[spin_30s_linear_infinite]" />

            <svg
              viewBox="0 0 320 320"
              className="w-full h-full drop-shadow-[0_0_25px_rgba(224,93,56,0.15)]"
              role="group"
              aria-label="Carte interactive des quartiers de Nova Terra"
            >
              {districts.map((district, i) => {
                const isHovered = hovered === i;
                return (
                  <motion.path
                    key={district.name}
                    d={sectorPath(i, districts.length)}
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

          <p className="mt-4 text-center text-xs text-muted-foreground font-mono">
            {hovered !== null
              ? `Quartier ciblé : ${districts[hovered].name}`
              : "Survolez un quadrant pour inspecter le quartier"}
          </p>
        </div>

        {/* Sector panel — données réelles (GET /services) */}
        <div className="md:col-span-6 w-full">
          <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <selectedOrHovered.icon className="size-4" />
                </span>
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                  {services === null
                    ? "…"
                    : `${selectedOrHovered.services.length} service${selectedOrHovered.services.length === 1 ? "" : "s"}`}
                </Badge>
              </div>

              <h3 className="text-xl font-bold text-foreground tracking-tight">
                {selectedOrHovered.name}
              </h3>

              <div className="mt-4 border-t border-border/60 pt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Services municipaux :
                </p>
                {services === null && (
                  <p className="text-xs text-muted-foreground">Chargement…</p>
                )}
                {services !== null && selectedOrHovered.services.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucun service recensé dans ce quartier pour le moment.
                  </p>
                )}
                {selectedOrHovered.services.slice(0, 3).map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/services/${svc.slug}`}
                    className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    <span className="leading-snug underline">{svc.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5 pt-4 border-t border-border/60">
              <Button
                size="sm"
                variant="default"
                className="flex-1 text-xs gap-1.5 cursor-pointer"
                onClick={() => setActive(selectedOrHovered)}
              >
                <Info className="size-3.5" />
                Détails complets
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="flex-1 text-xs gap-1.5 cursor-pointer"
              >
                <Link href={`/districts?quartier=${encodeURIComponent(selectedOrHovered.name)}`}>
                  Tous les quartiers
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
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
              {active ? `${active.services.length} service${active.services.length === 1 ? "" : "s"} municipal${active.services.length === 1 ? "" : "aux"}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              {active?.services.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun service recensé dans ce quartier pour le moment.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 text-xs">
                  {active?.services.map((svc) => (
                    <li key={svc.id}>
                      <Link
                        href={`/services/${svc.slug}`}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-2.5 transition-colors hover:border-primary/40"
                      >
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        <span>{svc.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button asChild className="w-full text-xs mt-2">
              <Link href={`/districts?quartier=${encodeURIComponent(active?.name ?? "")}`}>
                Consulter la carte complète de Nova Terra
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
