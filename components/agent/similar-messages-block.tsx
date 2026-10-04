"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchSimilarMessages,
  type SimilarMessagesResponse,
  type SimilarMessageItem,
  type MessageStatus,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Layers, RefreshCw, AlertCircle, MapPin } from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { cn } from "@/lib/utils";

interface SimilarMessagesBlockProps {
  messageId: number | string;
  onSelectSimilar?: (similar: SimilarMessageItem) => void;
}

const STATUS_CONFIG: Record<MessageStatus, { label: string; badge: string }> = {
  nouveau: {
    label: "Nouveau",
    badge: "border-primary/40 text-primary bg-primary/10",
  },
  en_cours: {
    label: "En cours",
    badge: "text-muted-foreground bg-muted/40",
  },
  traite: {
    label: "Traité",
    badge: "border-success/40 text-success bg-success/10",
  },
};

export default function SimilarMessagesBlock({
  messageId,
  onSelectSimilar,
}: SimilarMessagesBlockProps) {
  const { token, user } = useAuth();
  const [data, setData] = useState<SimilarMessagesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.role === "agent" || user?.role === "admin";

  const load = () => {
    if (!token || !messageId || !isStaff) return;
    setLoading(true);
    setError(null);
    fetchSimilarMessages(token, messageId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [token, messageId, isStaff]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isStaff) return null;

  return (
    <Card className="border-primary/30 bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Layers className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span>Demandes similaires & Doublons potentiels</span>
                {data?.aiEnhanced && (
                  <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-[10px] gap-1 font-mono uppercase tracking-wider">
                    <Sparkles className="size-3 fill-primary/30" />
                    Analyse IA
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Détection automatique de signalements ou requêtes concordantes (F75).
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={load}
            disabled={loading}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground"
            title="Rafraîchir les correspondances"
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && (
          <div className="flex justify-center py-6" role="status">
            <LoadingSpinner size="sm" />
            <span className="sr-only">Analyse des similarités en cours…</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-3 rounded-lg border border-muted bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-muted-foreground/70" />
            <span>Aucune analyse de similarité disponible pour le moment ({error}).</span>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Explication synthétique de l'IA ou de l'algorithme */}
            {data.explanation && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground/90 flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-primary text-[11px] uppercase tracking-wider">
                    {data.aiEnhanced ? "Synthèse de l'Analyse IA" : "Constat de similarité"}
                  </strong>
                  <span>{data.explanation}</span>
                </div>
              </div>
            )}

            {/* Liste des demandes similaires */}
            {data.similarMessages.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground italic">
                Aucune autre demande similaire identifiée sur ce secteur ou cette thématique.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {data.similarMessages.map((similar) => {
                  const scorePercent = Math.round(similar.similarityScore * 100);
                  const st = STATUS_CONFIG[similar.status] || STATUS_CONFIG.nouveau;

                  return (
                    <div
                      key={similar.id}
                      className="group relative rounded-lg border border-border/80 bg-background/50 p-3 text-xs transition-colors hover:border-primary/40 hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">
                              {similar.reference}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", st.badge)}>
                              {st.label}
                            </Badge>
                            {similar.district && (
                              <span className="flex items-center gap-0.5 text-muted-foreground text-[11px]">
                                <MapPin className="size-3 text-muted-foreground/70" />
                                {similar.district}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-foreground text-xs">{similar.subject}</p>
                          <p className="text-muted-foreground text-[11px] line-clamp-2">
                            {similar.body}
                          </p>
                        </div>

                        {/* Badge de score de similarité */}
                        <div className="shrink-0 text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "font-mono font-bold text-[11px]",
                              scorePercent >= 80
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "text-muted-foreground"
                            )}
                            title={`Score de similarité : ${scorePercent}%`}
                          >
                            {scorePercent}% similaire
                          </Badge>
                          <span className="block text-[10px] text-muted-foreground/70 mt-1">
                            {new Date(similar.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      {onSelectSimilar && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectSimilar(similar)}
                            className="h-6 text-[11px] px-2"
                          >
                            Consulter ce dossier
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
