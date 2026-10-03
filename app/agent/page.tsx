"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentDashboard,
  fetchAgentMessages,
  fetchWebcupRequests,
  patchMessageStatus,
  type AgentDashboard,
  type AgentMessage,
  type MessageStatus,
  type WebcupRequestsResponse,
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
import { Radio, CheckCircle, Clock, RotateCw, RefreshCw, ThumbsUp, Calendar } from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TargetedAccountsCard from "@/components/security/targeted-accounts-card";

const STATUS_LABEL: Record<MessageStatus, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
};

const STATUS_DOT: Record<MessageStatus, string> = {
  nouveau: "bg-primary",
  en_cours: "bg-muted-foreground",
  traite: "bg-success",
};

const NEXT_STATUS: Record<MessageStatus, MessageStatus> = {
  nouveau: "en_cours",
  en_cours: "traite",
  traite: "nouveau",
};

const TABS: Array<MessageStatus | "all"> = ["all", "nouveau", "en_cours", "traite"];
const TAB_LABEL: Record<MessageStatus | "all", string> = {
  all: "Tous",
  nouveau: "Nouveaux",
  en_cours: "En cours",
  traite: "Traités",
};

// Forme réelle observée du payload Webcup (non garantie par contrat — API
// tierce). On affiche proprement si elle correspond, sinon on retombe sur
// le JSON brut plutôt que de planter.
type WebcupRequestItem = {
  id: number;
  request_code: string;
  requester_name: string;
  message_public: string;
  difficulty: string;
  xp_total: number;
  arrival_type: string;
  wave_number: number | null;
};

type WebcupPayload = {
  session: {
    is_running: boolean;
    current_wave: number;
    visible_requests_count: number;
    minutes_until_next_wave: number;
  };
  requests: WebcupRequestItem[];
};

function parseWebcupPayload(data: unknown): WebcupPayload | null {
  if (!data || typeof data !== "object") return null;
  const session = (data as Record<string, unknown>).session;
  const requests = (data as Record<string, unknown>).requests;
  if (!session || typeof session !== "object" || !Array.isArray(requests)) return null;
  return data as WebcupPayload;
}

function AgentContent() {
  const { user, token } = useAuth();

  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [tab, setTab] = useState<MessageStatus | "all">("all");
  const [sort, setSort] = useState<"recent" | "supports">("recent");
  const [messages, setMessages] = useState<AgentMessage[] | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [webcup, setWebcup] = useState<WebcupRequestsResponse | null>(null);
  const [webcupError, setWebcupError] = useState<string | null>(null);
  const [webcupLoading, setWebcupLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchAgentDashboard(token)
      .then(setDashboard)
      .catch((err: Error) => setDashboardError(err.message));
  }, [token]);

  const loadMessages = useCallback(() => {
    if (!token) return;
    setMessages(null);
    setMessagesError(null);
    fetchAgentMessages(token, {
      status: tab === "all" ? undefined : tab,
      sort,
    })
      .then((res) => {
        setMessages(res.messages);
        setDashboard((prev) => (prev ? { ...prev, messagesByStatus: res.counts } : prev));
      })
      .catch((err: Error) => setMessagesError(err.message));
  }, [token, tab, sort]);

  useEffect(() => {
    Promise.resolve().then(() => loadMessages());
  }, [loadMessages]);

  const loadWebcup = useCallback(() => {
    if (!token) return;
    setWebcupLoading(true);
    setWebcupError(null);
    fetchWebcupRequests(token)
      .then(setWebcup)
      .catch((err: Error) => setWebcupError(err.message))
      .finally(() => setWebcupLoading(false));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => loadWebcup());
  }, [loadWebcup]);

  async function changeStatus(message: AgentMessage) {
    if (!token) return;
    const next = NEXT_STATUS[message.status];
    setUpdatingId(message.id);
    try {
      await patchMessageStatus(token, message.id, next);
      toast.success(`${message.reference} → ${STATUS_LABEL[next]}`);
      loadMessages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de changer le statut.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!user) return null;

  const counts = dashboard?.messagesByStatus;
  const metrics = dashboard?.metrics;
  const pending = counts ? counts.nouveau + counts.en_cours : null;

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
              <Radio className="size-3" />
              Opérations municipales
            </Badge>
          </div>
          <h1 className="mt-1">Journal des demandes — Agent municipal</h1>
          <p className="text-sm text-muted-foreground">
            Suivi, traitement et indicateurs d&apos;activité des services de Nova Terra.
          </p>
        </div>

        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
          {pending === null ? "…" : pending} demande{pending === 1 ? "" : "s"} en attente
        </Badge>
      </div>

      {dashboardError && (
        <p className="mt-4 text-sm text-destructive">{dashboardError}</p>
      )}

      {/* Cartes métriques principales (F50) */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nouveaux</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-primary">{counts?.nouveau ?? "…"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">En attente de prise en charge</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">En cours</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <RotateCw className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-foreground">{counts?.en_cours ?? "…"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Dossiers en instruction</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Traités</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircle className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-success">{counts?.traite ?? "…"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Réponses transmises</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soutiens citoyens</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <ThumbsUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-amber-600">{metrics?.totalSupports ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Appuis enregistrés (F52)</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RDV à venir</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-blue-600">{metrics?.upcomingAppointmentsCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Créneaux réservés</p>
          </div>
        </Card>
      </div>

      {/* Indicateurs par catégorie et par quartier (F50) */}
      {metrics && (metrics.byCategory || metrics.byDistrict) && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {metrics.byCategory && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Signalements par catégorie</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {Object.values(metrics.byCategory).reduce((a, b) => a + b, 0)} total
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Répartition des signalements déposés par les habitants.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(metrics.byCategory).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune donnée disponible.</p>
                ) : (
                  Object.entries(metrics.byCategory).map(([cat, count]) => {
                    const total = Object.values(metrics.byCategory || {}).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium capitalize">{cat}</span>
                          <span className="text-muted-foreground font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {metrics.byDistrict && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Signalements par quartier</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {Object.values(metrics.byDistrict).reduce((a, b) => a + b, 0)} total
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Localisation géographique des incidents remontés.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(metrics.byDistrict).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune donnée disponible.</p>
                ) : (
                  Object.entries(metrics.byDistrict).map(([district, count]) => {
                    const total = Object.values(metrics.byDistrict || {}).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={district} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{district}</span>
                          <span className="text-muted-foreground font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Messages des habitants</CardTitle>
                <CardDescription>
                  Cliquez sur le statut d&apos;une ligne pour le faire progresser.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Sélecteur de tri (F50, F52) */}
                <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
                  <Button
                    size="sm"
                    variant={sort === "recent" ? "default" : "ghost"}
                    onClick={() => setSort("recent")}
                    className="h-7 px-2 text-xs"
                  >
                    Récents
                  </Button>
                  <Button
                    size="sm"
                    variant={sort === "supports" ? "default" : "ghost"}
                    onClick={() => setSort("supports")}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <ThumbsUp className="size-3" />
                    Plus soutenus
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/50 border border-border/60">
                  {TABS.map((t) => {
                    const isActive = tab === t;
                    return (
                      <Button
                        key={t}
                        size="sm"
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => setTab(t)}
                        className={cn(
                          "text-xs gap-1.5 h-8 font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        )}
                      >
                        {TAB_LABEL[t]}
                        {t !== "all" && counts && (
                          <Badge
                            variant={isActive ? "outline" : "secondary"}
                            className={cn(
                              "h-4 px-1.5 text-[10px]",
                              isActive && "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground"
                            )}
                          >
                            {counts[t]}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {messagesError && (
              <p className="text-sm text-destructive">{messagesError}</p>
            )}
            {!messagesError && messages === null && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
            {!messagesError && messages !== null && messages.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun message pour ce statut.
              </p>
            )}
            {!messagesError && messages !== null && messages.length > 0 && (
              <>
                {/* Cartes empilées sur mobile : un tableau large ne tient pas
                    sur un écran de téléphone sans défilement horizontal. */}
                <div className="block space-y-3 sm:hidden">
                  {messages.map((m) => (
                    <Card key={m.id}>
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{m.reference}</p>
                            <p className="font-medium">
                              {m.author.firstName} {m.author.lastName}
                            </p>
                          </div>
                          {typeof m.supportCount === "number" && m.supportCount > 0 && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <ThumbsUp className="size-3 text-amber-500" />
                              {m.supportCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          {m.type === "signalement" && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500/50 text-amber-600">
                              Signalement
                            </Badge>
                          )}
                          <span>{m.subject}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.category}
                          {m.district && ` · ${m.district}`}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeStatus(m)}
                          disabled={updatingId === m.id}
                          className="h-8 w-full gap-1.5 text-xs"
                        >
                          <span className={`size-2 rounded-full ${STATUS_DOT[m.status]}`} />
                          {STATUS_LABEL[m.status]}
                          <RotateCw className={`size-3 text-muted-foreground ml-1 ${updatingId === m.id ? "animate-spin" : ""}`} />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Habitant</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Soutiens</TableHead>
                    <TableHead className="text-right">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {m.reference}
                        <div className="text-[10px]">
                          {new Date(m.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.author.firstName} {m.author.lastName}
                      </TableCell>
                      <TableCell className="max-w-56 truncate">
                        <div className="flex items-center gap-1.5">
                          {m.type === "signalement" && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500/50 text-amber-600">
                              Signalement
                            </Badge>
                          )}
                          <span className="truncate">{m.subject}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.category}
                        {m.district && (
                          <span className="block text-[11px] text-muted-foreground/75">
                            {m.district}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof m.supportCount === "number" && m.supportCount > 0 ? (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <ThumbsUp className="size-3 text-amber-500" />
                            {m.supportCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => changeStatus(m)}
                          disabled={updatingId === m.id}
                          className="gap-1.5 h-8 px-2 text-xs"
                        >
                          <span className={`size-2 rounded-full ${STATUS_DOT[m.status]}`} />
                          {STATUS_LABEL[m.status]}
                          <RotateCw className={`size-3 text-muted-foreground ml-1 ${updatingId === m.id ? "animate-spin" : ""}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="size-4 text-primary" />
                  Flux Webcup
                </CardTitle>
                <CardDescription>
                  {webcup
                    ? webcup.cache.hit
                      ? `Depuis le cache (${webcup.cache.ageSeconds}s)`
                      : "Récupéré à l'instant"
                    : "Demandes en direct de l'événement Webcup."}
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={loadWebcup} disabled={webcupLoading} className="gap-1.5">
                <RefreshCw className={`size-3.5 ${webcupLoading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {webcupError && <p className="text-sm text-destructive">{webcupError}</p>}
            {!webcupError && webcupLoading && !webcup && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
            {!webcupError && webcup && (() => {
              const payload = parseWebcupPayload(webcup.data);
              if (!payload) {
                return (
                  <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs">
                    {JSON.stringify(webcup.data, null, 2)}
                  </pre>
                );
              }
              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <span>
                      Vague <strong className="text-foreground">{payload.session.current_wave}</strong>
                    </span>
                    <span>
                      <strong className="text-foreground">{payload.session.visible_requests_count}</strong> demandes visibles
                    </span>
                    {payload.session.is_running && (
                      <span>
                        Prochaine vague dans{" "}
                        <strong className="text-foreground">{payload.session.minutes_until_next_wave} min</strong>
                      </span>
                    )}
                  </div>
                  {/* Cartes empilées sur mobile : un tableau large ne tient pas
                      sur un écran de téléphone sans défilement horizontal. */}
                  <div className="block space-y-2 sm:hidden">
                    {payload.requests.map((r) => (
                      <Card key={r.id}>
                        <CardContent className="space-y-1.5 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs">{r.request_code}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {r.difficulty}
                              {r.wave_number !== null && ` • vague ${r.wave_number}`}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{r.requester_name}</p>
                          <p className="text-xs">{r.message_public}</p>
                          <p className="text-right font-mono text-xs text-muted-foreground">{r.xp_total} XP</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Difficulté</TableHead>
                        <TableHead className="text-right">XP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payload.requests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.request_code}</TableCell>
                          <TableCell className="text-muted-foreground">{r.requester_name}</TableCell>
                          <TableCell className="max-w-72 truncate">{r.message_public}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {r.difficulty}
                              {r.wave_number !== null && ` • vague ${r.wave_number}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{r.xp_total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <TargetedAccountsCard />
      </div>
    </>
  );
}

export default function AgentPage() {
  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <AgentContent />
    </DashboardLayout>
  );
}
