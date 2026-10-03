"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAuditLogs,
  type AuditLogItem,
  type AuditLogsFilter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  History,
  RefreshCw,
  User,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Traduction claire en français de chaque action
const ACTION_LABELS: Record<string, { label: string; badge: string; icon: typeof Activity }> = {
  message_status_updated: {
    label: "Mise à jour de statut de demande",
    badge: "border-primary/40 text-primary bg-primary/10",
    icon: Activity,
  },
  citizen_account_activated: {
    label: "Activation de compte citoyen",
    badge: "border-success/40 text-success bg-success/10",
    icon: CheckCircle2,
  },
  citizen_account_deactivated: {
    label: "Désactivation de compte citoyen",
    badge: "border-destructive/40 text-destructive bg-destructive/10",
    icon: AlertTriangle,
  },
  citizen_account_deleted: {
    label: "Suppression définitive de compte",
    badge: "border-destructive/40 text-destructive bg-destructive/15",
    icon: AlertTriangle,
  },
  service_availability_updated: {
    label: "Disponibilité de service modifiée",
    badge: "border-primary/40 text-primary bg-primary/10",
    icon: Layers,
  },
  alert_created: {
    label: "Déclenchement d'une alerte",
    badge: "border-destructive/40 text-destructive bg-destructive/10",
    icon: ShieldAlert,
  },
  alert_updated: {
    label: "Modification d'une alerte",
    badge: "border-amber-500/40 text-amber-500 bg-amber-500/10",
    icon: Activity,
  },
  alert_terminated: {
    label: "Clôture d'une alerte",
    badge: "border-success/40 text-success bg-success/10",
    icon: CheckCircle2,
  },
  alert_deleted: {
    label: "Suppression d'alerte",
    badge: "border-destructive/40 text-destructive bg-destructive/10",
    icon: ShieldAlert,
  },
};

const ENTITY_LABELS: Record<string, string> = {
  CitizenMessage: "Demande citoyenne",
  User: "Compte utilisateur",
  MunicipalService: "Service municipal",
  Alert: "Alerte de sécurité",
};

export default function AgentAuditLogsPage() {
  const { user, token } = useAuth();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");

  const loadLogs = useCallback(
    async (currentPage = page) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const filter: AuditLogsFilter = {
          page: currentPage,
          limit: 15,
        };
        if (selectedAction !== "all") filter.action = selectedAction;
        if (selectedEntity !== "all") filter.entityType = selectedEntity;

        const res = await fetchAuditLogs(token, filter);
        setLogs(res.items || []);
        setTotal(res.total || 0);
        setPage(res.page || currentPage);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur de chargement de l'audit.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [token, page, selectedAction, selectedEntity]
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      loadLogs(1);
    });
  }, [loadLogs]);

  const handleActionChange = (val: string) => {
    setSelectedAction(val);
    setPage(1);
  };

  const handleEntityChange = (val: string) => {
    setSelectedEntity(val);
    setPage(1);
  };

  const parseDetails = (detailsStr: string | null) => {
    if (!detailsStr) return null;
    try {
      const parsed = JSON.parse(detailsStr);
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed).map(([key, val]) => (
          <span key={key} className="inline-block mr-2 text-[11px] font-mono text-muted-foreground">
            <span className="font-semibold text-foreground/80">{key}:</span> {String(val)}
          </span>
        ));
      }
    } catch {
      return <span className="text-xs text-muted-foreground">{detailsStr}</span>;
    }
    return <span className="text-xs text-muted-foreground">{detailsStr}</span>;
  };

  if (!user) return null;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 text-xs">
              <ShieldAlert className="size-3" />
              Traçabilité Administrative
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Historique des actions & Journal d&apos;audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre immuable des opérations de gestion : qui a fait quoi, quand et sur quel dossier.
          </p>
        </div>

        <Button
          onClick={() => loadLogs(page)}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          aria-label="Actualiser le journal d'audit"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Barre de filtres accessible */}
      <Card className="mt-6">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="size-3.5" />
                <span>Filtrer par :</span>
              </div>

              {/* Filtre Action */}
              <div className="min-w-[200px]">
                <Select value={selectedAction} onValueChange={handleActionChange}>
                  <SelectTrigger aria-label="Filtrer par type d'action">
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="message_status_updated">Statut de message</SelectItem>
                    <SelectItem value="citizen_account_activated">Activation compte</SelectItem>
                    <SelectItem value="citizen_account_deactivated">Désactivation compte</SelectItem>
                    <SelectItem value="citizen_account_deleted">Suppression compte</SelectItem>
                    <SelectItem value="service_availability_updated">Disponibilité service</SelectItem>
                    <SelectItem value="alert_created">Création alerte</SelectItem>
                    <SelectItem value="alert_updated">Modification alerte</SelectItem>
                    <SelectItem value="alert_terminated">Clôture alerte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Entité */}
              <div className="min-w-[180px]">
                <Select value={selectedEntity} onValueChange={handleEntityChange}>
                  <SelectTrigger aria-label="Filtrer par type d'objet">
                    <SelectValue placeholder="Tous les objets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les objets</SelectItem>
                    <SelectItem value="CitizenMessage">Demandes citoyennes</SelectItem>
                    <SelectItem value="User">Comptes utilisateurs</SelectItem>
                    <SelectItem value="MunicipalService">Services municipaux</SelectItem>
                    <SelectItem value="Alert">Alertes de sécurité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              {total} opération{total > 1 ? "s" : ""} consignée{total > 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tableau du Journal d'Audit */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="size-4 text-primary" />
            Événements administratifs récents
          </CardTitle>
          <CardDescription>
            Toutes les entrées sont horodatées et rattachées à un compte agent vérifié.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center py-12" role="status">
              <LoadingSpinner />
              <span className="sr-only">Chargement du journal d&apos;audit…</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucune action consignée pour les critères sélectionnés.
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date & Heure</TableHead>
                    <TableHead className="w-[220px]">Action réalisée</TableHead>
                    <TableHead className="w-[180px]">Objet concerné</TableHead>
                    <TableHead className="w-[200px]">Auteur (Agent / Admin)</TableHead>
                    <TableHead>Détails de l&apos;opération</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || {
                      label: log.action.replace(/_/g, " "),
                      badge: "border-border text-foreground bg-muted",
                      icon: Activity,
                    };
                    const ActionIcon = actionInfo.icon;
                    const entityLabel = ENTITY_LABELS[log.entityType] || log.entityType;

                    return (
                      <TableRow key={log.id} tabIndex={0} className="focus:bg-muted/50 outline-none">
                        <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 text-[11px] font-medium", actionInfo.badge)}>
                            <ActionIcon className="size-3 shrink-0" />
                            <span>{actionInfo.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium text-foreground">{entityLabel}</span>
                          <span className="block text-[10px] font-mono text-muted-foreground">
                            ID: {log.entityId}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.author ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground flex items-center gap-1">
                                <User className="size-3 text-muted-foreground" />
                                {log.author.firstName} {log.author.lastName}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {log.author.email} ({log.author.role})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Système</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-md">
                          {parseDetails(log.details) || (
                            <span className="text-muted-foreground italic text-xs">Aucune note</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination au clavier */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground font-mono">
                Page {page} sur {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prev = Math.max(page - 1, 1);
                    setPage(prev);
                    loadLogs(prev);
                  }}
                  disabled={page <= 1 || loading}
                  className="gap-1 h-8 px-2.5 text-xs"
                  aria-label="Page précédente du journal d'audit"
                >
                  <ChevronLeft className="size-3.5" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = Math.min(page + 1, totalPages);
                    setPage(next);
                    loadLogs(next);
                  }}
                  disabled={page >= totalPages || loading}
                  className="gap-1 h-8 px-2.5 text-xs"
                  aria-label="Page suivante du journal d'audit"
                >
                  Suivant
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
