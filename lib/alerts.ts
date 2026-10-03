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

// Types réels de notifications renvoyés par l'API (notification-type.enum.ts
// côté backend) — libellés lisibles, utilisés par la cloche et par la page
// "Toutes les notifications".
export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  alert: "Alerte",
  announcement: "Annonce",
  appointment_reminder: "Rendez-vous",
  demande_statut: "Ma demande",
  security: "Sécurité du compte",
};

export function notificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABEL[type] ?? "Notification";
}

// Les liens de notification renvoyés par l'API pointent vers ses propres
// routes (/alerts/1, /announcements/2, /messages/mine/3, /appointments/4,
// /privacy/inquiries/5) : on les traduit en pages existantes du front (F49).
export function notificationHref(link: string): string {
  const parts = link.split("/").filter(Boolean);
  const [first, second, third] = parts;
  if (first === "alerts" && second) return `/alertes/${second}`;
  if (first === "announcements" && second) return `/annonces/${second}`;
  if (first === "messages" && second === "mine" && third) return `/espace/demandes/${third}`;
  // Rendez-vous et demandes RGPD n'ont pas de fiche dédiée : ils sont
  // listés dans l'espace personnel.
  return "/espace";
}
