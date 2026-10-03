"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  deleteAnnouncement,
  fetchAnnouncements,
  patchAnnouncement,
  postAnnouncement,
  type Announcement,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Municipal", "Travaux", "Événement", "Sécurité", "Autre"];

type Draft = { title: string; body: string; category: string };
const EMPTY_DRAFT: Draft = { title: "", body: "", category: CATEGORIES[0] };

function AgentAnnoncesContent() {
  const { user, token } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setAnnouncements(null);
    setError(null);
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  if (!user) return null;

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setDraft({ title: a.title, body: a.body, category: a.category });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (draft.title.trim().length < 3) {
      toast.error("Le titre doit faire au moins 3 caractères.");
      return;
    }
    if (draft.body.trim().length < 10) {
      toast.error("Le contenu doit faire au moins 10 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await patchAnnouncement(token, editing.id, draft);
        toast.success("Annonce modifiée.");
      } else {
        await postAnnouncement(token, draft);
        toast.success("Annonce publiée.");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer l'annonce.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(a: Announcement) {
    if (!token) return;
    setDeletingId(a.id);
    try {
      await deleteAnnouncement(token, a.id);
      toast.success("Annonce supprimée.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de supprimer l'annonce.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/agent">
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          </Button>
          <h1>Annonces municipales</h1>
          <p className="text-sm text-muted-foreground">
            Créer, modifier ou retirer une annonce publique.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Nouvelle annonce
        </Button>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              Toutes les annonces
            </CardTitle>
            <CardDescription>Visibles publiquement sur /annonces.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!error && announcements === null && (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
            {!error && announcements !== null && announcements.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune annonce pour le moment.
              </p>
            )}
            <div className="space-y-2">
              {announcements?.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {a.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{a.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(a)}
                      disabled={deletingId === a.id}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
            <DialogDescription>
              {editing ? "Les champs modifiés seront mis à jour." : "Publiée immédiatement."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={draft.category}
                onValueChange={(val) => setDraft((d) => ({ ...d, category: val }))}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Contenu</Label>
              <textarea
                id="body"
                rows={4}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Publier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AgentAnnoncesPage() {
  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <AgentAnnoncesContent />
    </DashboardLayout>
  );
}
