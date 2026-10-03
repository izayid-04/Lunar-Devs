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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Settings2, Power, RefreshCw } from "lucide-react";
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

  async function handleQuickToggle() {
    if (!token) return;
    if (service.availability === "disponible") {
      // Ouvre la modale pré-configurée en maintenance pour renseigner le motif
      setAvailability("maintenance");
      setOpen(true);
      return;
    }
    // Si déjà hors service, remise en service directe
    setSubmitting(true);
    try {
      await patchServiceAvailability(token, service.slug, {
        availability: "disponible",
        availabilityMessage: null,
        alternative: null,
        availableAgainAt: null,
      });
      toast.success("Service remis en service avec succès.");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la remise en service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {service.availability === "disponible" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickToggle}
          disabled={submitting}
          className="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
        >
          <Power className="size-3.5" />
          Mettre hors service
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickToggle}
          disabled={submitting}
          className="gap-1.5 border-success/40 text-success hover:bg-success/10 hover:text-success"
        >
          <RefreshCw className="size-3.5" />
          Remettre en service
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="size-3.5" />
            Paramètres détaillés
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disponibilité du service</DialogTitle>
            <DialogDescription>Visible immédiatement par les habitants de Nova Terra.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="availability">Statut</Label>
              <Select
                value={availability}
                onValueChange={(val) => setAvailability(val as ServiceAvailability)}
              >
                <SelectTrigger id="availability" className="w-full">
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <DateTimePicker
                    id="availableAgainAt"
                    value={availableAgainAt}
                    onChange={setAvailableAgainAt}
                    placeholder="Choisir date et heure de retour"
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
    </div>
  );
}
