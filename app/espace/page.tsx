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
import { PasswordInput } from "@/components/ui/password-input";
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
  Edit3,
  Check,
  KeyRound,
  Lock,
  Printer,
  Compass,
  ListChecks,
  ThumbsUp,
  Lightbulb,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { HoneypotField } from "@/components/ui/honeypot-field";
import {
  changePassword,
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
import { printReceipt } from "@/lib/print-receipt";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { BusyPlatformAlert } from "@/components/ui/busy-platform-alert";
import { PriorityBadge, getMessageEffectivePriority, isMedicalEmergencyMessage } from "@/components/ui/priority-badge";
import { ExportCsvButton, type CsvColumn } from "@/components/ui/export-csv-button";
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

  // Filtres "Mes demandes" (F26, F80) — purement côté front, sur les données
  // déjà chargées via GET /messages/mine.
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [requestPriorityFilter, setRequestPriorityFilter] = useState<string>("all");
  const [requestSort, setRequestSort] = useState<string>("priority");

  const [privacyInquiries, setPrivacyInquiries] = useState<PrivacyInquiry[] | null>(null);

  const [security, setSecurity] = useState<MySecurity | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  // Lazy initial state (appelé une seule fois) : évite d'appeler Date.now()
  // directement pendant le rendu (règle react-hooks/purity).
  const [nowRef] = useState(() => Date.now());
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  // Étape 2 du guide de démarrage : aucune route API ne trace la
  // consultation de l'annuaire, donc on retient localement (par
  // navigateur) que le lien a bien été suivi, plutôt que de la compter
  // comme "faite" par défaut.
  const [visitedDirectory, setVisitedDirectory] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => {
      setVisitedDirectory(window.localStorage.getItem("novaterra.visitedDirectory") === "1");
    });
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>("question");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [signalementCategory, setSignalementCategory] = useState(SIGNALEMENT_CATEGORIES[0].value);
  const [district, setDistrict] = useState<District>(DISTRICTS[0]);
  const [preciseLocation, setPreciseLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isMedicalEmergency, setIsMedicalEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<CitizenMessage | null>(null);

  // Complétion du profil (D12, F35)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDistrict, setProfileDistrict] = useState<District>(DISTRICTS[0]);
  const [profileVulnerable, setProfileVulnerable] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Édition complète du profil (quartier, vulnérabilité)
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [editDistrict, setEditDistrict] = useState<District>(user?.district || DISTRICTS[0]);
  const [editVulnerable, setEditVulnerable] = useState(user?.isVulnerable || false);
  const [savingEditProfile, setSavingEditProfile] = useState(false);

  // Suppression du compte (F33)
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modification du mot de passe (D03, F37)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Les demandes, rendez-vous et inquiétudes RGPD sont des routes réservées
  // au rôle citoyen (403 pour agent/admin) — on ne les appelle ni ne les
  // affiche pour les autres rôles.
  const isCitizen = user?.role === "citizen";

  const loadMessages = useCallback(() => {
    if (!token || !isCitizen) return;
    setMessages(null);
    setMessagesError(null);
    fetchMyMessages(token)
      .then(setMessages)
      .catch((err: Error) => setMessagesError(err.message));
  }, [token, isCitizen]);

  const loadPrivacyInquiries = useCallback(() => {
    if (!token || !isCitizen) return;
    fetchMyPrivacyInquiries(token)
      .then(setPrivacyInquiries)
      .catch(() => {});
  }, [token, isCitizen]);

  const loadAppointments = useCallback(() => {
    if (!token || !isCitizen) return;
    fetchMyAppointments(token)
      .then(setAppointments)
      .catch((err: Error) => setAppointmentsError(err.message));
  }, [token, isCitizen]);

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
    if (prefill && isCitizen) {
      Promise.resolve().then(() => {
        setSubject(prefill.slice(0, SUBJECT_MAX));
        setDialogOpen(true);
      });
    }
  }, [searchParams, isCitizen]);

  if (!user) return null;

  if (isCitizen && messages === null && !messagesError) {
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
    setIsMedicalEmergency(false);
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
      const finalSubject = isMedicalEmergency && !subject.trim().startsWith("[URGENCE]")
        ? `[URGENCE MÉDICALE] ${subject.trim()}`.slice(0, SUBJECT_MAX)
        : subject.trim();

      const created = await postMessage(token, {
        type: messageType,
        subject: finalSubject,
        body: body.trim(),
        category: isMedicalEmergency ? "Santé & Urgences" : (messageType === "signalement" ? signalementCategory : category),
        isMedicalEmergency: isMedicalEmergency ? true : undefined,
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
      setAppointmentToCancel(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    try {
      await patchMe(token, {
        district: profileDistrict,
        isVulnerable: profileVulnerable,
      });
      await refreshUser();
      toast.success("Profil complété, merci !");
      setProfileDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer votre profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveEditProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingEditProfile(true);
    try {
      await patchMe(token, {
        district: editDistrict,
        isVulnerable: editVulnerable,
      });
      await refreshUser();
      toast.success("Vos modifications de profil ont été enregistrées !");
      setEditProfileDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de mettre à jour votre profil.");
    } finally {
      setSavingEditProfile(false);
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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Veuillez renseigner votre mot de passe actuel.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError("Le nouveau mot de passe doit comporter entre 8 et 72 caractères.");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 1 lettre majuscule.");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 1 chiffre.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("Le nouveau mot de passe doit être différent du mot de passe actuel.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await changePassword(token, {
        currentPassword,
        newPassword,
      });
      toast.success(res.message || "Mot de passe modifié avec succès !");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordError(null);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Impossible de modifier votre mot de passe.");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  // F56 : Récapitulatif de mes demandes (imprimable / PDF)
  function handlePrintRequestsSummary() {
    if (!messages) return;

    const total = messages.length;
    const countNouveau = messages.filter((m) => m.status === "nouveau").length;
    const countEnCours = messages.filter((m) => m.status === "en_cours").length;
    const countTraite = messages.filter((m) => m.status === "traite").length;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Veuillez autoriser les fenêtres pop-up pour imprimer le récapitulatif.");
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Récapitulatif des démarches — ${user?.firstName} ${user?.lastName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #ea580c; }
    .header-info { font-size: 13px; color: #666; margin-bottom: 24px; border-bottom: 2px solid #eee; padding-bottom: 12px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-num { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #f4f4f5; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-nouveau { background: #eff6ff; color: #2563eb; }
    .badge-en_cours { background: #fffbeb; color: #d97706; }
    .badge-traite { background: #f0fdf4; color: #16a34a; }
    .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { button { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Nova Terra — Récapitulatif officiel de mes demandes</h1>
  <div class="header-info">
    <strong>Citoyen :</strong> ${user?.firstName} ${user?.lastName} (${user?.email})<br />
    <strong>Quartier :</strong> ${user?.district || "Non assigné"} | <strong>Généré le :</strong> ${new Date().toLocaleString("fr-FR")}
  </div>

  <div class="stats">
    <div class="stat-box">
      <div class="stat-num">${total}</div>
      <div class="stat-label">Total Démarches</div>
    </div>
    <div class="stat-box">
      <div class="stat-num" style="color:#2563eb;">${countNouveau}</div>
      <div class="stat-label">Nouvelles</div>
    </div>
    <div class="stat-box">
      <div class="stat-num" style="color:#d97706;">${countEnCours}</div>
      <div class="stat-label">En cours</div>
    </div>
    <div class="stat-box">
      <div class="stat-num" style="color:#16a34a;">${countTraite}</div>
      <div class="stat-label">Traitées</div>
    </div>
  </div>

  <h3>Registre des demandes déposées</h3>
  <table>
    <thead>
      <tr>
        <th>Réf.</th>
        <th>Date</th>
        <th>Type & Catégorie</th>
        <th>Objet</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${messages.map((m) => `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${m.reference}</td>
          <td>${new Date(m.createdAt).toLocaleDateString("fr-FR")}</td>
          <td>${m.type === "signalement" ? "Signalement" : "Question"} (${m.category})</td>
          <td><strong>${m.subject}</strong><br/><span style="color:#555;">${m.body.slice(0, 90)}${m.body.length > 90 ? "…" : ""}</span></td>
          <td>
            <span class="badge badge-${m.status}">
              ${m.status === "traite" ? "Traitée" : m.status === "en_cours" ? "En cours" : "Nouvelle"}
            </span>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    Document délivré par les services numériques de Nova Terra • Destination des démarches administratives.
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  // F55 : Télécharger mes données personnelles (profil, demandes, RDV, RGPD, connexions)
  function handleExportUserData() {
    const report = `# DOSSIER CITOYEN PERSONNEL — NOVA TERRA
Généré le : ${new Date().toLocaleString("fr-FR")}
Source officielle : Services Municipaux de la Colonie Nova Terra (F55)

================================================================================
1. PROFIL DE L'HABITANT
================================================================================
Identifiant   : ${user?.id}
Nom & Prénom  : ${user?.lastName?.toUpperCase()}, ${user?.firstName}
Email         : ${user?.email}
Rôle          : ${user?.role}
Quartier      : ${user?.district || "Non assigné"}
Langue        : ${user?.preferredLanguage === "en" ? "Anglais (EN)" : "Français (FR)"}
Vulnérabilité : ${user?.isVulnerable ? "OUI (Priorité d'assistance & alertes ciblées)" : "Non"}
Date de compte: ${new Date(user?.createdAt || "").toLocaleString("fr-FR")}

================================================================================
2. SÉCURITÉ & CONNEXIONS (F37)
================================================================================
Dernière connexion enregistrée : ${security?.lastLoginAt ? new Date(security.lastLoginAt).toLocaleString("fr-FR") : "Aucune"}
Échecs de connexion récents    : ${security?.recentFailures?.length || 0} tentative(s)
${(security?.recentFailures || [])
  .map(
    (f, i) =>
      `  [${i + 1}] Date: ${new Date(f.date).toLocaleString("fr-FR")} | IP: ${f.ip || "Non renseignée"}`
  )
  .join("\n")}

================================================================================
3. REGISTRE DES DÉMARCHES & SIGNALEMENTS (${messages?.length || 0}) (F22, F25)
================================================================================
${(messages || [])
  .map(
    (m, i) =>
      `--------------------------------------------------------------------------------
Demande #${i + 1}
Référence  : ${m.reference}
Type       : ${m.type === "signalement" ? "Signalement d'incident" : "Question citoyenne"}
Catégorie  : ${m.category}
Statut     : ${m.status.toUpperCase()}
Date       : ${new Date(m.createdAt).toLocaleString("fr-FR")}
${m.district ? `Quartier   : ${m.district}\n` : ""}${m.preciseLocation ? `Lieu exact : ${m.preciseLocation}\n` : ""}Objet      : ${m.subject}
Description:
${m.body}
`
  )
  .join("\n")}

================================================================================
4. RENDEZ-VOUS MUNICIPAUX (${appointments?.length || 0}) (F39)
================================================================================
${(appointments || [])
  .map(
    (a, i) =>
      `--------------------------------------------------------------------------------
Rendez-vous #${i + 1}
Service : ${a.service?.name || "Service municipal"}
Statut  : ${a.status === "confirme" ? "CONFIRMÉ" : "ANNULÉ"}
Créneau : ${new Date(a.startsAt).toLocaleString("fr-FR")}
Lieu    : ${a.location || "Standard municipal"}
Motif   : ${a.reason || "Audience municipale"}
Pièces  : ${a.requiredDocuments || "Aucune pièce spécifique demandée"}
`
  )
  .join("\n")}

================================================================================
5. REQUÊTES RGPD & DONNÉES PERSONNELLES (${privacyInquiries?.length || 0}) (F51)
================================================================================
${(privacyInquiries || [])
  .map(
    (pi, i) =>
      `--------------------------------------------------------------------------------
Requête #${i + 1}
Référence : ${pi.reference}
Objet     : ${pi.subject}
Statut    : ${pi.status.toUpperCase()}
Date      : ${new Date(pi.createdAt).toLocaleString("fr-FR")}
Contenu   : ${pi.description}
${pi.responseNote ? `Réponse DPO : ${pi.responseNote}\n` : ""}
`
  )
  .join("\n")}

================================================================================
FIN DU DOSSIER PERSONNEL DE DONNÉES
Ce document regroupe l'intégralité de vos informations selon le Règlement Général
sur la Protection des Données et les protocoles de transparence de Nova Terra.
`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mes-donnees-nova-terra-${user?.firstName?.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Dossier complet de données téléchargé avec succès.");
  }

  const citizenPriorityRank = (m: CitizenMessage): number => {
    if (isMedicalEmergencyMessage(m)) return 4;
    const p = getMessageEffectivePriority(m);
    if (p === "urgente") return 3;
    if (p === "haute") return 2;
    if (p === "normale") return 1;
    return 0;
  };

  const filteredMessages = (messages ?? [])
    .filter((m) => {
      if (requestStatusFilter !== "all" && m.status !== requestStatusFilter) return false;
      if (requestTypeFilter !== "all" && (m.type ?? "question") !== requestTypeFilter) return false;
      if (requestPriorityFilter !== "all") {
        if (requestPriorityFilter === "urgente") {
          if (!isMedicalEmergencyMessage(m) && getMessageEffectivePriority(m) !== "urgente") return false;
        } else if (getMessageEffectivePriority(m) !== requestPriorityFilter) {
          return false;
        }
      }
      const q = requestSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        m.reference.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (requestSort === "priority") {
        const diff = citizenPriorityRank(b) - citizenPriorityRank(a);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (requestSort === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (requestSort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

  const requestFiltersActive =
    requestSearch.trim() !== "" ||
    requestStatusFilter !== "all" ||
    requestTypeFilter !== "all" ||
    requestPriorityFilter !== "all" ||
    requestSort !== "priority";

  // Colonnes CSV pour mes démarches (F88)
  const citizenMessagesCsvColumns: CsvColumn<CitizenMessage>[] = [
    { id: "reference", label: "Référence", getValue: (m) => m.reference },
    { id: "date", label: "Date de dépôt", getValue: (m) => new Date(m.createdAt).toLocaleString("fr-FR") },
    { id: "type", label: "Type", getValue: (m) => m.type === "signalement" ? "Signalement" : "Question" },
    { id: "priority", label: "Priorité", getValue: (m) => isMedicalEmergencyMessage(m) ? "Urgence médicale" : getMessageEffectivePriority(m) },
    { id: "status", label: "Statut", getValue: (m) => STATUS_LABEL[m.status] },
    { id: "category", label: "Catégorie", getValue: (m) => m.category },
    { id: "district", label: "Quartier", getValue: (m) => m.district || "" },
    { id: "subject", label: "Objet", getValue: (m) => m.subject },
    { id: "body", label: "Message", getValue: (m) => m.body },
  ];

  // Colonnes CSV pour mes rendez-vous (F88)
  const citizenAppointmentsCsvColumns: CsvColumn<Appointment>[] = [
    { id: "service", label: "Service", getValue: (a) => a.service?.name || "Service municipal" },
    { id: "date", label: "Date & Heure", getValue: (a) => a.startsAt ? new Date(a.startsAt).toLocaleString("fr-FR") : "" },
    { id: "agent", label: "Agent instructeur", getValue: (a) => a.agent ? `${a.agent.firstName} ${a.agent.lastName}` : "Non assigné" },
    { id: "status", label: "Statut", getValue: (a) => a.status === "confirme" ? "Confirmé" : "Annulé" },
    { id: "reason", label: "Motif", getValue: (a) => a.reason || "" },
  ];

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>
            Mon espace — {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCitizen
              ? "Votre profil et vos messages auprès des services municipaux."
              : "Votre profil et les paramètres de votre compte."}
          </p>
        </div>

        {isCitizen && (
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => printReceipt(confirmation)}
                >
                  <Download className="size-4" />
                  Télécharger l&apos;accusé de réception
                </Button>
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link
                    href={`/espace/demandes/${confirmation.id}`}
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Voir ma demande
                  </Link>
                </Button>
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
                      <p
                        role="note"
                        className="rounded-md border border-primary/30 bg-primary/5 p-2.5 text-xs text-muted-foreground"
                      >
                        Votre signalement sera visible par les autres habitants, sans votre nom.
                        N&apos;y indiquez pas d&apos;informations personnelles.
                      </p>
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

                  {/* F86 : Case Urgence médicale */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={isMedicalEmergency}
                        onChange={(e) => setIsMedicalEmergency(e.target.checked)}
                        className="size-4 rounded border-input text-destructive accent-destructive"
                      />
                      <span className="flex items-center gap-1.5 text-destructive font-semibold">
                        <AlertTriangle className="size-4 shrink-0" />
                        Urgence médicale
                      </span>
                    </label>

                    {isMedicalEmergency && (
                      <div
                        role="alert"
                        aria-live="assertive"
                        className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive space-y-2 animate-in fade-in-50"
                      >
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <Phone className="size-4 shrink-0" />
                          Appelez d&apos;abord les secours avant toute démarche en ligne !
                        </div>
                        <p className="leading-relaxed">
                          Ce formulaire ne remplace pas une intervention d&apos;urgence vitale. Pour tout secours immédiat :
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1 font-mono font-bold text-foreground">
                          <span className="rounded bg-background px-2 py-0.5 border border-border">15 (SAMU)</span>
                          <span className="rounded bg-background px-2 py-0.5 border border-border">112 (Urgences EU)</span>
                          <span className="rounded bg-background px-2 py-0.5 border border-border">18 (Pompiers)</span>
                          <span className="rounded bg-background px-2 py-0.5 border border-border">911 (Nova Terra)</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground pt-1">
                          En validant ce formulaire, votre demande sera traitée en priorité absolue par la régulation municipale.
                        </p>
                      </div>
                    )}
                  </div>

                  <HoneypotField />

                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      variant={isMedicalEmergency ? "destructive" : "default"}
                      className="w-full gap-2"
                      disabled={submitting}
                    >
                      <Send className="size-4" />
                      {submitting ? "Envoi…" : isMedicalEmergency ? "Envoyer en urgence prioritaire" : "Envoyer"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Complétion du profil (D12, F35) */}
      {!user.profileCompleted && (
        <Card className="mt-6 border-primary/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2.5">
              <UserCog className="size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Complétez votre profil</p>
                <p className="text-xs text-muted-foreground">
                  Quartier et langue préférée, pour mieux cibler ce qui vous concerne.
                </p>
              </div>
            </div>
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Compléter mon profil</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Compléter votre profil</DialogTitle>
                  <DialogDescription>
                    Votre quartier et votre langue préférée permettent de mieux cibler les alertes
                    et services qui vous concernent.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveProfile} className="space-y-4">
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
                  <div className="flex items-center gap-2">
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
                  <DialogFooter>
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? "Enregistrement…" : "Enregistrer mon profil"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Liste de démarrage pour un nouveau citoyen (D12, F35) */}
      {isCitizen && (
        <Card className="mt-6 border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-bold">
                    Guide de démarrage du nouveau citoyen
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Accomplissez ces 3 étapes essentielles pour profiter pleinement des services de Nova Terra.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                {[user.profileCompleted, visitedDirectory, Boolean(messages && messages.length > 0)].filter(Boolean).length} / 3 terminées
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Étape 1 : Compléter son profil */}
              <div
                className={`flex flex-col justify-between p-3.5 rounded-lg border transition-all ${
                  user.profileCompleted
                    ? "border-success/40 bg-success/5"
                    : "border-primary/40 bg-primary/5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Étape 1
                    </span>
                    {user.profileCompleted ? (
                      <Badge variant="outline" className="border-success/40 text-success bg-success/10 text-[10px] gap-1">
                        <Check className="size-3" />
                        Complété
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px]">
                        À faire
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">Compléter mon profil</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Indiquez votre quartier et votre langue pour adapter vos alertes et services.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/60">
                  {user.profileCompleted ? (
                    <span className="text-xs text-success font-medium flex items-center gap-1.5">
                      <Check className="size-3.5" />
                      Quartier : {user.district}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => setProfileDialogOpen(true)}
                    >
                      <UserCog className="size-3.5" />
                      Renseigner mon profil
                    </Button>
                  )}
                </div>
              </div>

              {/* Étape 2 : Explorer l'annuaire des services */}
              <div
                className={`flex flex-col justify-between p-3.5 rounded-lg border transition-all ${
                  visitedDirectory ? "border-success/40 bg-success/5" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Étape 2
                    </span>
                    {visitedDirectory ? (
                      <Badge variant="outline" className="border-success/40 text-success bg-success/10 text-[10px] gap-1">
                        <Check className="size-3" />
                        Visité
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                        À faire
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">Trouver un service municipal</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Découvrez les 5 quartiers, leurs équipements et les créneaux de rendez-vous.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/60">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5"
                    onClick={() => {
                      window.localStorage.setItem("novaterra.visitedDirectory", "1");
                      setVisitedDirectory(true);
                    }}
                  >
                    <Link href="/districts">
                      <Compass className="size-3.5 text-primary" />
                      {visitedDirectory ? "Revoir l'annuaire ↗" : "Consulter l'annuaire ↗"}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Étape 3 : Envoyer une première demande */}
              <div
                className={`flex flex-col justify-between p-3.5 rounded-lg border transition-all ${
                  messages && messages.length > 0
                    ? "border-success/40 bg-success/5"
                    : "border-border bg-card"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Étape 3
                    </span>
                    {messages && messages.length > 0 ? (
                      <Badge variant="outline" className="border-success/40 text-success bg-success/10 text-[10px] gap-1">
                        <Check className="size-3" />
                        Envoyée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                        À faire
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">Déposer une demande ou un signalement</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Posez une question à la mairie ou signalez un incident sur la voirie.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/60">
                  {messages && messages.length > 0 ? (
                    <span className="text-xs text-success font-medium flex items-center gap-1.5">
                      <Check className="size-3.5" />
                      {messages.length} démarche{messages.length > 1 ? "s" : ""} en cours
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => {
                        resetForm();
                        setDialogOpen(true);
                      }}
                    >
                      <Send className="size-3.5 text-primary" />
                      Déposer une demande
                    </Button>
                  )}
                </div>
              </div>
            </div>
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
              <div className="flex items-center gap-2">
                <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs"
                      onClick={() => {
                        setEditDistrict(user.district || DISTRICTS[0]);
                        setEditVulnerable(user.isVulnerable || false);
                      }}
                    >
                      <Edit3 className="size-3.5" />
                      Modifier mes préférences
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit3 className="size-4 text-primary" />
                        Modifier mon profil
                      </DialogTitle>
                      <DialogDescription>
                        Ajustez votre quartier de résidence et vos préférences d&apos;accompagnement.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEditProfile} className="space-y-4 pt-2">
                      {/* Informations d'identité */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/30">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Identité (fixe)</span>
                          <span className="text-xs font-semibold text-foreground">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Email de connexion</span>
                          <span className="text-xs font-mono font-medium text-foreground truncate block">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Quartier */}
                      <div className="space-y-1.5">
                        <Label htmlFor="editDistrict">Quartier de résidence</Label>
                        <Select value={editDistrict} onValueChange={(v) => setEditDistrict(v as District)}>
                          <SelectTrigger id="editDistrict" className="w-full">
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
                        <p className="text-[11px] text-muted-foreground">
                          Détermine les alertes locales et les services de proximité qui vous sont proposés en priorité.
                        </p>
                      </div>

                      {/* Statut personne vulnérable */}
                      <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                        <input
                          id="editVulnerable"
                          type="checkbox"
                          checked={editVulnerable}
                          onChange={(e) => setEditVulnerable(e.target.checked)}
                          className="mt-0.5 size-4 rounded border-input text-primary"
                        />
                        <Label htmlFor="editVulnerable" className="text-xs font-normal cursor-pointer leading-relaxed">
                          <strong className="font-semibold block text-foreground">Accompagnement prioritaire</strong>
                          Je souhaite être identifié comme personne vulnérable (aide d&apos;urgence et alertes canicule/incident prioritaires).
                        </Label>
                      </div>

                      <DialogFooter className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditProfileDialogOpen(false)}
                          disabled={savingEditProfile}
                        >
                          Annuler
                        </Button>
                        <Button type="submit" disabled={savingEditProfile}>
                          {savingEditProfile ? "Enregistrement…" : "Enregistrer les modifications"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground block">Nom & Prénom</span>
                <p className="text-sm font-semibold truncate">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground block">Email</span>
                <p className="text-sm font-semibold truncate font-mono text-xs mt-0.5">{user.email}</p>
              </div>
              <div className="rounded-lg border border-border p-3.5">
                <span className="text-xs text-muted-foreground block">Quartier</span>
                <p className="text-sm font-semibold text-foreground">
                  {user.district || <span className="text-muted-foreground italic font-normal">Non défini</span>}
                </p>
              </div>
            </div>

            {isCitizen && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Mes demandes
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {messages && messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintRequestsSummary}
                      className="h-7 text-xs gap-1.5"
                      title="Imprimer ou enregistrer en PDF le récapitulatif officiel"
                    >
                      <Printer className="size-3.5 text-primary" />
                      Récapitulatif des demandes (PDF)
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportUserData}
                    className="h-7 text-xs gap-1.5"
                    title="Télécharger l'intégralité de mes données (F55)"
                  >
                    <Download className="size-3.5 text-primary" />
                    Télécharger mes données
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <Link href="/espace/signalements">
                      <ThumbsUp className="size-3.5 text-primary" />
                      Signalements du quartier
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <Link href="/espace/idees">
                      <Lightbulb className="size-3.5 text-primary" />
                      Boîte à idées
                    </Link>
                  </Button>
                  {messages && (
                    <span className="text-xs text-muted-foreground hidden sm:inline ml-1">
                      {requestFiltersActive
                        ? `${filteredMessages.length} / ${messages.length}`
                        : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
                    </span>
                  )}
                  {messages && messages.length > 0 && (
                    <ExportCsvButton
                      data={messages}
                      columns={citizenMessagesCsvColumns}
                      filename="mes-demarches-citoyen"
                      buttonLabel="Exporter (CSV)"
                    />
                  )}
                </div>
              </div>

              {messages && messages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 items-center">
                  <Input
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    placeholder="Rechercher par référence ou mot-clé…"
                    className="h-8 max-w-xs text-xs"
                  />
                  <Select value={requestPriorityFilter} onValueChange={setRequestPriorityFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Toutes priorités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      <SelectItem value="urgente">Urgentes / Médicales</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={requestSort} onValueChange={setRequestSort}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Par priorité</SelectItem>
                      <SelectItem value="recent">Plus récents</SelectItem>
                      <SelectItem value="oldest">Plus anciens</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="nouveau">Nouveau</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="traite">Traité</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="signalement">Signalement</SelectItem>
                    </SelectContent>
                  </Select>
                  {requestFiltersActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setRequestSearch("");
                        setRequestStatusFilter("all");
                        setRequestTypeFilter("all");
                        setRequestPriorityFilter("all");
                        setRequestSort("priority");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              )}

              {messagesError && (
                <div className="py-2">
                  <BusyPlatformAlert
                    error={messagesError}
                    onRetry={() => {
                      setMessagesError(null);
                      loadMessages();
                    }}
                  />
                </div>
              )}
              {messages && messages.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Vous n&apos;avez envoyé aucun message pour le moment.
                </p>
              )}
              {messages && messages.length > 0 && filteredMessages.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  <p>Aucune demande ne correspond à ces filtres.</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      setRequestSearch("");
                      setRequestStatusFilter("all");
                      setRequestTypeFilter("all");
                      setRequestPriorityFilter("all");
                      setRequestSort("priority");
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
              {filteredMessages.length > 0 && (
                <div className="space-y-2">
                  {filteredMessages.map((m) => (
                    <Link
                      key={m.id}
                      href={`/espace/demandes/${m.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-xs transition-colors hover:border-primary/40"
                    >
                      <div>
                        <div className="font-semibold text-foreground flex flex-wrap items-center gap-2">
                          <span className="font-mono">{m.reference}</span>
                          <PriorityBadge message={m} />
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
            )}

            {/* Mes rendez-vous (F39) */}
            {isCitizen && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarCheck className="size-4 text-primary" />
                  Mes rendez-vous
                </h3>
                <div className="flex items-center gap-2">
                  {appointments && appointments.length > 0 && (
                    <ExportCsvButton
                      data={appointments}
                      columns={citizenAppointmentsCsvColumns}
                      filename="mes-rendez-vous"
                      buttonLabel="Exporter (CSV)"
                    />
                  )}
                  {appointments && (
                    <span className="text-xs text-muted-foreground">
                      {appointments.length} rendez-vous
                    </span>
                  )}
                </div>
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
              {appointments && appointments.length > 0 && (() => {
                const now = nowRef;
                const upcoming = appointments
                  .filter((a) => a.status === "confirme" && new Date(a.startsAt).getTime() > now)
                  .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
                const past = appointments
                  .filter((a) => a.status === "annule" || new Date(a.startsAt).getTime() <= now)
                  .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

                const renderAppointment = (a: Appointment) => (
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
                    {a.status === "confirme" && new Date(a.startsAt).getTime() > now && (
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
                          onClick={() => setAppointmentToCancel(a)}
                        >
                          <X className="size-3.5" />
                          {cancelingId === a.id ? "Annulation…" : "Annuler"}
                        </Button>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">À venir</p>
                      {upcoming.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Aucun rendez-vous à venir.</p>
                      ) : (
                        <div className="space-y-2">{upcoming.map(renderAppointment)}</div>
                      )}
                    </div>
                    {past.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Passés</p>
                        <div className="space-y-2">{past.map(renderAppointment)}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            )}

            {/* Demandes relatives aux données personnelles (F51) */}
            {isCitizen && (
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
            )}
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

              {/* Formulaire de modification de mot de passe (D03, F37) */}
              <div className="pt-2 border-t border-border">
                <Dialog
                  open={passwordDialogOpen}
                  onOpenChange={(open) => {
                    setPasswordDialogOpen(open);
                    if (!open) {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setPasswordError(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                      <KeyRound className="size-3.5 text-primary" />
                      Changer mon mot de passe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="size-5 text-primary" />
                        Changer mon mot de passe
                      </DialogTitle>
                      <DialogDescription>
                        Mettez à jour vos identifiants pour sécuriser l&apos;accès à votre espace Nova Terra.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Rappel des règles avant validation */}
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1 text-muted-foreground">
                      <p className="font-semibold text-foreground">Exigences de sécurité :</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li className={newPassword.length >= 8 && newPassword.length <= 72 ? "text-success font-medium" : ""}>
                          8 à 72 caractères
                        </li>
                        <li className={/[A-Z]/.test(newPassword) ? "text-success font-medium" : ""}>
                          Au moins une lettre majuscule
                        </li>
                        <li className={/[0-9]/.test(newPassword) ? "text-success font-medium" : ""}>
                          Au moins un chiffre
                        </li>
                        <li className={newPassword && currentPassword && newPassword !== currentPassword ? "text-success font-medium" : ""}>
                          Différent du mot de passe actuel
                        </li>
                      </ul>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <PasswordInput
                          id="currentPassword"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••••••"
                          autoComplete="current-password"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <PasswordInput
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                        <PasswordInput
                          id="confirmNewPassword"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          required
                        />
                      </div>

                      {passwordError && (
                        <div
                          role="alert"
                          className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-start gap-2"
                        >
                          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                          <span>{passwordError}</span>
                        </div>
                      )}

                      <DialogFooter className="pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPasswordDialogOpen(false)}
                          disabled={passwordSubmitting}
                        >
                          Annuler
                        </Button>
                        <Button type="submit" disabled={passwordSubmitting} className="gap-2">
                          {passwordSubmitting ? "Modification…" : "Valider le mot de passe"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
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
                    <PasswordInput
                      id="deletePassword"
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

      {/* Confirmation d'annulation de rendez-vous */}
      <AlertDialog open={!!appointmentToCancel} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentToCancel && (
                <>
                  Le rendez-vous du{" "}
                  {new Date(appointmentToCancel.startsAt).toLocaleString("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}{" "}
                  pour {appointmentToCancel.service?.name ?? "ce service"} sera annulé et le créneau
                  redeviendra disponible pour d&apos;autres habitants.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelingId !== null}>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelingId !== null}
              onClick={(e) => {
                e.preventDefault();
                if (appointmentToCancel) handleCancelAppointment(appointmentToCancel.id);
              }}
            >
              {cancelingId !== null ? "Annulation…" : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
