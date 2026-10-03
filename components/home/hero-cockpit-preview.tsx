"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Wind,
  ShieldCheck,
  Radio,
  TrainFront,
  Sparkles,
  RefreshCw,
  Orbit,
  Cpu
} from "lucide-react";

export default function HeroCockpitPreview() {
  const [pulse, setPulse] = useState(false);
  const [speed, setSpeed] = useState("420 km/h");
  const [activeDome, setActiveDome] = useState("Alpha");

  const handleSimulate = () => {
    setPulse(true);
    setSpeed("580 km/h");
    setTimeout(() => {
      setPulse(false);
      setSpeed("420 km/h");
    }, 1500);
  };

  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl px-2">
      {/* Glow atmosphérique d'arrière-plan */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-96 sm:size-[500px] rounded-full bg-primary/15 blur-[100px]" />

      {/* Flottant Gauche : Statut Navette Maglev */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden md:flex absolute -left-4 top-12 z-20 items-center gap-3 rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-xl backdrop-blur-md"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrainFront className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Maglev Express M-1</span>
            <Badge className="bg-success text-success-foreground text-[9px] px-1.5 py-0">En transit</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Dôme Alpha ➔ Port Spatial • <strong className="text-foreground">{speed}</strong>
          </p>
        </div>
      </motion.div>

      {/* Flottant Droite : Biosphère & Pression */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="hidden md:flex absolute -right-4 bottom-16 z-20 items-center gap-3 rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-xl backdrop-blur-md"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Bouclier Magnétique</span>
            <span className="size-2 rounded-full bg-success animate-ping" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            1013 hPa • Transmittance 98.4% • 0 brèche
          </p>
        </div>
      </motion.div>

      {/* Console 3D Inclinée Isométrique */}
      <div className="perspective-1000">
        <motion.div
          initial={{ opacity: 0, rotateX: 25, y: 40 }}
          animate={{ opacity: 1, rotateX: 10, y: 0 }}
          whileHover={{ rotateX: 0, y: -8 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative rounded-2xl border border-border/90 bg-gradient-to-b from-card/95 via-card/80 to-background/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl"
        >
          {/* Header de la console cockpit */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/60 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-destructive/60" />
                <span className="size-3 rounded-full bg-primary/60" />
                <span className="size-3 rounded-full bg-success/60" />
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <Orbit className="size-4 text-primary" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-foreground">
                  CONSOLE ORBITALE SOL-04
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[10px] gap-1">
                <Sparkles className="size-3" />
                SYS NOMINAL
              </Badge>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={pulse}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors hover:border-primary/50"
              >
                <RefreshCw className={`size-3 text-primary ${pulse ? "animate-spin" : ""}`} />
                Test de charge
              </button>
            </div>
          </div>

          {/* Grille interne du cockpit */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Colonne 1 : Jauge Atmosphère */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Wind className="size-3.5 text-primary" /> Atmosphère O₂
                </span>
                <span className="font-mono text-success font-semibold">99.8%</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">1 013</span>
                <span className="text-xs text-muted-foreground font-mono">hPa</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: pulse ? "100%" : "88%" }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Régénération Dôme Alpha</span>
                <span className="text-success font-medium">+0.4% / cycle</span>
              </p>
            </div>

            {/* Colonne 2 : Réseau Tokamak & Fusion */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="size-3.5 text-primary" /> Grille Énergie Fusion
                </span>
                <span className="font-mono text-primary font-semibold">4.28 GW</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">94.2%</span>
                <span className="text-xs text-muted-foreground font-mono">Rendement</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  className="h-full bg-primary/80 rounded-full"
                  animate={{ width: pulse ? "98%" : "82%" }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Secteur Solaria Tokamak-3</span>
                <span className="text-foreground font-medium">Stable</span>
              </p>
            </div>

            {/* Colonne 3 : Sas & Transmissions en direct */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Radio className="size-3.5 text-primary" /> Flux Municipal
                </span>
                <Badge variant="secondary" className="text-[9px] px-1">Direct</Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono">48 920</span>
                <span className="text-xs text-muted-foreground font-mono">résidents</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <div className="h-full bg-success/80 rounded-full w-[92%]" />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Sas de transit ouverts</span>
                <span className="text-success font-medium">100% Nominal</span>
              </p>
            </div>
          </div>

          {/* Dômes interactifs en direct dans le cockpit */}
          <div className="mt-4 rounded-xl border border-dashed border-border/70 p-3.5 bg-muted/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Secteurs Dômes Connectés :</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["Alpha (Capitale)", "Beta (Bio-Agri)", "Gamma (Port)"].map((dome) => {
                const isSelected = activeDome === dome.split(" ")[0];
                return (
                  <button
                    key={dome}
                    type="button"
                    onClick={() => setActiveDome(dome.split(" ")[0])}
                    className={`rounded-lg px-2.5 py-1 text-xs transition-all font-mono ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Dôme {dome}
                  </button>
                );
              }))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
