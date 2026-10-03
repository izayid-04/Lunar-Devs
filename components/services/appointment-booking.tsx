"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAppointmentSlots,
  bookAppointment,
  downloadAppointmentIcs,
  type Appointment,
  type AppointmentSlot,
  type Service,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { CalendarCheck, PartyPopper, Download, MapPin } from "lucide-react";
import { toast } from "sonner";

// Prise de rendez-vous municipal (F39, F40). Réservé aux citoyens connectés :
// l'API renvoie 403 pour les autres rôles sur POST /appointments/book/:slotId.
export default function AppointmentBooking({ service }: { service: Service }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<AppointmentSlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);

  const loadSlots = useCallback(() => {
    setSlots(null);
    setError(null);
    fetchAppointmentSlots(service.slug)
      .then((all) => setSlots(all.filter((s) => s.isAvailable)))
      .catch((err: Error) => setError(err.message));
  }, [service.slug]);

  useEffect(() => {
    if (open) Promise.resolve().then(() => loadSlots());
  }, [open, loadSlots]);

  function resetAndClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedSlotId(null);
      setReason("");
      setRequiredDocuments("");
      setConfirmation(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedSlotId) return;
    if (reason.trim().length < 3) {
      toast.error("Merci de préciser le motif de votre rendez-vous.");
      return;
    }

    setSubmitting(true);
    try {
      const appointment = await bookAppointment(token, selectedSlotId, {
        reason: reason.trim(),
        requiredDocuments: requiredDocuments.trim() || undefined,
      });
      setConfirmation(appointment);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de réserver ce rendez-vous.";
      toast.error(message);
      if (message.includes("réservé")) loadSlots();
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <Button asChild variant="outline" className="gap-2">
        <Link href="/connexion">
          <CalendarCheck className="size-4" />
          Se connecter pour prendre rendez-vous
        </Link>
      </Button>
    );
  }

  if (user.role !== "citizen") return null;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarCheck className="size-4" />
          Prendre rendez-vous
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {confirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PartyPopper className="size-5 text-success" />
                Rendez-vous confirmé
              </DialogTitle>
              <DialogDescription>
                {new Date(confirmation.startsAt).toLocaleString("fr-FR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
                {confirmation.location ? ` · ${confirmation.location}` : ""}
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadAppointmentIcs(token!, confirmation.id)}
            >
              <Download className="size-4" />
              Télécharger l&apos;invitation (.ics)
            </Button>
            <DialogFooter>
              <Button onClick={() => resetAndClose(false)} className="w-full">
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Prendre rendez-vous — {service.name}</DialogTitle>
              <DialogDescription>Choisissez un créneau disponible puis précisez le motif.</DialogDescription>
            </DialogHeader>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {!error && slots === null && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
            {!error && slots !== null && slots.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun créneau disponible pour ce service dans les prochains jours.
              </p>
            )}

            {slots && slots.length > 0 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedSlotId === slot.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {new Date(slot.startsAt).toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {slot.location && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {slot.location}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason">Motif (obligatoire)</Label>
                  <input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex : Renouvellement pièce d'identité"
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="requiredDocuments">
                    Documents à prévoir <span className="text-muted-foreground font-normal">(facultatif)</span>
                  </Label>
                  <input
                    id="requiredDocuments"
                    value={requiredDocuments}
                    onChange={(e) => setRequiredDocuments(e.target.value)}
                    placeholder="Ex : Pièce d'identité, justificatif de domicile"
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={!selectedSlotId || submitting}>
                    {submitting ? "Réservation…" : "Confirmer le rendez-vous"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
