"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentServiceFeedbacks,
  fetchServices,
  type AgentServiceFeedback,
  type Service,
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
  Star,
  RefreshCw,
  MessageSquareQuote,
  Building2,
  User,
  Filter,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AgentServiceFeedbacksPage() {
  const { user, token } = useAuth();

  const [feedbacks, setFeedbacks] = useState<AgentServiceFeedback[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des services municipaux
  useEffect(() => {
    fetchServices()
      .then((data) => setServices(data || []))
      .catch(() => {});
  }, []);

  const loadFeedbacks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const filterId = selectedServiceId !== "all" ? selectedServiceId : undefined;
      const data = await fetchAgentServiceFeedbacks(token, filterId);
      setFeedbacks(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des avis.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, selectedServiceId]);

  useEffect(() => {
    Promise.resolve().then(() => loadFeedbacks());
  }, [loadFeedbacks]);

  // Calcul des statistiques globales et moyennes par service
  const stats = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) {
      return {
        overallAverage: 0,
        totalCount: 0,
        byService: [] as {
          serviceId: number;
          serviceName: string;
          average: number;
          count: number;
        }[],
      };
    }

    const totalCount = feedbacks.length;
    const sumRatings = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const overallAverage = Number((sumRatings / totalCount).toFixed(1));

    // Regroupement par service
    const grouped = new Map<number, { name: string; sum: number; count: number }>();
    feedbacks.forEach((f) => {
      const sId = f.serviceId;
      const sName =
        f.service?.name ||
        services.find((s) => s.id === sId)?.name ||
        `Service #${sId}`;
      const curr = grouped.get(sId) || { name: sName, sum: 0, count: 0 };
      curr.sum += f.rating || 0;
      curr.count += 1;
      grouped.set(sId, curr);
    });

    const byService = Array.from(grouped.entries()).map(([serviceId, val]) => ({
      serviceId,
      serviceName: val.name,
      average: Number((val.sum / val.count).toFixed(1)),
      count: val.count,
    }));

    return { overallAverage, totalCount, byService };
  }, [feedbacks, services]);

  if (!user) return null;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 text-xs">
                <Star className="size-3 fill-primary text-primary" />
                Qualité du Service Public (F76)
              </Badge>
              {feedbacks && (
                <Badge variant="secondary" className="text-xs">
                  {feedbacks.length} avis recensé{feedbacks.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Avis sur les services
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mesurez la satisfaction des habitants, consultez les remarques et suivez les moyennes de chaque service municipal.
            </p>
          </div>

          <Button
            onClick={() => loadFeedbacks()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto"
            aria-label="Actualiser les avis"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Cartes de synthèse des moyennes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-foreground">
                Note globale moyenne
              </CardDescription>
              <CardTitle className="flex items-baseline gap-2 text-3xl font-bold">
                <span className="text-primary">{stats.overallAverage > 0 ? stats.overallAverage : "—"}</span>
                <span className="text-xs text-muted-foreground font-normal">/ 5</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                <span>Basé sur {stats.totalCount} évaluation{stats.totalCount > 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>

          {stats.byService.slice(0, 3).map((item) => (
            <Card key={item.serviceId}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs truncate font-medium" title={item.serviceName}>
                  {item.serviceName}
                </CardDescription>
                <CardTitle className="flex items-baseline gap-2 text-2xl font-bold">
                  <span className={cn(item.average >= 4 ? "text-success" : item.average >= 3 ? "text-primary" : "text-destructive")}>
                    {item.average}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">/ 5</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {item.count} avis enregistré{item.count > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtre par service */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Filter className="size-3.5" />
                  <span>Filtrer par service municipal :</span>
                </div>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger className="w-[260px]" aria-label="Filtrer par service municipal">
                    <SelectValue placeholder="Tous les services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services municipaux</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedServiceId !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedServiceId("all")}
                  className="text-xs h-8 text-muted-foreground"
                >
                  Réinitialiser le filtre
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tableau des avis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Détail des retours citoyens</CardTitle>
            <CardDescription className="text-xs">
              {selectedServiceId !== "all"
                ? `Avis pour le service « ${services.find((s) => String(s.id) === selectedServiceId)?.name || `#${selectedServiceId}`} »`
                : "Retours d'expérience et notes déposés sur l'ensemble de la colonie"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex justify-center py-12" role="status">
                <LoadingSpinner />
                <span className="sr-only">Chargement des avis…</span>
              </div>
            )}

            {error && !loading && (
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm" role="alert">
                {error}
              </div>
            )}

            {!loading && !error && feedbacks?.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
                <MessageSquareQuote className="size-8 mx-auto opacity-40 text-primary" />
                <p>Aucun avis trouvé pour ce service municipal.</p>
              </div>
            )}

            {!loading && !error && feedbacks && feedbacks.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Référence</TableHead>
                      <TableHead className="w-[200px]">Service municipal</TableHead>
                      <TableHead className="w-[130px]">Note</TableHead>
                      <TableHead>Commentaire</TableHead>
                      <TableHead className="w-[180px]">Citoyen évaluateur</TableHead>
                      <TableHead className="w-[120px] text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map((f) => {
                      const serviceName =
                        f.service?.name ||
                        services.find((s) => s.id === f.serviceId)?.name ||
                        `Service #${f.serviceId}`;

                      return (
                        <TableRow key={f.id} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {f.reference}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-foreground">
                              <Building2 className="size-3.5 text-primary shrink-0" />
                              {serviceName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5 text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "size-3.5",
                                      star <= f.rating
                                        ? "fill-amber-500 text-amber-500"
                                        : "fill-muted text-muted-foreground/30"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-foreground">{f.rating}/5</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-md">
                            {f.comment ? (
                              <p className="text-muted-foreground leading-relaxed">&ldquo;{f.comment}&rdquo;</p>
                            ) : (
                              <span className="italic text-muted-foreground/60">Aucun commentaire textuel</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {f.citizen ? (
                              <div>
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <User className="size-3 text-muted-foreground" />
                                  {f.citizen.firstName} {f.citizen.lastName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  {f.citizen.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Citoyen #{f.citizenId}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-right font-mono">
                            {new Date(f.createdAt).toLocaleDateString("fr-FR")}
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
      </div>
    </DashboardLayout>
  );
}
