"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "@/components/dashboard-layout";
import {
  fetchAlerts,
  createAlert,
  patchAlert,
  terminateAlert,
  deleteAlert,
  generateAiAlertRecommendations,
  type Alert,
  type AlertSeverity,
  type AlertTarget,
  type CreateAlertPayload,
} from "@/lib/api";
import {
  DISTRICTS,
  SEVERITY_BADGE,
  SEVERITY_LABEL,
  formatDateTime,
  isAlertActive,
  targetLabel,
} from "@/lib/alerts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Pencil,
  Plus,
  ShieldAlert,
  Sparkles,
  StopCircle,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";

type AlertDraft = {
  title: string;
  body: string;
  instructions: string;
  severity: AlertSeverity;
  target: AlertTarget;
  targetDistrict: string;
  startsAt: string;
  expiresAt: string;
};

function defaultDraft(): AlertDraft {
  const now = new Date();
  const later = new Date(Date.now() + 24 * 3600 * 1000);
  return {
    title: "",
    body: "",
    instructions: "",
    severity: "important",
    target: "all",
    targetDistrict: DISTRICTS[0],
    startsAt: now.toISOString().slice(0, 16),
    expiresAt: later.toISOString().slice(0, 16),
  };
}

function AgentAlertesContent() {
  const { user, token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [draft, setDraft] = useState<AlertDraft>(defaultDraft);
  const [submitting, setSubmitting] = useState(false);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [alertToTerminate, setAlertToTerminate] = useState<Alert | null>(null);

  // Assistant IA pour recommandations (F31)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des alertes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadAlerts());
  }, [loadAlerts]);

  if (!user) return null;

  function openCreate() {
    setEditingAlert(null);
    setDraft(defaultDraft());
    setAiError(null);
    setDialogOpen(true);
  }

  function openEdit(a: Alert) {
    setEditingAlert(a);
    setDraft({
      title: a.title,
      body: a.body,
      instructions: a.instructions || "",
      severity: a.severity,
      target: a.target,
      targetDistrict: a.targetDistrict || DISTRICTS[0],
      startsAt: new Date(a.startsAt).toISOString().slice(0, 16),
      expiresAt: new Date(a.expiresAt).toISOString().slice(0, 16),
    });
    setAiError(null);
    setDialogOpen(true);
  }

  async function handleGenerateAi() {
    if (!token) return;
    if (!draft.title.trim() && !draft.body.trim()) {
      setAiError(
        "Renseignez au moins un titre ou une description de la situation pour aider l'IA."
      );
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const situation = `${draft.title ? draft.title + " : " : ""}${draft.body || "Alerte municipale générale"}`;
      const res = await generateAiAlertRecommendations(token, {
        situation,
        district: draft.target === "district" ? draft.targetDistrict : undefined,
        targetAudience:
          draft.target === "vulnerable"
            ? "Personnes vulnérables, âgées et enfants"
            : undefined,
      });

      if (res.suggestedInstructions) {
        setDraft((prev) => ({
          ...prev,
          instructions: res.suggestedInstructions,
        }));
        toast.success(
          "Recommandations IA générées avec succès. Vous pouvez les relire et les ajuster."
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Échec de communication avec le service IA.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (draft.title.trim().length < 3) {
      toast.error("Le titre doit contenir au moins 3 caractères.");
      return;
    }
    if (draft.body.trim().length < 5) {
      toast.error("La description doit contenir au moins 5 caractères.");
      return;
    }

    const payload: CreateAlertPayload = {
      title: draft.title.trim(),
      body: draft.body.trim(),
      instructions: draft.instructions.trim(),
      severity: draft.severity,
      target: draft.target,
      targetDistrict: draft.target === "district" ? draft.targetDistrict : null,
      startsAt: new Date(draft.startsAt).toISOString(),
      expiresAt: new Date(draft.expiresAt).toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingAlert) {
        await patchAlert(token, editingAlert.id, payload);
        toast.success("Alerte mise à jour.");
      } else {
        await createAlert(token, payload);
        toast.success("Alerte créée et diffusée aux citoyens concernés.");
      }
      setDialogOpen(false);
      loadAlerts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible d'enregistrer l'alerte."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmTerminate() {
    if (!token || !alertToTerminate || terminatingId) return;
    const a = alertToTerminate;
    setTerminatingId(a.id);
    try {
      await terminateAlert(token, a.id);
      toast.success("Alerte clôturée avec succès.");
      setAlertToTerminate(null);
      loadAlerts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de clore l'alerte."
      );
    } finally {
      setTerminatingId(null);
    }
  }

  async function confirmDelete() {
    if (!token || !alertToDelete || deletingId || user?.role !== "admin") return;
    const a = alertToDelete;
    setDeletingId(a.id);
    try {
      await deleteAlert(token, a.id);
      toast.success("Alerte définitivement supprimée (Privilège Admin).");
      setAlertToDelete(null);
      loadAlerts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de supprimer l'alerte."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/agent">
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          </Button>
          <h1>Alertes municipales</h1>
          <p className="text-sm text-muted-foreground">
            Créer, piloter ou clôturer des alertes d&apos;urgence pour les habitants.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Déclencher une alerte
        </Button>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              Registre des alertes
            </CardTitle>
            <CardDescription>
              Toutes les alertes enregistrées sur Nova Terra, avec leur statut et cible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!loading && !error && alerts?.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune alerte enregistrée pour le moment.
              </p>
            )}

            <div className="space-y-3">
              {alerts?.map((a) => {
                const active = isAlertActive(a);

                return (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                            SEVERITY_BADGE[a.severity]
                          }`}
                        >
                          {SEVERITY_LABEL[a.severity]}
                        </span>
                        <Badge
                          variant={active ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {active ? "En cours" : "Clôturée"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {targetLabel(a)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(a.startsAt)}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-sm text-foreground">
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {a.body}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(a)}
                        className="gap-1 text-xs"
                        aria-label={`Modifier l'alerte ${a.title}`}
                      >
                        <Pencil className="size-3.5" />
                        Modifier
                      </Button>

                      {active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAlertToTerminate(a)}
                          disabled={terminatingId === a.id}
                          className="gap-1 text-xs text-destructive hover:bg-destructive/10"
                          aria-label={`Clôturer l'alerte ${a.title}`}
                        >
                          {terminatingId === a.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <StopCircle className="size-3.5" />
                          )}
                          Clôturer
                        </Button>
                      )}

                      {user?.role === "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAlertToDelete(a)}
                          disabled={deletingId === a.id}
                          className="gap-1 text-xs text-destructive hover:bg-destructive/10"
                          aria-label={`Supprimer définitivement l'alerte ${a.title}`}
                          title="Supprimer (Privilège Admin)"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Création / Modification d'une alerte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingAlert ? "Modifier l'alerte" : "Déclencher une nouvelle alerte"}
            </DialogTitle>
            <DialogDescription>
              {editingAlert
                ? "Mettre à jour les informations ou les consignes de l'alerte."
                : "La publication générera immédiatement une notification ciblée aux citoyens."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="severity">Niveau de gravité</Label>
                <Select
                  value={draft.severity}
                  onValueChange={(val) =>
                    setDraft((d) => ({ ...d, severity: val as AlertSeverity }))
                  }
                >
                  <SelectTrigger id="severity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target">Cible de diffusion</Label>
                <Select
                  value={draft.target}
                  onValueChange={(val) =>
                    setDraft((d) => ({ ...d, target: val as AlertTarget }))
                  }
                >
                  <SelectTrigger id="target" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les habitants</SelectItem>
                    <SelectItem value="district">Quartier spécifique</SelectItem>
                    <SelectItem value="vulnerable">Personnes vulnérables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {draft.target === "district" && (
              <div className="space-y-1.5">
                <Label htmlFor="targetDistrict">Quartier cible</Label>
                <Select
                  value={draft.targetDistrict}
                  onValueChange={(val) =>
                    setDraft((d) => ({ ...d, targetDistrict: val }))
                  }
                >
                  <SelectTrigger id="targetDistrict" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">Titre de l&apos;alerte</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ex. Alerte Tempête de Sable Ionique"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">Description de la situation</Label>
              <textarea
                id="body"
                rows={3}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="Détails du risque, conditions observées..."
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {/* Bloc Consignes + Génération IA (F31) */}
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="instructions" className="font-semibold">
                  Consignes et conduite à tenir
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAi}
                  disabled={aiLoading}
                  className="gap-1.5 text-xs text-primary border-primary/40 hover:bg-primary/10"
                >
                  {aiLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Générer des recommandations (IA)
                </Button>
              </div>

              {aiError && (
                <div
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded"
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <textarea
                id="instructions"
                rows={3}
                value={draft.instructions}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, instructions: e.target.value }))
                }
                placeholder="Instructions que les habitants doivent suivre..."
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <p className="text-[11px] text-muted-foreground">
                Relisez et modifiez toujours les recommandations générées avant de publier.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Date de début</Label>
                <DateTimePicker
                  id="startsAt"
                  value={draft.startsAt}
                  onChange={(val) =>
                    setDraft((d) => ({ ...d, startsAt: val }))
                  }
                  placeholder="Choisir date de début"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiresAt">Date d&apos;expiration prévue</Label>
                <DateTimePicker
                  id="expiresAt"
                  value={draft.expiresAt}
                  onChange={(val) =>
                    setDraft((d) => ({ ...d, expiresAt: val }))
                  }
                  placeholder="Choisir date d'expiration"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? "Enregistrement…"
                  : editingAlert
                  ? "Enregistrer les modifications"
                  : "Diffuser l'alerte"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation de clôture */}
      <AlertDialog
        open={!!alertToTerminate}
        onOpenChange={(open) => {
          if (!open) setAlertToTerminate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer cette alerte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir clore l&apos;alerte{" "}
              <span className="font-semibold text-foreground">
                « {alertToTerminate?.title} »
              </span>{" "}
              ? Elle cessera immédiatement d&apos;être active et passera au statut expiré.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={terminatingId !== null}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                confirmTerminate();
              }}
              disabled={terminatingId !== null}
            >
              {terminatingId ? "Clôture en cours…" : "Confirmer la clôture"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation de suppression définitive (Admin) */}
      <AlertDialog
        open={!!alertToDelete}
        onOpenChange={(open) => {
          if (!open) setAlertToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement l&apos;alerte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous certain de vouloir supprimer l&apos;alerte{" "}
              <span className="font-semibold text-foreground">
                « {alertToDelete?.title} »
              </span>{" "}
              du registre ? Cette action est un privilège d&apos;administration irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deletingId !== null}
            >
              {deletingId ? "Suppression…" : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AgentAlertesPage() {
  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <AgentAlertesContent />
    </DashboardLayout>
  );
}
