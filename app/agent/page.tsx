"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAgentDashboard,
  fetchAgentMessages,
  fetchWebcupRequests,
  patchMessageStatus,
  patchMessagePriority,
  replyAgentMessage,
  type AgentDashboard,
  type AgentMessage,
  type MessageStatus,
  type MessagePriority,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Radio, CheckCircle, Clock, RotateCw, RefreshCw, ThumbsUp, Calendar, Eye, MapPin, User, Send, MessageSquare, Flame } from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TargetedAccountsCard from "@/components/security/targeted-accounts-card";
import SimilarMessagesBlock from "@/components/agent/similar-messages-block";
import { PriorityBadge, getMessageEffectivePriority, isMedicalEmergencyMessage } from "@/components/ui/priority-badge";
import { ExportCsvButton, type CsvColumn } from "@/components/ui/export-csv-button";

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
  const [sort, setSort] = useState<"recent" | "supports" | "priority">("priority");
  const [priorityFilter, setPriorityFilter] = useState<MessagePriority | "all">("all");
  const [messages, setMessages] = useState<AgentMessage[] | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingPriorityId, setUpdatingPriorityId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AgentMessage | null>(null);

  // F84 : Réponse au citoyen
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

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
      sort: sort === "priority" ? "recent" : sort,
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

  // F80 : Changer la priorité d'une demande
  async function handleChangePriority(message: AgentMessage, newPriority: MessagePriority) {
    if (!token) return;
    setUpdatingPriorityId(message.id);
    try {
      await patchMessagePriority(token, message.id, newPriority, message.status);
      toast.success(`Priorité de ${message.reference} modifiée : ${newPriority}`);
      setMessages((prev) =>
        prev ? prev.map((m) => (m.id === message.id ? { ...m, priority: newPriority } : m)) : null
      );
      if (selectedMessage?.id === message.id) {
        setSelectedMessage((prev) => (prev ? { ...prev, priority: newPriority } : null));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de changer la priorité.");
    } finally {
      setUpdatingPriorityId(null);
    }
  }

  // F84 : Envoyer une réponse au citoyen
  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedMessage || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyAgentMessage(token, selectedMessage.id, replyText.trim());
      toast.success("Votre réponse a été transmise au citoyen et ajoutée à sa chronologie.");
      setReplyText("");
      loadMessages();
      // Mettre à jour l'historique du message sélectionné en local
      setSelectedMessage((prev) => {
        if (!prev) return null;
        const newHistory = [
          ...(prev.history || []),
          {
            id: Date.now(),
            status: prev.status,
            note: `Réponse de l'agent : ${replyText.trim()}`,
            changedAt: new Date().toISOString(),
            changedBy: { id: user?.id || "", firstName: user?.firstName || "", lastName: user?.lastName || "" },
          },
        ];
        return { ...prev, history: newHistory };
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer la réponse.");
    } finally {
      setSendingReply(false);
    }
  }

  if (!user) return null;

  const counts = dashboard?.messagesByStatus;
  const metrics = dashboard?.metrics;
  const pending = counts ? counts.nouveau + counts.en_cours : null;

  // Filtrage et Tri F80 + F86 :
  // - Les urgences médicales sont classées TOUT EN HAUT en priorité absolue
  // - Ordre de priorité : urgence médicale (4) > urgente (3) > haute (2) > normale (1) > basse (0)
  const priorityRank = (m: AgentMessage): number => {
    if (isMedicalEmergencyMessage(m)) return 4;
    const p = getMessageEffectivePriority(m);
    if (p === "urgente") return 3;
    if (p === "haute") return 2;
    if (p === "normale") return 1;
    return 0;
  };

  const filteredMessages = (messages ?? []).filter((m) => {
    if (priorityFilter === "all") return true;
    if (priorityFilter === "urgente") {
      return isMedicalEmergencyMessage(m) || getMessageEffectivePriority(m) === "urgente";
    }
    return getMessageEffectivePriority(m) === priorityFilter;
  });

  const displayedMessages = [...filteredMessages].sort((a, b) => {
    // Si tri par priorité (ou par défaut) : les urgences médicales et urgentes en tête absolue
    if (sort === "priority") {
      const rankDiff = priorityRank(b) - priorityRank(a);
      if (rankDiff !== 0) return rankDiff;
      // À priorité égale, les plus récents d'abord
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "supports") {
      // Les urgences médicales restent tout de même prioritaires en cas de crise
      if (isMedicalEmergencyMessage(a) && !isMedicalEmergencyMessage(b)) return -1;
      if (!isMedicalEmergencyMessage(a) && isMedicalEmergencyMessage(b)) return 1;
      return (b.supportCount ?? 0) - (a.supportCount ?? 0);
    }
    if (sort === "recent") {
      if (isMedicalEmergencyMessage(a) && !isMedicalEmergencyMessage(b)) return -1;
      if (!isMedicalEmergencyMessage(a) && isMedicalEmergencyMessage(b)) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // Colonnes d'export CSV pour les demandes agents (F88)
  const agentCsvColumns: CsvColumn<AgentMessage>[] = [
    { id: "reference", label: "Référence", getValue: (m) => m.reference },
    { id: "date", label: "Date de dépôt", getValue: (m) => new Date(m.createdAt).toLocaleString("fr-FR") },
    { id: "author", label: "Habitant", getValue: (m) => `${m.author.firstName} ${m.author.lastName}` },
    { id: "email", label: "Email habitant", getValue: (m) => m.author.email },
    { id: "type", label: "Type", getValue: (m) => m.type === "signalement" ? "Signalement" : "Question" },
    { id: "priority", label: "Priorité", getValue: (m) => isMedicalEmergencyMessage(m) ? "Urgence médicale" : getMessageEffectivePriority(m) },
    { id: "status", label: "Statut", getValue: (m) => STATUS_LABEL[m.status] },
    { id: "category", label: "Catégorie", getValue: (m) => m.category },
    { id: "district", label: "Quartier", getValue: (m) => m.district || "" },
    { id: "subject", label: "Objet", getValue: (m) => m.subject },
    { id: "body", label: "Description", getValue: (m) => m.body },
    { id: "supports", label: "Nombre de soutiens", getValue: (m) => m.supportCount ?? 0 },
  ];

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
                {/* Export CSV (F88) */}
                <ExportCsvButton
                  data={displayedMessages}
                  columns={agentCsvColumns}
                  filename="demandes-citoyens-agent"
                  buttonLabel="Exporter (CSV)"
                />

                {/* Filtre Priorité (F80, F86) */}
                <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as MessagePriority | "all")}>
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue placeholder="Toutes priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="urgente">Urgentes & Médicales</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sélecteur de tri (F50, F52, F80) */}
                <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
                  <Button
                    size="sm"
                    variant={sort === "priority" ? "default" : "ghost"}
                    onClick={() => setSort("priority")}
                    className="h-7 px-2 text-xs gap-1 font-semibold text-destructive"
                  >
                    <Flame className="size-3" />
                    Par priorité
                  </Button>
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
            {!messagesError && messages !== null && displayedMessages.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun message pour ces critères.
              </p>
            )}
            {!messagesError && messages !== null && displayedMessages.length > 0 && (
              <>
                {/* Cartes empilées sur mobile */}
                <div className="block space-y-3 sm:hidden">
                  {displayedMessages.map((m) => (
                    <Card
                      key={m.id}
                      className={cn(
                        isMedicalEmergencyMessage(m) && "border-destructive/60 bg-destructive/5"
                      )}
                    >
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs text-muted-foreground">{m.reference}</p>
                              <PriorityBadge message={m} />
                            </div>
                            <p className="font-medium mt-1">
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
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMessage(m)}
                            className="h-8 flex-1 gap-1 text-xs"
                          >
                            <Eye className="size-3.5 text-primary" />
                            Détail & Réponse
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeStatus(m)}
                            disabled={updatingId === m.id}
                            className="h-8 flex-1 gap-1.5 text-xs"
                          >
                            <span className={`size-2 rounded-full ${STATUS_DOT[m.status]}`} />
                            {STATUS_LABEL[m.status]}
                            <RotateCw className={`size-3 text-muted-foreground ml-1 ${updatingId === m.id ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Habitant</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Soutiens</TableHead>
                    <TableHead className="text-right">Statut & Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedMessages.map((m) => (
                    <TableRow
                      key={m.id}
                      className={cn(
                        isMedicalEmergencyMessage(m) && "bg-destructive/5 font-medium"
                      )}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {m.reference}
                        <div className="text-[10px]">
                          {new Date(m.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge message={m} />
                          <Select
                            value={getMessageEffectivePriority(m)}
                            onValueChange={(val) => handleChangePriority(m, val as MessagePriority)}
                            disabled={updatingPriorityId === m.id}
                          >
                            <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-muted focus:ring-0">
                              <span className="sr-only">Changer la priorité</span>
                            </SelectTrigger>
                            <SelectContent align="start">
                              <SelectItem value="urgente">Urgente</SelectItem>
                              <SelectItem value="haute">Haute</SelectItem>
                              <SelectItem value="normale">Normale</SelectItem>
                              <SelectItem value="basse">Basse</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMessage(m)}
                            className="h-8 px-2 text-xs gap-1"
                            title="Consulter le détail, répondre au citoyen et voir les similarités"
                          >
                            <Eye className="size-3.5 text-primary" />
                            <span className="hidden sm:inline">Détail & Répondre</span>
                          </Button>
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
                        </div>
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

      {/* Modale de détail d'une demande avec bloc Demandes similaires (F75) */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {selectedMessage?.reference}
              </span>
              {selectedMessage && (
                <PriorityBadge message={selectedMessage} />
              )}
              {selectedMessage && (
                <Badge variant="outline" className={cn("text-xs", STATUS_DOT[selectedMessage.status])}>
                  {STATUS_LABEL[selectedMessage.status]}
                </Badge>
              )}
              {selectedMessage?.type === "signalement" && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10 text-xs">
                  Signalement d&apos;incident
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg font-bold mt-2 text-foreground">
              {selectedMessage?.subject}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 pt-1">
              {selectedMessage?.author && (
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <User className="size-3.5 text-muted-foreground" />
                  {selectedMessage.author.firstName} {selectedMessage.author.lastName} ({selectedMessage.author.email})
                </span>
              )}
              {selectedMessage?.district && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {selectedMessage.district}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-5 pt-2">
              {/* Priorité modifiable & Statut */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Priorité de traitement :</span>
                  <Select
                    value={getMessageEffectivePriority(selectedMessage)}
                    onValueChange={(val) => handleChangePriority(selectedMessage, val as MessagePriority)}
                    disabled={updatingPriorityId === selectedMessage.id}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Changer statut :</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeStatus(selectedMessage)}
                    disabled={updatingId === selectedMessage.id}
                    className="h-7 text-xs gap-1.5"
                  >
                    <span className={`size-2 rounded-full ${STATUS_DOT[selectedMessage.status]}`} />
                    {STATUS_LABEL[selectedMessage.status]}
                    <RotateCw className={`size-3 text-muted-foreground ml-1 ${updatingId === selectedMessage.id ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {/* Corps de la demande */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Description du citoyen :
                </span>
                <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                  {selectedMessage.body}
                </p>
                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Catégorie : <strong className="text-foreground">{selectedMessage.category}</strong></span>
                  <span>Déposé le {new Date(selectedMessage.createdAt).toLocaleString("fr-FR")}</span>
                </div>
              </div>

              {/* F84 : Formulaire Répondre au citoyen */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Répondre au citoyen (F84)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Votre message sera directement consigné dans la chronologie de traitement accessible par l&apos;habitant.
                </p>
                <form onSubmit={handleSendReply} className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre réponse officielle à l'attention de l'administré..."
                    rows={3}
                    required
                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={sendingReply || !replyText.trim()}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Send className="size-3.5" />
                      {sendingReply ? "Envoi de la réponse…" : "Transmettre la réponse"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Historique / chronologie existante */}
              {selectedMessage.history && selectedMessage.history.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Historique des étapes et réponses :
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-border p-2 bg-muted/20">
                    {selectedMessage.history.map((h) => (
                      <div key={h.id} className="text-xs p-1.5 rounded border border-border/40 bg-background/60">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-semibold text-primary">{STATUS_LABEL[h.status]}</span>
                          <span>{new Date(h.changedAt).toLocaleString("fr-FR")}</span>
                        </div>
                        {h.note && <p className="mt-1 text-foreground whitespace-pre-wrap">{h.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bloc F75 : Demandes similaires & Analyse IA */}
              <SimilarMessagesBlock messageId={selectedMessage.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
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
