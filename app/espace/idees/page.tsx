"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { postIdea, fetchMyIdeas, type Idea, type IdeaStatus, type District } from "@/lib/api";
import { DISTRICTS } from "@/lib/alerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { Lightbulb, Plus, PartyPopper, MapPin, Send } from "lucide-react";
import { HoneypotField } from "@/components/ui/honeypot-field";
import { toast } from "sonner";

const STATUS_LABEL: Record<IdeaStatus, string> = {
  soumise: "Soumise",
  en_etude: "À l'étude",
  retenue: "Retenue",
  rejetee: "Rejetée",
};

const STATUS_CLASS: Record<IdeaStatus, string> = {
  soumise: "border-primary/40 text-primary bg-primary/10",
  en_etude: "border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400",
  retenue: "border-success/40 text-success bg-success/10",
  rejetee: "border-destructive/40 text-destructive bg-destructive/10",
};

const TITLE_MIN = 5;
const TITLE_MAX = 150;
const DESC_MIN = 20;
const DESC_MAX = 2000;

function IdeesContent() {
  const { token } = useAuth();
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState<District>(DISTRICTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Idea | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyIdeas(token)
      .then(setIdeas)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDistrict(DISTRICTS[0]);
    setConfirmation(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (title.trim().length < TITLE_MIN || title.trim().length > TITLE_MAX) {
      toast.error(`Le titre doit faire entre ${TITLE_MIN} et ${TITLE_MAX} caractères.`);
      return;
    }
    if (description.trim().length < DESC_MIN || description.trim().length > DESC_MAX) {
      toast.error(`La description doit faire au moins ${DESC_MIN} caractères.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await postIdea(token, {
        title: title.trim(),
        description: description.trim(),
        district,
      });
      setConfirmation(created);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer votre idée.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2">
            <Lightbulb className="size-6 text-primary" />
            Boîte à idées
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Proposez une idée pour améliorer Nova Terra et suivez son instruction par les services.
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Proposer une idée
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {confirmation ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PartyPopper className="size-5 text-success" />
                    Idée envoyée
                  </DialogTitle>
                  <DialogDescription>
                    Les services municipaux vont étudier votre proposition.
                  </DialogDescription>
                </DialogHeader>
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-lg border border-success/40 bg-success/10 p-4 text-center"
                >
                  <p className="text-xs text-muted-foreground">Référence</p>
                  <p className="font-mono text-lg font-semibold text-success">{confirmation.reference}</p>
                </div>
                <DialogFooter className="pt-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Fermer
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Proposer une idée</DialogTitle>
                  <DialogDescription>
                    Décrivez votre idée pour Nova Terra, un agent l&apos;étudiera.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaTitle">
                      Titre <span className="text-muted-foreground font-normal">(obligatoire)</span>
                    </Label>
                    <Input
                      id="ideaTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex : Bibliothèque d'outils partagés"
                      maxLength={TITLE_MAX}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaDescription">
                      Description <span className="text-muted-foreground font-normal">(obligatoire)</span>
                    </Label>
                    <textarea
                      id="ideaDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre idée en détail…"
                      rows={4}
                      maxLength={DESC_MAX}
                      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ideaDistrict">Quartier concerné</Label>
                    <Select value={district} onValueChange={(v) => setDistrict(v as District)}>
                      <SelectTrigger id="ideaDistrict" className="w-full">
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
                  <HoneypotField />
                  <DialogFooter className="pt-2">
                    <Button type="submit" className="w-full gap-2" disabled={submitting}>
                      <Send className="size-4" />
                      {submitting ? "Envoi…" : "Envoyer mon idée"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8">
        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && ideas === null && (
          <div role="status" className="flex justify-center py-12">
            <LoadingSpinner />
            <span className="sr-only">Chargement de vos idées…</span>
          </div>
        )}
        {!error && ideas !== null && ideas.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Vous n&apos;avez proposé aucune idée pour le moment.
          </p>
        )}

        <div className="space-y-3">
          {(ideas ?? []).map((idea) => (
            <Card key={idea.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{idea.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-3 text-xs">
                      <span className="font-mono">{idea.reference}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {idea.district}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={STATUS_CLASS[idea.status]}>
                    {STATUS_LABEL[idea.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{idea.description}</p>
                {idea.adminNote && (
                  <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                    <span className="font-semibold text-foreground">Réponse des services : </span>
                    {idea.adminNote}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IdeesPage() {
  return (
    <DashboardLayout roles={["citizen"]}>
      <IdeesContent />
    </DashboardLayout>
  );
}
