"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchTransports,
  patchTransportStatus,
  type TransportLine,
  type TransportType,
  type TransportStatus,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rocket,
  Bus,
  Train,
  Ship,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  MapPin,
  Pencil,
  Navigation,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<TransportType, typeof Rocket> = {
  navette: Rocket,
  bus: Bus,
  tram: Train,
  batelier: Ship,
};

const TYPE_LABELS: Record<TransportType, string> = {
  navette: "Navette orbitale",
  bus: "Bus de surface",
  tram: "Tramway / Maglev",
  batelier: "Liaison maritime",
};

const STATUS_CONFIG: Record<
  TransportStatus,
  { label: string; badgeClass: string; icon: typeof CheckCircle2 }
> = {
  normal: {
    label: "Trafic normal",
    badgeClass: "border-success/40 text-success bg-success/10",
    icon: CheckCircle2,
  },
  perturbe: {
    label: "Perturbé",
    badgeClass: "border-amber-500/40 text-amber-500 bg-amber-500/10",
    icon: AlertTriangle,
  },
  interrompu: {
    label: "Interrompu",
    badgeClass: "border-destructive/40 text-destructive bg-destructive/10",
    icon: XCircle,
  },
};

export default function TransportsContent({
  allowManagement = false,
}: {
  allowManagement?: boolean;
}) {
  const { user, token } = useAuth();
  const isStaff = allowManagement && (user?.role === "agent" || user?.role === "admin");

  const [lines, setLines] = useState<TransportLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Modal d'édition agent
  const [editingLine, setEditingLine] = useState<TransportLine | null>(null);
  const [newStatus, setNewStatus] = useState<TransportStatus>("normal");
  const [newStatusMessage, setNewStatusMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransports();
      setLines(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des transports.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  // Filtrage combiné (type + recherche)
  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      const matchesType = selectedType === "all" || line.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        line.name.toLowerCase().includes(q) ||
        line.code.toLowerCase().includes(q) ||
        line.origin.toLowerCase().includes(q) ||
        line.destination.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [lines, selectedType, searchQuery]);

  const openEditDialog = (line: TransportLine) => {
    setEditingLine(line);
    setNewStatus(line.status);
    setNewStatusMessage(line.statusMessage);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingLine) return;

    if (!newStatusMessage.trim()) {
      toast.error("Veuillez indiquer un message de circulation.");
      return;
    }

    setUpdating(true);
    try {
      const updated = await patchTransportStatus(token, editingLine.code || editingLine.id, {
        status: newStatus,
        statusMessage: newStatusMessage.trim(),
      });
      toast.success(`Ligne ${updated.code} mise à jour avec succès.`);
      setLines((prev) =>
        prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
      );
      setEditingLine(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de modifier la ligne.");
    } finally {
      setUpdating(false);
    }
  };

  const parseJsonArray = (val: string | string[]): string[] => {
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* En-tête principal */}
      <section className="border-b border-border px-6 py-12 sm:py-16 text-center bg-card/40">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 px-3 py-1 text-xs">
            <Rocket className="size-3" />
            Réseau de Mobilité Planétaire
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            Lignes & Transports de Nova Terra
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
            Consultez en temps réel l&apos;état du trafic, les horaires et les prochains départs sur l&apos;ensemble de la colonie.
          </p>
        </div>
      </section>

      {/* Barre de recherche et filtres */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une ligne, code, quartier..."
              className="pl-9 h-10"
              aria-label="Rechercher une ligne de transport"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[180px]">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10" aria-label="Filtrer par type de transport">
                  <SelectValue placeholder="Tous les modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  <SelectItem value="navette">Navettes orbitales</SelectItem>
                  <SelectItem value="tram">Tramways / Maglev</SelectItem>
                  <SelectItem value="bus">Bus de surface</SelectItem>
                  <SelectItem value="batelier">Liaisons maritimes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 h-10 px-3"
              aria-label="Actualiser les informations de transport"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Liste des lignes */}
        <div className="mt-8">
          {loading && (
            <div className="flex justify-center py-16" role="status">
              <LoadingSpinner />
              <span className="sr-only">Chargement des données de transport…</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm text-center" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && filteredLines.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Aucune ligne de transport ne correspond à vos critères de recherche.
            </div>
          )}

          {!loading && !error && filteredLines.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredLines.map((line) => {
                const IconComponent = TYPE_ICONS[line.type] || Rocket;
                const statusInfo = STATUS_CONFIG[line.status] || STATUS_CONFIG.normal;
                const StatusIcon = statusInfo.icon;
                const stopsList = parseJsonArray(line.stops);
                const nextDepList = parseJsonArray(line.nextDepartures);

                return (
                  <Card key={line.id} className="overflow-hidden border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                            <IconComponent className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-foreground">
                                {line.code}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                • {TYPE_LABELS[line.type]}
                              </span>
                            </div>
                            <CardTitle className="text-base font-bold text-foreground mt-0.5">
                              {line.name}
                            </CardTitle>
                          </div>
                        </div>

                        {/* Badge de statut */}
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant="outline" className={cn("gap-1 text-xs font-medium", statusInfo.badgeClass)}>
                            <StatusIcon className="size-3 shrink-0" />
                            <span>{statusInfo.label}</span>
                          </Badge>
                          {isStaff && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(line)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                              aria-label={`Modifier l'état de la ligne ${line.code}`}
                            >
                              <Pencil className="size-3" />
                              Gérer l&apos;état
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Message de statut en clair */}
                      <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md border border-border/60">
                        <span className="font-semibold text-foreground/80">Info trafic :</span> {line.statusMessage}
                      </p>
                    </CardHeader>

                    <CardContent className="p-5 pt-2 space-y-4">
                      {/* Origine / Destination & Fréquence */}
                      <div className="grid grid-cols-2 gap-3 text-xs border-y border-border/60 py-3">
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Navigation className="size-3" />
                            Itinéraire :
                          </span>
                          <span className="font-medium text-foreground block mt-0.5">
                            {line.origin} <ArrowRight className="inline size-3 text-muted-foreground mx-1" /> {line.destination}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            Fréquence & Plage :
                          </span>
                          <span className="font-medium text-foreground block mt-0.5 font-mono">
                            {line.frequency} ({line.operatingHours})
                          </span>
                        </div>
                      </div>

                      {/* Arrêts desservis */}
                      {stopsList.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mb-1.5">
                            <MapPin className="size-3 text-primary" />
                            Arrêts principaux :
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {stopsList.map((stop, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[11px] font-normal px-2 py-0.5">
                                {stop}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prochains départs */}
                      {nextDepList.length > 0 && (
                        <div className="pt-1">
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mb-1.5">
                            <Clock className="size-3 text-success" />
                            Prochains départs :
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {nextDepList.map((time, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-md bg-card border border-border text-foreground font-mono text-xs font-semibold shadow-2xs"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialogue d'édition d'état pour les agents */}
      <Dialog open={!!editingLine} onOpenChange={(open) => !open && setEditingLine(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;état de circulation</DialogTitle>
            <DialogDescription>
              Mise à jour du statut pour la ligne <span className="font-bold text-foreground">{editingLine?.code}</span> ({editingLine?.name}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="status-select">État du trafic</Label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as TransportStatus)}>
                <SelectTrigger id="status-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (Circulation fluide)</SelectItem>
                  <SelectItem value="perturbe">Perturbé (Ralentissements)</SelectItem>
                  <SelectItem value="interrompu">Interrompu (Ligne arrêtée)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-message">Message d&apos;information aux voyageurs</Label>
              <Input
                id="status-message"
                value={newStatusMessage}
                onChange={(e) => setNewStatusMessage(e.target.value)}
                placeholder="Ex. Retard de 10 min suite à incident technique..."
                className="mt-1.5"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingLine(null)} disabled={updating}>
                Annuler
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Enregistrement…" : "Publier l'état"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
