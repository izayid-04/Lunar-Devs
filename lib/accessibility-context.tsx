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
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TEXT_SIZE: "novaterra.a11y.text-size",
  HIGH_CONTRAST: "novaterra.a11y.high-contrast",
  REDUCED_MOTION: "novaterra.a11y.reduced-motion",
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
  }, [textSize, highContrast, reducedMotion]);

  const setTextSize = (size: TextSize) => setTextSizeState(size);
  const setHighContrast = (enabled: boolean) => setHighContrastState(enabled);
  const toggleHighContrast = () => setHighContrastState((prev) => !prev);
  const setReducedMotion = (enabled: boolean) => setReducedMotionState(enabled);
  const toggleReducedMotion = () => setReducedMotionState((prev) => !prev);

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
