"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentCitizens,
  patchCitizenStatus,
  type CitizenUser,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Users,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AgentCitizensPage() {
  const { user, token } = useAuth();

  const [citizens, setCitizens] = useState<CitizenUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de confirmation
  const [targetCitizen, setTargetCitizen] = useState<CitizenUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCitizens = useCallback(
    async (currentPage = page) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAgentCitizens(token, {
          page: currentPage,
          limit: 15,
          q: debouncedSearch || undefined,
        });
        setCitizens(res.data || []);
        setTotal(res.total || 0);
        setPage(res.page || currentPage);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    },
    [token, debouncedSearch, page]
  );

  useEffect(() => {
    Promise.resolve().then(() => loadCitizens());
  }, [loadCitizens]);

  async function handleToggleStatus() {
    if (!token || !targetCitizen) return;
    setSubmitting(true);
    const newStatus = !targetCitizen.isActive;
    try {
      await patchCitizenStatus(token, targetCitizen.id, newStatus);
      toast.success(
        newStatus
          ? `Compte de ${targetCitizen.firstName} ${targetCitizen.lastName} réactivé.`
          : `Compte de ${targetCitizen.firstName} ${targetCitizen.lastName} désactivé.`
      );
      setTargetCitizen(null);
      loadCitizens(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification du statut.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
                <Users className="size-3.5" />
                Administration des usagers
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {total} citoyen{total > 1 ? "s" : ""}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Gestion des citoyens</h1>
            <p className="text-sm text-muted-foreground">
              Recherchez des usagers, consultez leur situation et activez ou désactivez leur accès (F34).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCitizens(page)}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Barre de recherche */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des citoyens */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Comptes citoyens</CardTitle>
                <CardDescription className="text-xs">
                  {debouncedSearch
                    ? `Résultats pour « ${debouncedSearch} » (${total} trouvé${total > 1 ? "s" : ""})`
                    : "Ensemble des habitants inscrits sur Nova Terra"}
                </CardDescription>
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

            {!error && !loading && citizens.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
                <Users className="size-8 mx-auto opacity-40" />
                <p>Aucun citoyen trouvé{debouncedSearch ? " pour cette recherche" : ""}.</p>
              </div>
            )}

            {!error && !loading && citizens.length > 0 && (
              <>
                {/* Cartes empilées sur mobile : un tableau large ne tient pas
                    sur un écran de téléphone sans défilement horizontal. */}
                <div className="block space-y-3 sm:hidden">
                  {citizens.map((c) => {
                    const isSelf = c.id === user.id;
                    return (
                      <Card key={c.id}>
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground">{c.email}</p>
                            </div>
                            {c.isActive ? (
                              <Badge variant="secondary" className="gap-1 text-xs border-success/30 text-success bg-success/10">
                                <UserCheck className="size-3" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <UserX className="size-3" />
                                Désactivé
                              </Badge>
                            )}
                          </div>
                          {c.isVulnerable && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
                              Accompagnement
                            </Badge>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Quartier : {c.district || "—"}</span>
                            <span>
                              Inscrit le{" "}
                              {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={c.isActive ? "outline" : "default"}
                            disabled={isSelf}
                            onClick={() => setTargetCitizen(c)}
                            className={cn(
                              "h-8 w-full text-xs gap-1.5",
                              c.isActive
                                ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                : "bg-success hover:bg-success/90 text-white"
                            )}
                          >
                            {c.isActive ? (
                              <>
                                <UserX className="size-3.5" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <UserCheck className="size-3.5" />
                                Réactiver
                              </>
                            )}
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
                        <TableHead>Habitant</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Quartier</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Inscription</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {citizens.map((c) => {
                        const isSelf = c.id === user.id;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              {c.firstName} {c.lastName}
                              {c.isVulnerable && (
                                <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-600">
                                  Accompagnement
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {c.email}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {c.district || "—"}
                            </TableCell>
                            <TableCell>
                              {c.isActive ? (
                                <Badge variant="secondary" className="gap-1 text-xs border-success/30 text-success bg-success/10">
                                  <UserCheck className="size-3" />
                                  Actif
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1 text-xs">
                                  <UserX className="size-3" />
                                  Désactivé
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={c.isActive ? "outline" : "default"}
                                disabled={isSelf}
                                onClick={() => setTargetCitizen(c)}
                                className={cn(
                                  "h-8 text-xs gap-1.5",
                                  c.isActive
                                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                    : "bg-success hover:bg-success/90 text-white"
                                )}
                              >
                                {c.isActive ? (
                                  <>
                                    <UserX className="size-3.5" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="size-3.5" />
                                    Réactiver
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Page <strong className="text-foreground">{page}</strong> sur{" "}
                      <strong className="text-foreground">{totalPages}</strong> ({total} comptes)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const p = Math.max(1, page - 1);
                          setPage(p);
                          loadCitizens(p);
                        }}
                        disabled={page <= 1 || loading}
                        className="h-8 w-8 p-0"
                        aria-label="Page précédente"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const p = Math.min(totalPages, page + 1);
                          setPage(p);
                          loadCitizens(p);
                        }}
                        disabled={page >= totalPages || loading}
                        className="h-8 w-8 p-0"
                        aria-label="Page suivante"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de confirmation d'activation / désactivation */}
        <Dialog open={!!targetCitizen} onOpenChange={(open) => !open && setTargetCitizen(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    targetCitizen?.isActive
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success"
                  )}
                >
                  {targetCitizen?.isActive ? (
                    <AlertTriangle className="size-5" />
                  ) : (
                    <UserCheck className="size-5" />
                  )}
                </div>
                <DialogTitle>
                  {targetCitizen?.isActive
                    ? "Confirmer la désactivation"
                    : "Confirmer la réactivation"}
                </DialogTitle>
              </div>
              <DialogDescription className="pt-2 text-sm leading-relaxed">
                {targetCitizen?.isActive ? (
                  <>
                    Êtes-vous sûr de vouloir désactiver le compte citoyen de{" "}
                    <strong className="text-foreground">
                      {targetCitizen.firstName} {targetCitizen.lastName}
                    </strong>{" "}
                    ({targetCitizen.email}) ?
                    <br />
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Le citoyen ne pourra plus se connecter au portail municipal Nova Terra tant
                      que son compte n&apos;aura pas été réactivé. Ses demandes et rendez-vous restent
                      conservés.
                    </span>
                  </>
                ) : (
                  <>
                    Voulez-vous rétablir l&apos;accès au portail pour{" "}
                    <strong className="text-foreground">
                      {targetCitizen?.firstName} {targetCitizen?.lastName}
                    </strong>{" "}
                    ({targetCitizen?.email}) ?
                    <br />
                    <span className="mt-2 block text-xs text-muted-foreground">
                      L&apos;habitant pourra immédiatement se reconnecter avec ses identifiants
                      habituels.
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setTargetCitizen(null)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                variant={targetCitizen?.isActive ? "destructive" : "default"}
                onClick={handleToggleStatus}
                disabled={submitting}
                className={cn(!targetCitizen?.isActive && "bg-success hover:bg-success/90 text-white")}
              >
                {submitting ? (
                  "Traitement..."
                ) : targetCitizen?.isActive ? (
                  "Confirmer la désactivation"
                ) : (
                  "Réactiver le compte"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
