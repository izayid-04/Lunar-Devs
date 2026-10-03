"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { postConsultationResponse, type Consultation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, PartyPopper, Edit3, Clock } from "lucide-react";
import { toast } from "sonner";

type StoredVote = { option: string; comment: string; reference: string };

function storageKey(consultationId: number): string {
  return `novaterra.consultationVote.${consultationId}`;
}

function loadStoredVote(consultationId: number): StoredVote | null {
  try {
    const raw = window.localStorage.getItem(storageKey(consultationId));
    return raw ? (JSON.parse(raw) as StoredVote) : null;
  } catch {
    return null;
  }
}

// Vote sur une consultation citoyenne (F65, F66). L'API ne renvoie pas le
// vote déjà déposé par le citoyen sur GET /projects/:id : on le mémorise
// localement (par navigateur) pour pré-remplir le formulaire et savoir
// s'il faut afficher les résultats (« après avoir répondu »).
export default function ConsultationVote({ consultation }: { consultation: Consultation }) {
  const { user, token } = useAuth();
  const [stored, setStored] = useState<StoredVote | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(consultation.aggregatedResults ?? null);
  const [totalResponses, setTotalResponses] = useState(consultation.totalResponses ?? 0);
  // Lazy initial state (appelé une seule fois) : évite d'appeler Date.now()
  // directement pendant le rendu (règle react-hooks/purity).
  const [nowRef] = useState(() => Date.now());

  useEffect(() => {
    Promise.resolve().then(() => {
      const v = loadStoredVote(consultation.id);
      setStored(v);
      if (v) {
        setSelectedOption(v.option);
        setComment(v.comment);
      }
    });
  }, [consultation.id]);

  const isClosed = new Date(consultation.endDate).getTime() <= nowRef;
  const hasVoted = !!stored;
  const showResults = isClosed || hasVoted;
  const showForm = !isClosed && (!hasVoted || editing);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedOption) return;
    setSubmitting(true);
    try {
      const result = await postConsultationResponse(token, consultation.id, {
        option: selectedOption,
        comment: comment.trim() || undefined,
      });
      const next: StoredVote = { option: selectedOption, comment: comment.trim(), reference: result.reference };
      window.localStorage.setItem(storageKey(consultation.id), JSON.stringify(next));
      setStored(next);
      setResults(result.aggregatedResults);
      setTotalResponses(result.totalResponses);
      setEditing(false);
      toast.success(`Avis enregistré — référence ${result.reference}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer votre avis.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-5">
        <div className="flex items-start gap-2">
          <Vote className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{consultation.question}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {isClosed
                ? "Consultation terminée"
                : `Ouverte jusqu'au ${new Date(consultation.endDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}`}
            </p>
          </div>
        </div>

        {hasVoted && !editing && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <PartyPopper className="size-4 text-success" />
              Vous avez répondu : <strong>{stored!.option}</strong>
            </span>
            {!isClosed && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditing(true)}>
                <Edit3 className="size-3.5" />
                Modifier
              </Button>
            )}
          </div>
        )}

        {!user && !isClosed && (
          <Button asChild variant="outline" className="mt-4 gap-2">
            <Link href="/connexion">Se connecter pour participer</Link>
          </Button>
        )}

        {user && user.role !== "citizen" && !showResults && (
          <p className="mt-4 text-xs text-muted-foreground">
            Seuls les citoyens peuvent participer à cette consultation.
          </p>
        )}

        {user && user.role === "citizen" && showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="space-y-2">
              {consultation.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors ${
                    selectedOption === opt ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`consultation-${consultation.id}`}
                    value={opt}
                    checked={selectedOption === opt}
                    onChange={() => setSelectedOption(opt)}
                    className="size-4 accent-primary"
                  />
                  {opt}
                </label>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Commentaire (facultatif)"
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!selectedOption || submitting}>
                {submitting ? "Envoi…" : hasVoted ? "Mettre à jour mon avis" : "Envoyer mon avis"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        )}

        {showResults && results && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Résultats ({totalResponses} réponse{totalResponses === 1 ? "" : "s"})
            </p>
            {consultation.options.map((opt) => {
              const count = results[opt] ?? 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              return (
                <div key={opt} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className={opt === stored?.option ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {opt}
                      {opt === stored?.option && " (votre choix)"}
                    </span>
                    <span className="text-muted-foreground">{count} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
