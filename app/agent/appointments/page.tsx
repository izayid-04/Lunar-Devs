"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentAppointments,
  downloadAppointmentIcs,
  type Appointment,
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
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  FileText,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExportCsvButton, type CsvColumn } from "@/components/ui/export-csv-button";

const agentAppointmentCsvColumns: CsvColumn<Appointment>[] = [
  { id: "id", label: "ID", getValue: (a) => a.id },
  { id: "date", label: "Date & Heure", getValue: (a) => new Date(a.startsAt).toLocaleString("fr-FR") },
  { id: "service", label: "Service", getValue: (a) => a.service?.name || "Service municipal" },
  { id: "status", label: "Statut", getValue: (a) => a.status === "confirme" ? "Confirmé" : "Annulé" },
  { id: "citizen", label: "Citoyen", getValue: (a) => a.user ? `${a.user.firstName} ${a.user.lastName}` : "Non renseigné" },
  { id: "email", label: "Email", getValue: (a) => a.user?.email || "" },
  { id: "reason", label: "Motif", getValue: (a) => a.reason || "" },
  { id: "location", label: "Lieu", getValue: (a) => a.location || "" },
];

export default function AgentAppointmentsPage() {
  const { user, token } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [filter, setFilter] = useState<"all" | "confirme" | "annule">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);

  const loadAppointments = useCallback(async () => {
    if (!token) return;
    setNow(Date.now());
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgentAppointments(token);
      setAppointments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des rendez-vous.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => loadAppointments());
  }, [loadAppointments]);

  async function handleDownloadIcs(apt: Appointment) {
    if (!token) return;
    setDownloadingId(apt.id);
    try {
      await downloadAppointmentIcs(token, apt.id);
      toast.success("Fichier iCalendar (.ics) téléchargé.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléchargement du calendrier.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!user) return null;

  const filtered = (appointments || []).filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const confirmedCount = (appointments || []).filter((a) => a.status === "confirme").length;
  const canceledCount = (appointments || []).filter((a) => a.status === "annule").length;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
                <Calendar className="size-3.5" />
                Planning du service
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {confirmedCount} confirmé{confirmedCount > 1 ? "s" : ""}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Rendez-vous de mon service</h1>
            <p className="text-sm text-muted-foreground">
              Consultez les créneaux réservés par les habitants, téléchargez les convocations iCalendar et préparez vos audiences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportCsvButton
              data={filtered}
              columns={agentAppointmentCsvColumns}
              filename="agent-rendez-vous"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={loadAppointments}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Compteurs résumé */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total réservations</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-foreground">{appointments?.length ?? "…"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Créneaux enregistrés</p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmés</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-success/15 text-success">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-success">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">À honorer par le service</p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annulés</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <XCircle className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-muted-foreground">{canceledCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Créneaux libérés</p>
            </div>
          </Card>
        </div>

        {/* Tableau des rendez-vous */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Calendrier des entretiens</CardTitle>
                <CardDescription className="text-xs">
                  Liste des rendez-vous avec motif, documents attendus et coordonnées de l&apos;usager.
                </CardDescription>
              </div>

              {/* Filtres par statut */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/50 border border-border/60">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "ghost"}
                  onClick={() => setFilter("all")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium",
                    filter === "all" && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  Tous ({appointments?.length ?? 0})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "confirme" ? "default" : "ghost"}
                  onClick={() => setFilter("confirme")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium",
                    filter === "confirme" && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  Confirmés ({confirmedCount})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "annule" ? "default" : "ghost"}
                  onClick={() => setFilter("annule")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium",
                    filter === "annule" && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  Annulés ({canceledCount})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive py-4">{error}</p>}

            {!error && loading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {!error && !loading && filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
                <Calendar className="size-8 mx-auto opacity-40" />
                <p>Aucun rendez-vous trouvé pour ce filtre.</p>
              </div>
            )}

            {!error && !loading && filtered.length > 0 && (
              <>
                {/* Cartes empilées sur mobile : un tableau large ne tient pas
                    sur un écran de téléphone sans défilement horizontal. */}
                <div className="block space-y-3 sm:hidden">
                  {filtered.map((apt) => {
                    const dateObj = new Date(apt.startsAt);
                    const isPast = now > 0 && dateObj.getTime() < now;
                    return (
                      <Card key={apt.id} className={cn(apt.status === "annule" && "opacity-60")}>
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-xs">
                                {dateObj.toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="size-3" />
                                {dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                {isPast && (
                                  <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 h-3.5 text-muted-foreground">
                                    Passé
                                  </Badge>
                                )}
                              </p>
                            </div>
                            {apt.status === "confirme" ? (
                              <Badge variant="secondary" className="gap-1 text-xs border-success/30 text-success bg-success/10">
                                <CheckCircle2 className="size-3" />
                                Confirmé
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-xs border-destructive/30 text-destructive bg-destructive/10">
                                <XCircle className="size-3" />
                                Annulé
                              </Badge>
                            )}
                          </div>

                          {apt.user ? (
                            <div className="text-xs">
                              <p className="font-medium">
                                {apt.user.firstName} {apt.user.lastName}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground">{apt.user.email}</p>
                            </div>
                          ) : (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="size-3" />
                              Usager inscrit
                            </p>
                          )}

                          <div className="text-xs">
                            <p className="font-medium">{apt.reason}</p>
                            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              {apt.service && <span>{apt.service.name}</span>}
                              {apt.location && (
                                <span className="flex items-center gap-0.5">
                                  • <MapPin className="size-2.5" /> {apt.location}
                                </span>
                              )}
                            </p>
                          </div>

                          {apt.requiredDocuments && (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground">
                              <FileText className="size-3 mt-0.5 shrink-0 text-primary" />
                              <span className="line-clamp-2">{apt.requiredDocuments}</span>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadIcs(apt)}
                            disabled={downloadingId === apt.id || apt.status === "annule"}
                            className="h-8 w-full gap-1.5 text-xs"
                          >
                            <Download className={cn("size-3.5", downloadingId === apt.id && "animate-bounce")} />
                            Télécharger (.ics)
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

              <div className="hidden rounded-md border overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Heure</TableHead>
                      <TableHead>Habitant</TableHead>
                      <TableHead>Motif & Service</TableHead>
                      <TableHead className="hidden md:table-cell">Pièces requises</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Export</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((apt) => {
                      const dateObj = new Date(apt.startsAt);
                      const isPast = now > 0 && dateObj.getTime() < now;

                      return (
                        <TableRow key={apt.id} className={cn(apt.status === "annule" && "opacity-60")}>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium text-xs">
                              {dateObj.toLocaleDateString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <Clock className="size-3" />
                              {dateObj.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {isPast && (
                                <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 h-3.5 text-muted-foreground">
                                  Passé
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {apt.user ? (
                              <div>
                                <div className="font-medium text-xs">
                                  {apt.user.firstName} {apt.user.lastName}
                                </div>
                                <div className="text-[11px] font-mono text-muted-foreground">
                                  {apt.user.email}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="size-3" />
                                Usager inscrit
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <div className="font-medium text-xs">{apt.reason}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              {apt.service && (
                                <span>{apt.service.name}</span>
                              )}
                              {apt.location && (
                                <span className="flex items-center gap-0.5">
                                  • <MapPin className="size-2.5" /> {apt.location}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="hidden md:table-cell max-w-xs text-xs text-muted-foreground">
                            {apt.requiredDocuments ? (
                              <div className="flex items-start gap-1">
                                <FileText className="size-3 mt-0.5 shrink-0 text-primary" />
                                <span className="line-clamp-2">{apt.requiredDocuments}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {apt.status === "confirme" ? (
                              <Badge variant="secondary" className="gap-1 text-xs border-success/30 text-success bg-success/10">
                                <CheckCircle2 className="size-3" />
                                Confirmé
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-xs border-destructive/30 text-destructive bg-destructive/10">
                                <XCircle className="size-3" />
                                Annulé
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadIcs(apt)}
                              disabled={downloadingId === apt.id || apt.status === "annule"}
                              className="h-8 px-2 text-xs gap-1"
                              title="Télécharger l'événement au format iCalendar (.ics)"
                            >
                              <Download className={cn("size-3.5", downloadingId === apt.id && "animate-bounce")} />
                              <span className="hidden sm:inline">.ics</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
