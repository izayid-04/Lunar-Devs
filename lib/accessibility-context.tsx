"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type TextSize = "normal" | "large" | "xlarge";

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  toggleReducedMotion: () => void;
  lightMode: boolean;
  setLightMode: (enabled: boolean) => void;
  toggleLightMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TEXT_SIZE: "novaterra.a11y.text-size",
  HIGH_CONTRAST: "novaterra.a11y.high-contrast",
  REDUCED_MOTION: "novaterra.a11y.reduced-motion",
  LIGHT_MODE: "novaterra.a11y.light-mode",
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Initialisation paresseuse synchrone (lazy initializer) pour éviter setState dans un useEffect
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window === "undefined") return "normal";
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE) as TextSize | null;
      if (saved && ["normal", "large", "xlarge"].includes(saved)) return saved;
    } catch {}
    return "normal";
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST);
      if (saved !== null) return saved === "true";
    } catch {}
    return false;
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION);
      if (saved !== null) return saved === "true";
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    return false;
  });

  // F59 + F62 : Mode léger (sobriété numérique, connexion lente ou save-data)
  const [lightMode, setLightModeState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIGHT_MODE);
      if (saved !== null) return saved === "true";
      // Détection automatique : connexion lente (2g, slow-2g) ou saveData activé
      const nav = navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } };
      if (nav.connection) {
        if (nav.connection.saveData === true) return true;
        if (nav.connection.effectiveType === "2g" || nav.connection.effectiveType === "slow-2g") return true;
      }
    } catch {}
    return false;
  });

  // Appliquer les classes sur le tag <html> et synchroniser avec localStorage
  useEffect(() => {
    const root = document.documentElement;

    // A. Taille du texte
    root.classList.remove("text-size-normal", "text-size-large", "text-size-xlarge");
    root.classList.add(`text-size-${textSize}`);
    try {
      localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, textSize);
    } catch {}

    // B. Contraste élevé
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(highContrast));
    } catch {}

    // C. Mouvement réduit
    if (reducedMotion) {
      root.classList.add("force-reduced-motion");
    } else {
      root.classList.remove("force-reduced-motion");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, String(reducedMotion));
    } catch {}

    // D. Mode léger (F59 + F62)
    if (lightMode) {
      root.classList.add("light-eco-mode");
    } else {
      root.classList.remove("light-eco-mode");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.LIGHT_MODE, String(lightMode));
    } catch {}
  }, [textSize, highContrast, reducedMotion, lightMode]);

  const setTextSize = (size: TextSize) => setTextSizeState(size);
  const setHighContrast = (enabled: boolean) => setHighContrastState(enabled);
  const toggleHighContrast = () => setHighContrastState((prev) => !prev);
  const setReducedMotion = (enabled: boolean) => setReducedMotionState(enabled);
  const toggleReducedMotion = () => setReducedMotionState((prev) => !prev);
  const setLightMode = (enabled: boolean) => setLightModeState(enabled);
  const toggleLightMode = () => setLightModeState((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        reducedMotion,
        setReducedMotion,
        toggleReducedMotion,
        lightMode,
        setLightMode,
        toggleLightMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility doit être utilisé au sein d'un AccessibilityProvider.");
  }
  return context;
}
