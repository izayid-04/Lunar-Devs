"use client";

import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  User,
  FileText,
  CheckCircle2,
  Send,
  Plus,
  Clock,
  PartyPopper,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchMyMessages,
  fetchMySecurity,
  postMessage,
  type CitizenMessage,
  type MessageStatus,
  type MySecurity,
} from "@/lib/api";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Habitant",
  agent: "Agent municipal",
  admin: "Administrateur",
};

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
  "Éclairage public",
  "Voirie",
  "Déchets & recyclage",
  "Transports",
  "État civil",
  "Autre",
];

const SUBJECT_MIN = 3;
const SUBJECT_MAX = 150;
const BODY_MIN = 10;
const BODY_MAX = 5000;

function EspaceContent() {
  const { user, token } = useAuth();

  const [messages, setMessages] = useState<CitizenMessage[] | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [security, setSecurity] = useState<MySecurity | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<CitizenMessage | null>(null);

  const loadMessages = useCallback(() => {
    if (!token) return;
    setMessages(null);
    setMessagesError(null);
    fetchMyMessages(token)
      .then(setMessages)
      .catch((err: Error) => setMessagesError(err.message));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => loadMessages());
  }, [loadMessages]);

  useEffect(() => {
    if (!token) return;
    Promise.resolve()
      .then(() => fetchMySecurity(token))
      .then(setSecurity)
      .catch((err: Error) => setSecurityError(err.message));
  }, [token]);

  if (!user) return null;

  if (messages === null && !messagesError) {
    return (
      <div
        role="status"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center"
      >
        <LoadingSpinner />
        <span className="sr-only">Chargement de votre espace…</span>
      </div>
    );
  }

  function resetForm() {
    setCategory(CATEGORIES[0]);
    setSubject("");
    setBody("");
    setConfirmation(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (subject.trim().length < SUBJECT_MIN || subject.trim().length > SUBJECT_MAX) {
      toast.error(`L'objet doit faire entre ${SUBJECT_MIN} et ${SUBJECT_MAX} caractères.`);
      return;
    }
    if (body.trim().length < BODY_MIN || body.trim().length > BODY_MAX) {
      toast.error(`Le message doit faire au moins ${BODY_MIN} caractères.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await postMessage(token, {
        subject: subject.trim(),
        body: body.trim(),
        category,
      });
      setConfirmation(created);
      loadMessages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer le message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>
            Mon espace — {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre profil et vos messages auprès des services municipaux.
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
              Nouveau message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {confirmation ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PartyPopper className="size-5 text-success" />
                    Message envoyé
                  </DialogTitle>
                  <DialogDescription>
                    Les services municipaux ont bien reçu votre message.
                  </DialogDescription>
                </DialogHeader>
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-lg border border-success/40 bg-success/10 p-4 text-center"
                >
                  <p className="text-xs text-muted-foreground">Référence</p>
                  <p className="font-mono text-lg font-semibold text-success">
                    {confirmation.reference}
                  </p>
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
                  <DialogTitle>Envoyer un message aux services municipaux</DialogTitle>
                  <DialogDescription>
                    Un agent prendra en charge votre demande.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    Tous les champs sont <span className="font-semibold text-foreground">obligatoires</span>.
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="category">
                      Catégorie <span className="text-muted-foreground font-normal">(obligatoire)</span>
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
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
                    <Label htmlFor="subject">
                      Objet <span className="text-muted-foreground font-normal">(obligatoire, 3-150 caractères)</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Ex : Lampadaire cassé rue des Étoiles"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={SUBJECT_MAX}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="body">
                      Message <span className="text-muted-foreground font-normal">(obligatoire, min. 10 caractères)</span>
                    </Label>
                    <textarea
                      id="body"
                      placeholder="Décrivez votre demande en détail…"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={BODY_MAX}
                      rows={4}
                      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" className="w-full gap-2" disabled={submitting}>
                      <Send className="size-4" />
                      {submitting ? "Envoi…" : "Envoyer"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  Mon profil
                </CardTitle>
                <CardDescription>Informations de votre compte.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Nom</span>
                <p className="text-base font-semibold">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="text-base font-semibold">{user.email}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Mes demandes
                </span>
                {messages && (
                  <span className="text-xs text-muted-foreground">
                    {messages.length} message{messages.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {messagesError && <p className="text-sm text-destructive">{messagesError}</p>}
              {messages && messages.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Vous n&apos;avez envoyé aucun message pour le moment.
                </p>
              )}
              {messages && messages.length > 0 && (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span className="font-mono">{m.reference}</span>
                          <span className="text-muted-foreground font-normal">• {m.subject}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(m.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className={STATUS_CLASS[m.status]}>
                        {STATUS_LABEL[m.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                Statut du compte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Compte actif depuis le{" "}
                {new Date(user.createdAt).toLocaleDateString("fr-FR")}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="size-4 text-primary" />
                Sécurité du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {securityError && <p className="text-xs text-destructive">{securityError}</p>}
              {!securityError && !security && (
                <p className="text-xs text-muted-foreground">Chargement…</p>
              )}
              {security && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Dernière connexion :{" "}
                    <span className="font-medium text-foreground">
                      {security.lastLoginAt
                        ? new Date(security.lastLoginAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "jamais enregistrée"}
                    </span>
                  </p>
                  {security.recentFailures.length > 0 ? (
                    <p className="text-xs text-destructive">
                      {security.recentFailures.length} tentative
                      {security.recentFailures.length > 1 ? "s" : ""} échouée
                      {security.recentFailures.length > 1 ? "s" : ""} récente
                      {security.recentFailures.length > 1 ? "s" : ""}.
                    </p>
                  ) : (
                    <p className="text-xs text-success">Aucune tentative échouée récente.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accès rapide</CardTitle>
              <CardDescription>Autres interfaces disponibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-xs" asChild>
                <a href="/dashboard">Vue d&apos;ensemble</a>
              </Button>
              {user.role !== "citizen" && (
                <Button variant="outline" className="w-full justify-start text-xs" asChild>
                  <a href={`/${user.role}`}>
                    Accéder au poste {user.role === "admin" ? "Admin" : "Agent"}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function EspacePage() {
  return (
    <DashboardLayout>
      <EspaceContent />
    </DashboardLayout>
  );
}
