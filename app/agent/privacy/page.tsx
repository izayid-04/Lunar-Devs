"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentPrivacyInquiries,
  patchAgentPrivacyInquiryStatus,
  type PrivacyInquiry,
  type PrivacyInquiryStatus,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  RefreshCw,
  User,
  ArrowLeft,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  PrivacyInquiryStatus,
  { label: string; badge: string; icon: typeof Clock }
> = {
  en_attente: {
    label: "En attente",
    badge: "border-primary/40 text-primary bg-primary/10",
    icon: Clock,
  },
  en_cours: {
    label: "En instruction",
    badge: "border-amber-500/40 text-amber-500 bg-amber-500/10",
    icon: RotateCw,
  },
  traitee: {
    label: "Traitée & Répondue",
    badge: "border-success/40 text-success bg-success/10",
    icon: CheckCircle2,
  },
  fermee: {
    label: "Classée sans suite",
    badge: "border-border text-muted-foreground bg-muted",
    icon: AlertTriangle,
  },
};

const TYPE_LABELS: Record<string, string> = {
  explication: "Inquiétude / Explication",
  acces: "Accès aux données",
  rectification: "Rectification",
  effacement: "Effacement",
  opposition: "Opposition",
  autre: "Autre démarche",
};

export default function AgentPrivacyPage() {
  const { user, token } = useAuth();

  const [inquiries, setInquiries] = useState<PrivacyInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre statut
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Traitement modal
  const [activeInquiry, setActiveInquiry] = useState<PrivacyInquiry | null>(null);
  const [targetStatus, setTargetStatus] = useState<PrivacyInquiryStatus>("traitee");
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadInquiries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const statusParam =
        selectedStatus === "all" ? undefined : (selectedStatus as PrivacyInquiryStatus);
      const data = await fetchAgentPrivacyInquiries(token, statusParam);
      setInquiries(data);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de charger les demandes RGPD.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, selectedStatus]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadInquiries();
    });
  }, [loadInquiries]);

  const openProcessDialog = (inquiry: PrivacyInquiry) => {
    setActiveInquiry(inquiry);
    setTargetStatus(inquiry.status === "en_attente" ? "en_cours" : "traitee");
    setResponseNote(inquiry.responseNote || "");
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeInquiry) return;

    if (!responseNote.trim() && (targetStatus === "traitee" || targetStatus === "fermee")) {
      toast.error("Veuillez rédiger une note d'explication officielle pour le citoyen.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await patchAgentPrivacyInquiryStatus(token, activeInquiry.id, {
        status: targetStatus,
        responseNote: responseNote.trim(),
      });
      toast.success(`Demande ${updated.reference} mise à jour avec succès.`);
      setInquiries((prev) =>
        prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
      );
      setActiveInquiry(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour de la demande."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/agent">
              <ArrowLeft className="size-4" />
              Retour à l&apos;espace agent
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 text-xs">
              <ShieldCheck className="size-3" />
              Pôle Délégué à la Protection des Données (DPO)
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Gestion des demandes & inquiétudes RGPD
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Instruire les sollicitations citoyennes relatives aux données personnelles et formuler les réponses officielles.
          </p>
        </div>

        <Button
          onClick={loadInquiries}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Actualiser les demandes RGPD"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Barre de filtres */}
      <Card className="mt-6">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Statut :</span>
            <div className="w-[200px]">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger aria-label="Filtrer les demandes par statut">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les demandes</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_cours">En instruction</SelectItem>
                  <SelectItem value="traitee">Traitées</SelectItem>
                  <SelectItem value="fermee">Classées sans suite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <span className="text-xs text-muted-foreground font-mono">
            {inquiries.length} demande{inquiries.length > 1 ? "s" : ""} répertoriée{inquiries.length > 1 ? "s" : ""}
          </span>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <div className="mt-6 space-y-4">
        {loading && (
          <div className="flex justify-center py-16" role="status">
            <LoadingSpinner />
            <span className="sr-only">Chargement des demandes RGPD…</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && inquiries.length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Aucune demande de données personnelles ne correspond à ce filtre.
          </Card>
        )}

        {!loading && !error && inquiries.map((inquiry) => {
          const statusInfo = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.en_attente;
          const StatusIcon = statusInfo.icon;
          const typeLabel = TYPE_LABELS[inquiry.type] || inquiry.type;

          return (
            <Card key={inquiry.id} className="overflow-hidden border-border/80 hover:border-primary/40 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">
                        {inquiry.reference}
                      </span>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {typeLabel}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {inquiry.subject}
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", statusInfo.badge)}>
                      <StatusIcon className="size-3" />
                      <span>{statusInfo.label}</span>
                    </Badge>

                    <Button
                      size="sm"
                      onClick={() => openProcessDialog(inquiry)}
                      className="h-8 text-xs gap-1.5"
                    >
                      Traiter la demande
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-2 space-y-4">
                <p className="text-sm text-foreground bg-muted/40 p-3 rounded-lg border border-border/60">
                  {inquiry.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground border-t border-border/60 pt-3">
                  <div className="flex items-center gap-4">
                    {inquiry.citizen ? (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="size-3 text-muted-foreground" />
                        {inquiry.citizen.firstName} {inquiry.citizen.lastName} ({inquiry.citizen.email})
                      </span>
                    ) : (
                      <span className="italic">Demandeur anonymisé</span>
                    )}

                    <span>
                      Déposée le {new Date(inquiry.createdAt).toLocaleDateString("fr-FR")} à {new Date(inquiry.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {inquiry.responseNote && (
                    <div className="w-full bg-success/5 border border-success/30 rounded-lg p-3 text-xs">
                      <span className="font-semibold text-success block mb-1">Réponse officielle transmise au citoyen :</span>
                      <p className="text-foreground">{inquiry.responseNote}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de traitement pour agent */}
      <Dialog open={!!activeInquiry} onOpenChange={(open) => !open && setActiveInquiry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Instruction de la demande {activeInquiry?.reference}</DialogTitle>
            <DialogDescription>
              Objet : <span className="font-semibold text-foreground">{activeInquiry?.subject}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProcessSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="target-status">Statut du dossier</Label>
              <Select
                value={targetStatus}
                onValueChange={(val) => setTargetStatus(val as PrivacyInquiryStatus)}
              >
                <SelectTrigger id="target-status" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_cours">En instruction (dossier ouvert)</SelectItem>
                  <SelectItem value="traitee">Traité (réponse complète apportée)</SelectItem>
                  <SelectItem value="fermee">Classer sans suite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="response-note">Note d&apos;explication / Réponse transmise au citoyen</Label>
              <textarea
                id="response-note"
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="Rédigez la réponse officielle ou les détails de la prise en charge..."
                rows={4}
                required={targetStatus === "traitee" || targetStatus === "fermee"}
                className="w-full mt-1.5 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveInquiry(null)} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement…" : "Valider le traitement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
