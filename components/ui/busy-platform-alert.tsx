"use client";

import React from "react";
import { AlertCircle, RefreshCw, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/lib/accessibility-context";

interface BusyPlatformAlertProps {
  onRetry?: () => void;
  className?: string;
  error?: string | null;
}

export function isPlatformBusyError(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const lower = msg.toLowerCase();
  return (
    lower.includes("503") ||
    lower.includes("sollicitée") ||
    lower.includes("timeout") ||
    lower.includes("délai dépassé") ||
    lower.includes("temps d'attente") ||
    lower.includes("trop de requêtes") ||
    lower.includes("database unavailable")
  );
}

export function BusyPlatformAlert({ onRetry, className = "", error }: BusyPlatformAlertProps) {
  const { lightMode, setLightMode } = useAccessibility();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-foreground shadow-sm space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-destructive">
            La plateforme est très sollicitée, réessayez dans un instant.
          </p>
          <p className="text-xs text-muted-foreground">
            {error || "Les serveurs municipaux traitent actuellement un volume exceptionnel de connexions ou de requêtes."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {onRetry && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="size-3.5" />
            Réessayer
          </Button>
        )}

        {!lightMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLightMode(true)}
            className="gap-2 text-primary border-primary/40 hover:bg-primary/10"
          >
            <Feather className="size-3.5" />
            Activer le mode léger
          </Button>
        )}
      </div>
    </div>
  );
}
