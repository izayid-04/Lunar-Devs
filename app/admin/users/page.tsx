"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAdminUsers,
  createAdminUser,
  patchAdminUserRole,
  patchAdminUserStatus,
  type CitizenUser,
  type Role,
} from "@/lib/api";
import { DISTRICTS } from "@/lib/alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserPlus,
  ShieldQuestion,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = {
  citizen: "Citoyen",
  agent: "Agent",
  admin: "Admin",
};

const ROLES: Role[] = ["citizen", "agent", "admin"];

export default function AdminUsersPage() {
  const { user, token } = useAuth();

  const [users, setUsers] = useState<CitizenUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirmation activation / désactivation
  const [statusTarget, setStatusTarget] = useState<CitizenUser | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Confirmation changement de rôle
  const [roleTarget, setRoleTarget] = useState<{ user: CitizenUser; newRole: Role } | null>(null);
  const [submittingRole, setSubmittingRole] = useState(false);

  // Création de compte
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createRole, setCreateRole] = useState<Role>("agent");
  const [createDistrict, setCreateDistrict] = useState<string>(DISTRICTS[0]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(
    async (currentPage: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminUsers(token, {
          page: currentPage,
          limit: 15,
          q: debouncedSearch || undefined,
          role: roleFilter !== "all" ? (roleFilter as Role) : undefined,
        });
        setUsers(res.data || []);
        setTotal(res.total || 0);
        setPage(res.page || currentPage);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    },
    [token, debouncedSearch, roleFilter]
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      setPage(1);
      loadUsers(1);
    });
  }, [debouncedSearch, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleStatus() {
    if (!token || !statusTarget) return;
    setSubmittingStatus(true);
    const newStatus = !statusTarget.isActive;
    try {
      await patchAdminUserStatus(token, statusTarget.id, newStatus);
      toast.success(
        newStatus
          ? `Compte de ${statusTarget.firstName} ${statusTarget.lastName} réactivé.`
          : `Compte de ${statusTarget.firstName} ${statusTarget.lastName} désactivé.`
      );
      setStatusTarget(null);
      loadUsers(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de modifier ce compte.");
    } finally {
      setSubmittingStatus(false);
    }
  }

  async function handleConfirmRoleChange() {
    if (!token || !roleTarget) return;
    setSubmittingRole(true);
    try {
      await patchAdminUserRole(token, roleTarget.user.id, roleTarget.newRole);
      toast.success(
        `${roleTarget.user.firstName} ${roleTarget.user.lastName} a désormais le rôle ${ROLE_LABEL[roleTarget.newRole]}.`
      );
      setRoleTarget(null);
      loadUsers(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de modifier le rôle de ce compte.");
    } finally {
      setSubmittingRole(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreateError(null);

    if (!createEmail || !createFirstName || !createLastName) {
      setCreateError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    if (createPassword.length < 8 || !/[A-Z]/.test(createPassword) || !/[0-9]/.test(createPassword)) {
      setCreateError("Le mot de passe doit faire au moins 8 caractères, avec 1 majuscule et 1 chiffre.");
      return;
    }

    setCreating(true);
    try {
      const created = await createAdminUser(token, {
        email: createEmail.trim(),
        password: createPassword,
        firstName: createFirstName.trim(),
        lastName: createLastName.trim(),
        role: createRole,
        district: createRole !== "admin" ? (createDistrict as (typeof DISTRICTS)[number]) : undefined,
      });
      toast.success(`Compte ${ROLE_LABEL[created.role]} créé pour ${created.firstName} ${created.lastName}.`);
      setCreateOpen(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateFirstName("");
      setCreateLastName("");
      setCreateRole("agent");
      loadUsers(1);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Impossible de créer ce compte.");
    } finally {
      setCreating(false);
    }
  }

  if (!user) return null;

  return (
    <DashboardLayout roles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
                <Users className="size-3.5" />
                Administration
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {total} compte{total > 1 ? "s" : ""}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Gestion des comptes</h1>
            <p className="text-sm text-muted-foreground">
              Citoyens, agents et administrateurs : recherche, création, rôle et activation (D08, D09).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUsers(page)}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Actualiser
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <UserPlus className="size-3.5" />
                  Créer un compte
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un compte agent ou citoyen</DialogTitle>
                  <DialogDescription>Le compte pourra se connecter immédiatement.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="createFirstName">Prénom</Label>
                      <Input
                        id="createFirstName"
                        placeholder="Ex: Elena, Marc…"
                        value={createFirstName}
                        onChange={(e) => setCreateFirstName(e.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="createLastName">Nom</Label>
                      <Input
                        id="createLastName"
                        placeholder="Ex: Vance, Dubois…"
                        value={createLastName}
                        onChange={(e) => setCreateLastName(e.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="createEmail">Email</Label>
                    <Input
                      id="createEmail"
                      type="email"
                      placeholder="nom.prenom@novaterra.sol"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="createPassword">Mot de passe provisoire</Label>
                    <PasswordInput
                      id="createPassword"
                      placeholder="Ex: NovaTerra2026! (8 car. min, 1 maj, 1 chiffre)"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="createRole">Rôle</Label>
                      <Select value={createRole} onValueChange={(v) => setCreateRole(v as Role)}>
                        <SelectTrigger id="createRole" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {createRole !== "admin" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="createDistrict">Quartier</Label>
                        <Select value={createDistrict} onValueChange={setCreateDistrict}>
                          <SelectTrigger id="createDistrict" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DISTRICTS.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  {createError && (
                    <p role="alert" className="text-xs text-destructive">
                      {createError}
                    </p>
                  )}
                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Création…" : "Créer le compte"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tous les comptes</CardTitle>
            <CardDescription className="text-xs">
              {debouncedSearch
                ? `Résultats pour « ${debouncedSearch} » (${total} trouvé${total > 1 ? "s" : ""})`
                : "Citoyens, agents et administrateurs de Nova Terra"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive py-4">{error}</p>}

            {!error && loading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {!error && !loading && users.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
                <Users className="size-8 mx-auto opacity-40" />
                <p>Aucun compte trouvé{debouncedSearch ? " pour cette recherche" : ""}.</p>
              </div>
            )}

            {!error && !loading && users.length > 0 && (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compte</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => {
                        const isSelf = u.id === user.id;
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              {u.firstName} {u.lastName}
                              {isSelf && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  Vous
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {u.email}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.role}
                                onValueChange={(v) => {
                                  if (v === u.role) return;
                                  setRoleTarget({ user: u, newRole: v as Role });
                                }}
                                disabled={isSelf}
                              >
                                <SelectTrigger className="h-8 w-[130px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {ROLE_LABEL[r]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {u.isActive ? (
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
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={u.isActive ? "outline" : "default"}
                                disabled={isSelf}
                                onClick={() => setStatusTarget(u)}
                                className={cn(
                                  "h-8 text-xs gap-1.5",
                                  u.isActive
                                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                    : "bg-success hover:bg-success/90 text-white"
                                )}
                              >
                                {u.isActive ? (
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
                          const prev = Math.max(1, page - 1);
                          loadUsers(prev);
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
                          const next = Math.min(totalPages, page + 1);
                          loadUsers(next);
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

        {/* Confirmation activation / désactivation */}
        <Dialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    statusTarget?.isActive ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
                  )}
                >
                  {statusTarget?.isActive ? <AlertTriangle className="size-5" /> : <UserCheck className="size-5" />}
                </div>
                <DialogTitle>
                  {statusTarget?.isActive ? "Confirmer la désactivation" : "Confirmer la réactivation"}
                </DialogTitle>
              </div>
              <DialogDescription className="pt-2 text-sm leading-relaxed">
                {statusTarget?.isActive ? (
                  <>
                    Désactiver le compte {ROLE_LABEL[statusTarget.role]} de{" "}
                    <strong className="text-foreground">
                      {statusTarget.firstName} {statusTarget.lastName}
                    </strong>{" "}
                    ({statusTarget.email}) ? Il ne pourra plus se connecter tant que le compte n&apos;est
                    pas réactivé.
                  </>
                ) : (
                  <>
                    Réactiver le compte de{" "}
                    <strong className="text-foreground">
                      {statusTarget?.firstName} {statusTarget?.lastName}
                    </strong>{" "}
                    ({statusTarget?.email}) ?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStatusTarget(null)} disabled={submittingStatus}>
                Annuler
              </Button>
              <Button
                variant={statusTarget?.isActive ? "destructive" : "default"}
                onClick={handleToggleStatus}
                disabled={submittingStatus}
                className={cn(!statusTarget?.isActive && "bg-success hover:bg-success/90 text-white")}
              >
                {submittingStatus
                  ? "Traitement…"
                  : statusTarget?.isActive
                  ? "Confirmer la désactivation"
                  : "Réactiver le compte"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation changement de rôle */}
        <Dialog open={!!roleTarget} onOpenChange={(open) => !open && setRoleTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <ShieldQuestion className="size-5" />
                </div>
                <DialogTitle>Confirmer le changement de rôle</DialogTitle>
              </div>
              <DialogDescription className="pt-2 text-sm leading-relaxed">
                Donner le rôle <strong className="text-foreground">{roleTarget && ROLE_LABEL[roleTarget.newRole]}</strong>{" "}
                à{" "}
                <strong className="text-foreground">
                  {roleTarget?.user.firstName} {roleTarget?.user.lastName}
                </strong>{" "}
                ({roleTarget?.user.email}) ? Ses accès changeront immédiatement à la prochaine page
                qu&apos;il chargera.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRoleTarget(null)} disabled={submittingRole}>
                Annuler
              </Button>
              <Button onClick={handleConfirmRoleChange} disabled={submittingRole}>
                {submittingRole ? "Traitement…" : "Confirmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
