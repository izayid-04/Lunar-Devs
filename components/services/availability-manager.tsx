"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { patchServiceAvailability, type Service, type ServiceAvailability } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

const OPTIONS: { value: ServiceAvailability; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "maintenance", label: "En maintenance" },
  { value: "incident", label: "Indisponible (incident)" },
];

export default function AvailabilityManager({ service }: { service: Service }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [availability, setAvailability] = useState<ServiceAvailability>(service.availability);
  const [message, setMessage] = useState(service.availabilityMessage ?? "");
  const [alternative, setAlternative] = useState(service.alternative ?? "");
  const [availableAgainAt, setAvailableAgainAt] = useState(
    service.availableAgainAt ? service.availableAgainAt.slice(0, 16) : ""
  );
  const [submitting, setSubmitting] = useState(false);

  if (!user || (user.role !== "agent" && user.role !== "admin")) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await patchServiceAvailability(token, service.slug, {
        availability,
        availabilityMessage: availability === "disponible" ? null : message || null,
        alternative: availability === "disponible" ? null : alternative || null,
        availableAgainAt:
          availability === "disponible" || !availableAgainAt
            ? null
            : new Date(availableAgainAt).toISOString(),
      });
      toast.success("Disponibilité mise à jour.");
      setOpen(false);
      // Rafraîchit la page serveur pour refléter la nouvelle disponibilité.
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de mettre à jour la disponibilité.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="size-3.5" />
          Modifier la disponibilité
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disponibilité du service</DialogTitle>
          <DialogDescription>Visible immédiatement par les habitants.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="availability">Statut</Label>
            <select
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value as ServiceAvailability)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {availability !== "disponible" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message pour les habitants</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex : Panne technique temporaire"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alternative">Alternative proposée</Label>
                <Input
                  id="alternative"
                  value={alternative}
                  onChange={(e) => setAlternative(e.target.value)}
                  placeholder="Ex : Contacter le standard téléphonique"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="availableAgainAt">Retour prévu (optionnel)</Label>
                <Input
                  id="availableAgainAt"
                  type="datetime-local"
                  value={availableAgainAt}
                  onChange={(e) => setAvailableAgainAt(e.target.value)}
                />
              </div>
            </>
          )}
          <DialogFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
