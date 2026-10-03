// Libellés et styles partagés pour les alertes municipales (D18, F29).
// Toutes les couleurs passent par les variables du thème (aucune couleur en dur).
import type { Alert, AlertSeverity, AlertTarget } from "./api";

export const DISTRICTS = [
  "Centre-Ville",
  "Port Stellaire",
  "Quartier des Dunes",
  "Hauts de Nova",
  "Faubourg Est",
] as const;

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: "Information",
  important: "Important",
  urgent: "Urgent",
};

// Classes pour le bandeau (fond + bordure + texte).
export const SEVERITY_BANNER: Record<AlertSeverity, string> = {
  info: "border-accent-foreground/30 bg-accent text-accent-foreground",
  important: "border-primary/50 bg-primary/15 text-foreground",
  urgent: "border-destructive bg-destructive text-destructive-foreground",
};

// Classes pour un badge de gravité.
export const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  info: "border-accent-foreground/30 bg-accent text-accent-foreground",
  important: "border-primary/50 bg-primary/15 text-foreground",
  urgent: "border-transparent bg-destructive text-destructive-foreground",
};

export function targetLabel(alert: Pick<Alert, "target" | "targetDistrict">): string {
  const labels: Record<AlertTarget, string> = {
    all: "Tous les habitants",
    district: `Quartier : ${alert.targetDistrict ?? "—"}`,
    vulnerable: "Personnes vulnérables",
  };
  return labels[alert.target];
}

export function isAlertActive(alert: Pick<Alert, "startsAt" | "expiresAt">, now = Date.now()): boolean {
  return new Date(alert.startsAt).getTime() <= now && new Date(alert.expiresAt).getTime() > now;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

// Les liens de notification renvoyés par l'API pointent vers ses propres
// routes (/alerts/1, /announcements/2, /appointments/3) : on les traduit en
// pages existantes du front.
export function notificationHref(link: string): string {
  const [, kind, id] = link.split("/");
  if (kind === "alerts" && id) return `/alertes/${id}`;
  if (kind === "announcements" && id) return `/annonces/${id}`;
  return "/espace";
}
