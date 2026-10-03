"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: unknown;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export default function LanguageSwitcher() {
  const { user } = useAuth();
  const [currentLang, setCurrentLang] = useState<"fr" | "en">(() => {
    if (typeof window === "undefined") return "fr";
    try {
      const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
      if (match && match[1]) {
        const val = decodeURIComponent(match[1]);
        if (val.endsWith("/en")) return "en";
      }
    } catch {}
    return "fr";
  });

  useEffect(() => {
    if (user?.preferredLanguage === "en" && currentLang !== "en") {
      Promise.resolve().then(() => setCurrentLang("en"));
    }
  }, [user?.preferredLanguage, currentLang]);

  // Initialisation du widget Google Translate en mode headless (caché)
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "fr",
            includedLanguages: "fr,en",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };
  }, []);

  const changeLanguage = (lang: "fr" | "en") => {
    setCurrentLang(lang);
    if (typeof window === "undefined") return;

    if (lang === "fr") {
      // Revenir au français (langue originale)
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=/fr/fr; path=/; domain=${window.location.hostname};`;
      document.cookie = "googtrans=/fr/fr; path=/;";
    } else {
      // Passer en anglais
      document.cookie = `googtrans=/fr/en; path=/; domain=${window.location.hostname};`;
      document.cookie = "googtrans=/fr/en; path=/;";
    }

    // Recharger doucement pour que Google Translate applique la traduction à l'ensemble du DOM
    window.location.reload();
  };


  return (
    <>
      {/* Conteneur caché requis par le script Google Translate */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />

      {/* Bouton de bascule de langue accessible dans la barre d'outils */}
      <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5 text-xs shadow-xs">
        <Button
          type="button"
          size="sm"
          variant={currentLang === "fr" ? "default" : "ghost"}
          onClick={() => changeLanguage("fr")}
          className={cn(
            "h-7 px-2.5 rounded-full text-xs font-semibold gap-1.5 transition-all",
            currentLang === "fr"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Afficher le site en Français"
          aria-label="Passer le site en Français"
        >
          <span className="text-sm leading-none" aria-hidden="true">🇫🇷</span>
          <span>FR</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant={currentLang === "en" ? "default" : "ghost"}
          onClick={() => changeLanguage("en")}
          className={cn(
            "h-7 px-2.5 rounded-full text-xs font-semibold gap-1.5 transition-all",
            currentLang === "en"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Translate website to English"
          aria-label="Translate website to English"
        >
          <span className="text-sm leading-none" aria-hidden="true">🇬🇧</span>
          <span>EN</span>
        </Button>
      </div>
    </>
  );
}
