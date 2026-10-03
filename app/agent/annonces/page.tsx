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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const CATEGORIES = [
  { value: "annonce", label: "Municipal (Annonce)" },
  { value: "travaux", label: "Travaux" },
  { value: "service", label: "Service public" },
  { value: "sante", label: "Santé & Urgence" },
  { value: "evenement", label: "Événement" },
  { value: "autre", label: "Autre" },
];

function normalizeCategory(rawCat: string | undefined): string {
  if (!rawCat) return CATEGORIES[0].value;
  const lower = rawCat.toLowerCase().trim();
  const found = CATEGORIES.find(
    (c) => c.value === lower || c.label.toLowerCase().includes(lower)
  );
  return found ? found.value : CATEGORIES[0].value;
}

type Draft = { title: string; body: string; category: string; isImportant: boolean };
const EMPTY_DRAFT: Draft = { title: "", body: "", category: CATEGORIES[0].value, isImportant: false };

function AgentAnnoncesContent() {
  const { user, token } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

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
    setDraft({
      title: a.title,
      body: a.body,
      category: normalizeCategory(a.category),
      isImportant: !!a.isImportant,
    });
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

  async function confirmDelete() {
    if (!token || !announcementToDelete) return;
    const a = announcementToDelete;
    setDeletingId(a.id);
    try {
      await deleteAnnouncement(token, a.id);
      toast.success("Annonce supprimée.");
      setAnnouncementToDelete(null);
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
                      {a.isImportant && (
                        <Badge variant="destructive" className="text-[10px]">
                          Important
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{a.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(a)}
                      aria-label={`Modifier l'annonce ${a.title}`}
                      title="Modifier"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setAnnouncementToDelete(a)}
                      disabled={deletingId === a.id}
                      aria-label={`Supprimer l'annonce ${a.title}`}
                      title="Supprimer"
                    >
                      <Trash2 className="size-3.5 text-destructive" aria-hidden="true" />
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
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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
                placeholder="Ex. Maintenance des sas pressurisés du Dôme Alpha"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Contenu</Label>
              <textarea
                id="body"
                rows={4}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="Détaillez les informations, les consignes ou les horaires pour les résidents de Nova Terra..."
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isImportant"
                checked={draft.isImportant}
                onChange={(e) => setDraft((d) => ({ ...d, isImportant: e.target.checked }))}
                className="size-4 rounded border-input text-primary focus:ring-ring"
              />
              <Label htmlFor="isImportant" className="cursor-pointer text-sm font-medium">
                Annonce importante (diffuse une notification à tous les citoyens)
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Publier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!announcementToDelete}
        onOpenChange={(open) => {
          if (!open) setAnnouncementToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;annonce municipale{" "}
              <span className="font-semibold text-foreground">
                « {announcementToDelete?.title} »
              </span>{" "}
              ? Cette action est irréversible et retirera l&apos;annonce de la vue publique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deletingId !== null}
            >
              {deletingId ? "Suppression…" : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
