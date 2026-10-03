"use client";

import React, { useState } from "react";
import { useAccessibility, TextSize } from "@/lib/accessibility-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Type,
  SunMoon,
  ZapOff,
  Check,
  RotateCcw,
} from "lucide-react";

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const {
    textSize,
    setTextSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
  } = useAccessibility();

  const resetAll = () => {
    setTextSize("normal");
    if (highContrast) toggleHighContrast();
    if (reducedMotion) toggleReducedMotion();
  };

  const isCustomized = textSize !== "normal" || highContrast || reducedMotion;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ouvrir les options d'accessibilité (taille du texte, contraste, animations)"
          className="relative rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          title="Accessibilité & Ergonomie"
        >
          <Eye className="size-[18px]" aria-hidden="true" />
          {isCustomized && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" aria-label="Options d'accessibilité actives" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Eye className="size-4" aria-hidden="true" />
            </span>
            Options d&apos;Accessibilité
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Personnalisez l&apos;affichage selon vos besoins visuels et de confort. Vos préférences sont conservées pour vos prochaines visites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2" role="region" aria-label="Paramètres d'accessibilité">
          {/* 1. Taille du texte (3 niveaux) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label id="text-size-label" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Type className="size-3.5" aria-hidden="true" />
                Taille du texte
              </label>
              <span className="text-[11px] font-mono text-primary font-medium">
                {textSize === "normal" && "Normal (100%)"}
                {textSize === "large" && "Grand (115%)"}
                {textSize === "xlarge" && "Très grand (125%)"}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-labelledby="text-size-label"
              className="grid grid-cols-3 gap-2"
            >
              {[
                { key: "normal" as TextSize, label: "Normal", sizeDesc: "A" },
                { key: "large" as TextSize, label: "Grand", sizeDesc: "A+" },
                { key: "xlarge" as TextSize, label: "Très Grand", sizeDesc: "A++" },
              ].map((opt) => {
                const isSelected = textSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTextSize(opt.key)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/30"
                        : "border-border bg-muted/40 hover:bg-muted hover:border-foreground/20 text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm font-extrabold">{opt.sizeDesc}</span>
                    <span className="text-[11px] font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Contraste Élevé (F23) */}
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <SunMoon className="size-3.5 text-primary" aria-hidden="true" />
                  Mode Contraste Élevé
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Renforce le contraste des textes et épaissit les bordures pour une lisibilité maximale (norme WCAG AAA).
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={highContrast}
                aria-label="Activer ou désactiver le mode contraste élevé"
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  highContrast
                    ? "border-primary bg-primary"
                    : "border-border bg-input hover:bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    highContrast ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. Réduction des Animations (prefers-reduced-motion) */}
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ZapOff className="size-3.5 text-primary" aria-hidden="true" />
                  Réduire les animations
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Désactive les mouvements, transitions et effets 3D continus pour limiter la fatigue visuelle.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={reducedMotion}
                aria-label="Activer ou désactiver la réduction des animations"
                onClick={toggleReducedMotion}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  reducedMotion
                    ? "border-primary bg-primary"
                    : "border-border bg-input hover:bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    reducedMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAll}
              disabled={!isCustomized}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Rétablir par défaut
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs gap-1 h-8 px-4"
            >
              <Check className="size-3.5" aria-hidden="true" />
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
