"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  fetchMyMessage,
  toggleMessageSupport,
  type CitizenMessage,
  type MessageStatus,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { Clock, MapPin, ThumbsUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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

function DemandeContent() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const [message, setMessage] = useState<CitizenMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingSupport, setTogglingSupport] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyMessage(token, params.id)
      .then(setMessage)
      .catch((err: Error) => setError(err.message));
  }, [token, params.id]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  async function handleToggleSupport() {
    if (!token || !message) return;
    setTogglingSupport(true);
    try {
      const result = await toggleMessageSupport(token, message.id);
      setMessage({ ...message, supportCount: result.supportCount });
      toast.success(result.supported ? "Soutien enregistré." : "Soutien retiré.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer votre soutien.");
    } finally {
      setTogglingSupport(false);
    }
  }

  if (error) {
    return <p className="py-16 text-center text-sm text-destructive">{error}</p>;
  }

  if (!message) {
    return (
      <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <span className="sr-only">Chargement de la demande…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-primary">{message.reference}</span>
        <Badge variant="outline" className={STATUS_CLASS[message.status]}>
          {STATUS_LABEL[message.status]}
        </Badge>
        {message.type === "signalement" && (
          <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 gap-1">
            <AlertTriangle className="size-3" />
            Signalement
          </Badge>
        )}
      </div>

      <h1 className="mt-3">{message.subject}</h1>
      <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{message.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>Catégorie : {message.category}</span>
        {message.district && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {message.district}
            {message.preciseLocation ? ` — ${message.preciseLocation}` : ""}
          </span>
        )}
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          className="gap-2"
          disabled={togglingSupport}
          onClick={handleToggleSupport}
        >
          <ThumbsUp className="size-4" />
          Soutenir cette demande
          {typeof message.supportCount === "number" && (
            <span className="font-semibold">({message.supportCount})</span>
          )}
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Suivi du traitement</CardTitle>
        </CardHeader>
        <CardContent>
          {!message.history || message.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune étape enregistrée pour le moment.</p>
          ) : (
            <ol className="space-y-4">
              {message.history.map((step) => (
                <li key={step.id} className="flex gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {step.status === "traite" ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <Clock className="size-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${STATUS_CLASS[step.status]} text-[10px]`}>
                        {STATUS_LABEL[step.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(step.changedAt).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {step.note && <p className="mt-1 text-sm">{step.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DemandePage() {
  return (
    <DashboardLayout roles={["citizen"]}>
      <DemandeContent />
    </DashboardLayout>
  );
}
