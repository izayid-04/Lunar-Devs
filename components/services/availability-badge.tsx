import { CheckCircle2, Wrench, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@/lib/api";

const CONFIG = {
  disponible: {
    label: "Disponible",
    icon: CheckCircle2,
    className: "border-success/40 text-success bg-success/10",
  },
  maintenance: {
    label: "En maintenance",
    icon: Wrench,
    className: "border-border text-muted-foreground bg-muted",
  },
  incident: {
    label: "Indisponible",
    icon: AlertTriangle,
    className: "border-destructive/40 text-destructive bg-destructive/10",
  },
} as const;

export function AvailabilityBadge({ availability }: { availability: Service["availability"] }) {
  const { label, icon: Icon, className } = CONFIG[availability];
  return (
    <Badge variant="outline" className={`gap-1.5 ${className}`}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

// Détail complet affiché quand le service n'est pas disponible : message,
// date de retour, et alternative à proposer à l'habitant (F38).
export function AvailabilityDetails({ service }: { service: Service }) {
  if (service.availability === "disponible") return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="font-medium">
            {service.availabilityMessage ?? "Ce service est temporairement indisponible."}
          </p>
          {service.availableAgainAt && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              Retour prévu le{" "}
              {new Date(service.availableAgainAt).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          )}
          {service.alternative && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowRight className="size-3.5" aria-hidden="true" />
              {service.alternative}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
