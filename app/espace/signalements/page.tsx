"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchPublicMessages,
  toggleMessageSupport,
  type CitizenMessage,
  type MessageStatus,
} from "@/lib/api";
import { DISTRICTS } from "@/lib/alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, ThumbsUp, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { BusyPlatformAlert } from "@/components/ui/busy-platform-alert";
import { PriorityBadge, getMessageEffectivePriority, isMedicalEmergencyMessage } from "@/components/ui/priority-badge";
import { ExportCsvButton } from "@/components/ui/export-csv-button";

const STATUS_LABEL: Record<MessageStatus, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
};

const STATUS_CLASS: Record<MessageStatus, string> = {
  nouveau: "border-primary/40 text-primary bg-primary/10",
  en_cours: "text-muted-foreground",
  traite: "border-success/40 text-success bg-success/10",
};

const CATEGORIES = [
  "Voirie",
  "Éclairage public",
  "Propreté",
  "Eau",
  "Autre",
];

function SignalementsContent() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<CitizenMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [district, setDistrict] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"supports" | "date_desc" | "date_asc">("supports");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setMessages(null);
    setError(null);
    fetchPublicMessages(token)
      .then((all) => setMessages(all))
      .catch((err: Error) => setError(err.message));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  async function handleToggleSupport(m: CitizenMessage) {
    if (!token || m.isMine) return;
    setTogglingId(m.id);
    try {
      const result = await toggleMessageSupport(token, m.id);
      setMessages(
        (prev) =>
          prev?.map((x) =>
            x.id === m.id ? { ...x, supportCount: result.supportCount, supportedByMe: result.supported } : x
          ) ?? null
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer votre soutien.");
    } finally {
      setTogglingId(null);
    }
  }

  // Filtre par quartier et par catégorie (F79)
  const filtered = (messages ?? []).filter((m) => {
    if (district !== "all" && m.district !== district) return false;
    if (category !== "all") {
      const normCat = m.category?.toLowerCase() ?? "";
      const selectedNorm = category.toLowerCase();
      if (normCat !== selectedNorm && !normCat.includes(selectedNorm) && !selectedNorm.includes(normCat)) {
        return false;
      }
    }
    return true;
  });

  // Tri (F79)
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "supports") {
      return (b.supportCount ?? 0) - (a.supportCount ?? 0);
    }
    if (sortBy === "date_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date_asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  // Extraction dynamique des catégories présentes ou liste standard
  const availableCategories = Array.from(
    new Set([
      ...CATEGORIES,
      ...(messages ?? []).map((m) => m.category).filter(Boolean),
    ])
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1>Signalements du quartier</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Soutenez les signalements d&apos;incident déposés par les autres habitants pour en accélérer le
        traitement.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les quartiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les quartiers</SelectItem>
            {DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {availableCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "supports" | "date_desc" | "date_asc")}>
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="supports">Plus soutenus d&apos;abord</SelectItem>
            <SelectItem value="date_desc">Plus récents d&apos;abord</SelectItem>
            <SelectItem value="date_asc">Plus anciens d&apos;abord</SelectItem>
          </SelectContent>
        </Select>

        <ExportCsvButton
          data={sorted}
          columns={[
            { id: "reference", label: "Référence", getValue: (m) => m.reference },
            { id: "date", label: "Date", getValue: (m) => new Date(m.createdAt).toLocaleDateString("fr-FR") },
            { id: "category", label: "Catégorie", getValue: (m) => m.category },
            { id: "district", label: "Quartier", getValue: (m) => m.district || "" },
            { id: "location", label: "Emplacement précis", getValue: (m) => m.preciseLocation || "" },
            { id: "priority", label: "Priorité", getValue: (m) => isMedicalEmergencyMessage(m) ? "Urgence médicale" : getMessageEffectivePriority(m) },
            { id: "status", label: "Statut", getValue: (m) => STATUS_LABEL[m.status] },
            { id: "subject", label: "Objet", getValue: (m) => m.subject },
            { id: "body", label: "Description", getValue: (m) => m.body },
            { id: "supports", label: "Soutiens", getValue: (m) => m.supportCount ?? 0 },
          ]}
          filename="signalements-quartier"
          buttonLabel="Exporter (CSV)"
        />
      </div>

      <div className="mt-6">
        {error && (
          <BusyPlatformAlert
            error={error}
            onRetry={() => {
              setError(null);
              load();
            }}
          />
        )}
        {!error && messages === null && (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner />
            <span className="sr-only">Chargement des signalements…</span>
          </div>
        )}
        {!error && messages !== null && sorted.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucun signalement à soutenir pour le moment.
          </p>
        )}

        <div className="space-y-3">
          {sorted.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{m.reference}</span>
                      <PriorityBadge message={m} />
                      <Badge variant="outline" className={STATUS_CLASS[m.status]}>
                        {STATUS_LABEL[m.status]}
                      </Badge>
                    </div>
                    <p className="mt-1.5 font-semibold text-foreground">{m.subject}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{m.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Catégorie : {m.category}</span>
                      {m.district && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {m.district}
                          {m.preciseLocation ? ` — ${m.preciseLocation}` : ""}
                        </span>
                      )}
                      <span>
                        {new Date(m.createdAt).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                      </span>
                    </div>
                  </div>

                  {m.isMine ? (
                    <div
                      className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground"
                      title="C'est votre signalement"
                    >
                      <Lock className="size-3.5" />
                      C&apos;est votre signalement
                    </div>
                  ) : (
                    <Button
                      variant={m.supportedByMe ? "default" : "outline"}
                      size="sm"
                      className="shrink-0 gap-1.5"
                      disabled={togglingId === m.id}
                      onClick={() => handleToggleSupport(m)}
                    >
                      <ThumbsUp className="size-3.5" />
                      {m.supportedByMe ? "Soutenu" : "Soutenir"}
                      <span className="font-semibold">({m.supportCount ?? 0})</span>
                    </Button>
                  )}
                </div>
                {m.type === "signalement" && (
                  <Badge variant="outline" className="mt-3 border-destructive/40 text-destructive bg-destructive/10 gap-1 text-[10px]">
                    <AlertTriangle className="size-3" />
                    Signalement d&apos;incident
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignalementsPage() {
  return (
    <DashboardLayout roles={["citizen"]}>
      <SignalementsContent />
    </DashboardLayout>
  );
}
