"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import Link from "next/link";
import {
  User,
  FileText,
  CheckCircle2,
  Send,
  Plus,
  Clock,
  PartyPopper,
  ShieldAlert,
  CalendarCheck,
  MapPin,
  Download,
  X,
  Trash2,
  UserCog,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchMyMessages,
  fetchMySecurity,
  fetchMyPrivacyInquiries,
  fetchMyAppointments,
  cancelAppointment,
  downloadAppointmentIcs,
  patchMe,
  deleteMyAccount,
  postMessage,
  type CitizenMessage,
  type MessageStatus,
  type MessageType,
  type MySecurity,
  type PrivacyInquiry,
  type Appointment,
  type District,
} from "@/lib/api";
import { DISTRICTS } from "@/lib/alerts";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

// Catégories imposées par l'API pour un signalement d'incident (F25),
// différentes des catégories libres d'une simple question.
const SIGNALEMENT_CATEGORIES: { value: string; label: string }[] = [
  { value: "voirie", label: "Voirie" },
  { value: "eclairage", label: "Éclairage public" },
  { value: "propreté", label: "Propreté" },
  { value: "eau", label: "Eau" },
  { value: "autre", label: "Autre" },
];

const SUBJECT_MIN = 3;
const SUBJECT_MAX = 150;
const BODY_MIN = 10;
const BODY_MAX = 5000;

function EspaceContent() {
  const { user, token, logout, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<CitizenMessage[] | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [privacyInquiries, setPrivacyInquiries] = useState<PrivacyInquiry[] | null>(null);

  const [security, setSecurity] = useState<MySecurity | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>("question");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [signalementCategory, setSignalementCategory] = useState(SIGNALEMENT_CATEGORIES[0].value);
  const [district, setDistrict] = useState<District>(DISTRICTS[0]);
  const [preciseLocation, setPreciseLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<CitizenMessage | null>(null);

  // Complétion du profil (D12, F35)
  const [profileDistrict, setProfileDistrict] = useState<District>(DISTRICTS[0]);
  const [profileLanguage, setProfileLanguage] = useState("fr");
  const [profileVulnerable, setProfileVulnerable] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Suppression du compte (F33)
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadMessages = useCallback(() => {
    if (!token) return;
    setMessages(null);
    setMessagesError(null);
    fetchMyMessages(token)
      .then(setMessages)
      .catch((err: Error) => setMessagesError(err.message));
  }, [token]);

  const loadPrivacyInquiries = useCallback(() => {
    if (!token) return;
    fetchMyPrivacyInquiries(token)
      .then(setPrivacyInquiries)
      .catch(() => {});
  }, [token]);

  const loadAppointments = useCallback(() => {
    if (!token) return;
    fetchMyAppointments(token)
      .then(setAppointments)
      .catch((err: Error) => setAppointmentsError(err.message));
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadMessages();
      loadPrivacyInquiries();
      loadAppointments();
    });
  }, [loadMessages, loadPrivacyInquiries, loadAppointments]);

  useEffect(() => {
    if (!token) return;
    Promise.resolve()
      .then(() => fetchMySecurity(token))
      .then(setSecurity)
      .catch((err: Error) => setSecurityError(err.message));
  }, [token]);

  // Pré-remplissage depuis le bouton "Contacter ce service" d'une fiche service.
  useEffect(() => {
    const prefill = searchParams.get("sujet");
    if (prefill) {
      Promise.resolve().then(() => {
        setSubject(prefill.slice(0, SUBJECT_MAX));
        setDialogOpen(true);
      });
    }
  }, [searchParams]);

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
    setMessageType("question");
    setCategory(CATEGORIES[0]);
    setSignalementCategory(SIGNALEMENT_CATEGORIES[0].value);
    setDistrict(DISTRICTS[0]);
    setPreciseLocation("");
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
    if (messageType === "signalement" && preciseLocation.trim().length === 0) {
      toast.error("Merci de préciser l'emplacement exact de l'incident.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await postMessage(token, {
        type: messageType,
        subject: subject.trim(),
        body: body.trim(),
        category: messageType === "signalement" ? signalementCategory : category,
        ...(messageType === "signalement"
          ? { district, preciseLocation: preciseLocation.trim() }
          : {}),
      });
      setConfirmation(created);
      loadMessages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer le message.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelAppointment(id: number) {
    if (!token) return;
    setCancelingId(id);
    try {
      await cancelAppointment(token, id);
      toast.success("Rendez-vous annulé.");
      loadAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'annuler ce rendez-vous.");
    } finally {
      setCancelingId(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    try {
      await patchMe(token, {
        district: profileDistrict,
        preferredLanguage: profileLanguage.trim() || "fr",
        isVulnerable: profileVulnerable,
      });
      await refreshUser();
      toast.success("Profil complété, merci !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer votre profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    if (!token) return;
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError("Merci de saisir votre mot de passe.");
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount(token, deletePassword);
      toast.success("Votre compte a été supprimé.");
      logout();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Impossible de supprimer votre compte.");
    } finally {
      setDeleting(false);
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
                    <Label htmlFor="messageType">Type de demande</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        id="messageType"
                        variant={messageType === "question" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setMessageType("question")}
                      >
                        Question
                      </Button>
                      <Button
                        type="button"
                        variant={messageType === "signalement" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setMessageType("signalement")}
                      >
                        Signalement d&apos;incident
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category">
                      Catégorie <span className="text-muted-foreground font-normal">(obligatoire)</span>
                    </Label>
                    {messageType === "signalement" ? (
                      <Select value={signalementCategory} onValueChange={setSignalementCategory}>
                        <SelectTrigger id="category" className="w-full">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIGNALEMENT_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>

                  {messageType === "signalement" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="district">
                          Quartier <span className="text-muted-foreground font-normal">(obligatoire)</span>
                        </Label>
                        <Select value={district} onValueChange={(v) => setDistrict(v as District)}>
                          <SelectTrigger id="district" className="w-full">
                            <SelectValue placeholder="Sélectionner un quartier" />
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

                      <div className="space-y-1.5">
                        <Label htmlFor="preciseLocation">
                          Emplacement précis <span className="text-muted-foreground font-normal">(obligatoire)</span>
                        </Label>
                        <Input
                          id="preciseLocation"
                          placeholder="Ex : 12 avenue de la Mer, en face de la pharmacie"
                          value={preciseLocation}
                          onChange={(e) => setPreciseLocation(e.target.value)}
                          maxLength={255}
                        />
                      </div>
                    </>
                  )}

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

      {/* Complétion du profil (D12, F35) */}
      {!user.profileCompleted && (
        <Card className="mt-6 border-primary/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="size-4 text-primary" />
              Complétez votre profil
            </CardTitle>
            <CardDescription>
              Votre quartier et votre langue préférée permettent de mieux cibler les alertes et
              services qui vous concernent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="profileDistrict">Quartier</Label>
                <Select value={profileDistrict} onValueChange={(v) => setProfileDistrict(v as District)}>
                  <SelectTrigger id="profileDistrict" className="w-full">
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
              <div className="space-y-1.5">
                <Label htmlFor="profileLanguage">Langue préférée</Label>
                <Input
                  id="profileLanguage"
                  value={profileLanguage}
                  onChange={(e) => setProfileLanguage(e.target.value)}
                  placeholder="fr"
                  maxLength={50}
                />
              </div>
              <div className="flex items-center gap-2 sm:pb-2">
                <input
                  id="profileVulnerable"
                  type="checkbox"
                  checked={profileVulnerable}
                  onChange={(e) => setProfileVulnerable(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <Label htmlFor="profileVulnerable" className="text-xs font-normal">
                  Je souhaite être identifié comme personne vulnérable (priorité sur les alertes)
                </Label>
              </div>
              <Button type="submit" className="sm:col-span-3" disabled={savingProfile}>
                {savingProfile ? "Enregistrement…" : "Enregistrer mon profil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
                    <Link
                      key={m.id}
                      href={`/espace/demandes/${m.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-xs transition-colors hover:border-primary/40"
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={STATUS_CLASS[m.status]}>
                          {STATUS_LABEL[m.status]}
                        </Badge>
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mes rendez-vous (F39) */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarCheck className="size-4 text-primary" />
                  Mes rendez-vous
                </h3>
                {appointments && (
                  <span className="text-xs text-muted-foreground">
                    {appointments.length} rendez-vous
                  </span>
                )}
              </div>

              {appointmentsError && <p className="text-xs text-destructive">{appointmentsError}</p>}
              {!appointmentsError && appointments === null && (
                <p className="text-xs text-muted-foreground">Chargement…</p>
              )}
              {appointments && appointments.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Vous n&apos;avez aucun rendez-vous programmé. Prenez-en un depuis la fiche d&apos;un
                  service dans <Link href="/districts" className="text-primary underline">Services</Link>.
                </p>
              )}
              {appointments && appointments.length > 0 && (
                <div className="space-y-2">
                  {appointments.map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-lg border border-border p-3 text-xs ${a.status === "annule" ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {a.service?.name ?? "Service municipal"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            {new Date(a.startsAt).toLocaleString("fr-FR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                          {a.location && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="size-3" />
                              {a.location}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            a.status === "confirme"
                              ? "border-success/40 text-success bg-success/10 text-[10px]"
                              : "border-border text-muted-foreground text-[10px]"
                          }
                        >
                          {a.status === "confirme" ? "Confirmé" : "Annulé"}
                        </Badge>
                      </div>
                      {a.status === "confirme" && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => downloadAppointmentIcs(token!, a.id)}
                          >
                            <Download className="size-3.5" />
                            .ics
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                            disabled={cancelingId === a.id}
                            onClick={() => handleCancelAppointment(a.id)}
                          >
                            <X className="size-3.5" />
                            {cancelingId === a.id ? "Annulation…" : "Annuler"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demandes relatives aux données personnelles (F51) */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Mes demandes de données & RGPD
                </h3>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary">
                  <a href="/donnees-personnelles">Nouvelle demande ↗</a>
                </Button>
              </div>

              {privacyInquiries && privacyInquiries.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Aucune demande relative aux données personnelles en cours.
                </p>
              )}

              {privacyInquiries && privacyInquiries.length > 0 && (
                <div className="space-y-2">
                  {privacyInquiries.map((pi) => (
                    <div
                      key={pi.id}
                      className="rounded-lg border border-border p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-primary">{pi.reference}</span>
                        <Badge
                          variant="outline"
                          className={
                            pi.status === "traitee"
                              ? "border-success/40 text-success bg-success/10 text-[10px]"
                              : pi.status === "en_cours"
                              ? "border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px]"
                              : "border-primary/40 text-primary bg-primary/10 text-[10px]"
                          }
                        >
                          {pi.status === "traitee"
                            ? "Traitée"
                            : pi.status === "en_cours"
                            ? "En cours"
                            : "En attente"}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground">{pi.subject}</p>
                      {pi.responseNote && (
                        <div className="bg-success/5 border border-success/30 rounded p-2 text-[11px] text-foreground">
                          <span className="font-semibold text-success block">Réponse DPO :</span>
                          {pi.responseNote}
                        </div>
                      )}
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

          {/* Suppression de compte (F33) */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Trash2 className="size-4" />
                Supprimer mon compte
              </CardTitle>
              <CardDescription>
                Action définitive : vos messages, signalements et rendez-vous seront supprimés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog
                onOpenChange={(open) => {
                  if (!open) {
                    setDeletePassword("");
                    setDeleteError(null);
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2 text-xs">
                    <Trash2 className="size-3.5" />
                    Supprimer définitivement mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Saisissez votre mot de passe actuel pour
                      confirmer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-1.5">
                    <Label htmlFor="deletePassword">Mot de passe</Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAccount();
                      }}
                    >
                      {deleting ? "Suppression…" : "Supprimer mon compte"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
      <Suspense fallback={null}>
        <EspaceContent />
      </Suspense>
    </DashboardLayout>
  );
}
