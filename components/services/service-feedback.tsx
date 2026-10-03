"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { postServiceFeedback, type Service } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, PartyPopper, Edit3 } from "lucide-react";
import { toast } from "sonner";

type StoredFeedback = { rating: number; comment: string; reference: string };

function storageKey(serviceId: number): string {
  return `novaterra.serviceFeedback.${serviceId}`;
}

function loadStored(serviceId: number): StoredFeedback | null {
  try {
    const raw = window.localStorage.getItem(storageKey(serviceId));
    return raw ? (JSON.parse(raw) as StoredFeedback) : null;
  } catch {
    return null;
  }
}

// Avis sur un service municipal (F76). GET /services ne renvoie pas la
// moyenne/le nombre d'avis ni l'avis déjà déposé par le citoyen : on
// mémorise localement (par navigateur) après envoi, et on n'affiche la
// moyenne que juste après une soumission (donnée réelle renvoyée par
// l'API à cet instant, jamais une valeur en cache présentée comme à jour).
export default function ServiceFeedback({ service }: { service: Service }) {
  const { user, token } = useAuth();
  const [stored, setStored] = useState<StoredFeedback | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ averageRating: number; totalFeedbacks: number } | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      const v = loadStored(service.id);
      setStored(v);
      if (v) {
        setRating(v.rating);
        setComment(v.comment);
      }
    });
  }, [service.id]);

  if (!user) {
    return (
      <Button asChild variant="outline" className="gap-2">
        <Link href="/connexion">
          <Star className="size-4" />
          Se connecter pour donner mon avis
        </Link>
      </Button>
    );
  }

  if (user.role !== "citizen") return null;

  const hasRated = !!stored;
  const showForm = !hasRated || editing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || rating < 1) return;
    setSubmitting(true);
    try {
      const result = await postServiceFeedback(token, service.id, {
        rating,
        comment: comment.trim() || undefined,
      });
      const next: StoredFeedback = { rating, comment: comment.trim(), reference: result.reference };
      window.localStorage.setItem(storageKey(service.id), JSON.stringify(next));
      setStored(next);
      setLastResult({ averageRating: result.averageRating, totalFeedbacks: result.totalFeedbacks });
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
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="size-4 text-primary" />
          Donner mon avis sur ce service
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lastResult && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
          >
            <PartyPopper className="size-4 text-success" />
            Merci ! Moyenne actuelle : <strong>{lastResult.averageRating.toFixed(1)} / 5</strong> sur{" "}
            {lastResult.totalFeedbacks} avis.
          </div>
        )}

        {hasRated && !editing && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <span className="flex items-center gap-1">
              Votre note :
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${i < stored!.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              ))}
            </span>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditing(true)}>
              <Edit3 className="size-3.5" />
              Modifier
            </Button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Note de 1 à 5 étoiles">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const filled = value <= (hoverRating || rating);
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(value)}
                    className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star className={`size-6 ${filled ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
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
              <Button type="submit" size="sm" disabled={rating < 1 || submitting}>
                {submitting ? "Envoi…" : hasRated ? "Mettre à jour mon avis" : "Envoyer mon avis"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
