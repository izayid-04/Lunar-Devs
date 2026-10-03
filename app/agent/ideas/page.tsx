"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentIdeas,
  patchAgentIdea,
  type AgentIdea,
  type IdeaStatus,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Lightbulb,
  RefreshCw,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  FileSearch,
  MapPin,
  User,
  Filter,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; badge: string; icon: typeof Clock }
> = {
  soumise: {
    label: "Soumise",
    badge: "border-primary/40 text-primary bg-primary/10",
    icon: Clock,
  },
  en_etude: {
    label: "En étude",
    badge: "border-amber-500/40 text-amber-500 bg-amber-500/10",
    icon: FileSearch,
  },
  retenue: {
    label: "Retenue",
    badge: "border-success/40 text-success bg-success/10",
    icon: CheckCircle2,
  },
  rejetee: {
    label: "Rejetée",
    badge: "border-destructive/40 text-destructive bg-destructive/10",
    icon: XCircle,
  },
};

const ALL_STATUSES: IdeaStatus[] = ["soumise", "en_etude", "retenue", "rejetee"];

export default function AgentIdeasPage() {
  const { user, token } = useAuth();

  const [ideas, setIdeas] = useState<AgentIdea[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modale de changement de statut avec note
  const [selectedIdea, setSelectedIdea] = useState<AgentIdea | null>(null);
  const [editStatus, setEditStatus] = useState<IdeaStatus>("soumise");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadIdeas = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const filterParam = statusFilter !== "all" ? (statusFilter as IdeaStatus) : undefined;
      const data = await fetchAgentIdeas(token, filterParam);
      setIdeas(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des idées.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    Promise.resolve().then(() => loadIdeas());
  }, [loadIdeas]);

  const openStatusDialog = (idea: AgentIdea) => {
    setSelectedIdea(idea);
    setEditStatus(idea.status);
    setAdminNote(idea.adminNote || "");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedIdea) return;
    setSubmitting(true);
    try {
      const updated = await patchAgentIdea(token, selectedIdea.id, {
        status: editStatus,
        adminNote: adminNote.trim() || undefined,
      });
      toast.success(`Statut de l'idée mis à jour : ${STATUS_CONFIG[updated.status].label}`);
      setSelectedIdea(null);
      loadIdeas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de mettre à jour l'idée.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 text-xs">
                <Lightbulb className="size-3" />
                Participation Citoyenne (F68)
              </Badge>
              {ideas && (
                <Badge variant="secondary" className="text-xs">
                  {ideas.length} idée{ideas.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Idées des habitants
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultez les initiatives proposées par les citoyens, instruisez-les et tenez les habitants informés de la décision.
            </p>
          </div>

          <Button
            onClick={() => loadIdeas()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto"
            aria-label="Actualiser les idées"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Barre de filtres */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Filter className="size-3.5" />
                  <span>Filtrer par statut :</span>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" aria-label="Filtrer par statut d'idée">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {ALL_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {STATUS_CONFIG[st].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des idées */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Propositions citoyennes</CardTitle>
            <CardDescription className="text-xs">
              {statusFilter !== "all"
                ? `Affichage des idées au statut « ${STATUS_CONFIG[statusFilter as IdeaStatus]?.label} »`
                : "Toutes les initiatives répertoriées sur Nova Terra"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex justify-center py-12" role="status">
                <LoadingSpinner />
                <span className="sr-only">Chargement des idées…</span>
              </div>
            )}

            {error && !loading && (
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm" role="alert">
                {error}
              </div>
            )}

            {!loading && !error && ideas?.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
                <Lightbulb className="size-8 mx-auto opacity-40 text-primary" />
                <p>Aucune idée citoyenne trouvée pour ce filtre.</p>
              </div>
            )}

            {!loading && !error && ideas && ideas.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Référence</TableHead>
                      <TableHead>Titre & Description</TableHead>
                      <TableHead className="w-[150px]">Quartier</TableHead>
                      <TableHead className="w-[180px]">Auteur</TableHead>
                      <TableHead className="w-[130px]">Statut</TableHead>
                      <TableHead className="w-[180px]">Note administrative</TableHead>
                      <TableHead className="text-right w-[110px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ideas.map((idea) => {
                      const cfg = STATUS_CONFIG[idea.status] || STATUS_CONFIG.soumise;
                      const Icon = cfg.icon;
                      return (
                        <TableRow key={idea.id} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {idea.reference}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {new Date(idea.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs md:max-w-sm">
                            <p className="font-semibold text-foreground text-sm leading-snug">
                              {idea.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {idea.description}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="size-3.5 text-primary shrink-0" />
                              {idea.district || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {idea.citizen ? (
                              <div>
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <User className="size-3 text-muted-foreground" />
                                  {idea.citizen.firstName} {idea.citizen.lastName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  {idea.citizen.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Habitant #{idea.citizenId || "—"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1 text-xs", cfg.badge)}>
                              <Icon className="size-3" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs">
                            {idea.adminNote ? (
                              <p className="line-clamp-2 italic border-l-2 border-primary/30 pl-2">
                                &ldquo;{idea.adminNote}&rdquo;
                              </p>
                            ) : (
                              <span className="text-muted-foreground/60 italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStatusDialog(idea)}
                              className="h-8 gap-1.5 text-xs"
                              title="Modifier le statut et ajouter une note"
                            >
                              <Edit className="size-3.5" />
                              Instruire
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogue d'instruction de l'idée */}
        <Dialog open={!!selectedIdea} onOpenChange={(open) => !open && setSelectedIdea(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="size-5 text-primary" />
                Instruire l&apos;idée citoyenne
              </DialogTitle>
              <DialogDescription>
                Définissez le statut de la proposition et fournissez une justification consultable par l&apos;habitant.
              </DialogDescription>
            </DialogHeader>

            {selectedIdea && (
              <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <span className="font-mono text-xs text-primary font-bold">{selectedIdea.reference}</span>
                  <p className="text-sm font-semibold text-foreground">{selectedIdea.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{selectedIdea.description}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editStatus">Statut de la proposition</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(val) => setEditStatus(val as IdeaStatus)}
                  >
                    <SelectTrigger id="editStatus" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {STATUS_CONFIG[st].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminNote">
                    Note administrative / Explication transmise au citoyen
                  </Label>
                  <Textarea
                    id="adminNote"
                    rows={4}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ex: Proposition retenue et inscrite au budget participatif 2026…"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Cette note sera visible par le citoyen dans le suivi de ses démarches.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedIdea(null)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Enregistrement…" : "Valider le statut"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
