// Thin wrapper around the Nova Terra API (NestJS, separate deployment).
// Kept dependency-free on purpose (no axios/swr/react-query) for eco-conception.

export type Role = "citizen" | "agent" | "admin";

export type District =
  | "Centre-Ville"
  | "Port Stellaire"
  | "Quartier des Dunes"
  | "Hauts de Nova"
  | "Faubourg Est";

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  district: District | null;
  preferredLanguage: string | null;
  isVulnerable: boolean;
  profileCompleted: boolean;
  createdAt: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL n'est pas définie.");
  }
  return `${base.replace(/\/$/, "")}${path}`;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  let serverMessage: string | null = null;
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message: unknown }).message;
      if (Array.isArray(message)) serverMessage = message.join(" ");
      else if (typeof message === "string") serverMessage = message;
    }
  } catch {
    // Corps non-JSON ou vide : on retombe sur les messages par statut ci-dessous.
  }

  // Seules les erreurs de validation (400) ont un message NestJS fait pour
  // être lu par un humain. Pour le reste (404 "Cannot POST ...", 500, etc.)
  // on préfère un message générique plutôt que d'exposer un détail technique.
  if (res.status === 400 && serverMessage) return serverMessage;
  if (res.status === 401) return "Email ou mot de passe incorrect.";
  if (res.status === 409) return "Un compte existe déjà avec cet email.";
  return fallback;
}

export async function registerRequest(payload: RegisterPayload): Promise<void> {
  const res = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de créer le compte pour le moment."));
  }
}

export async function loginRequest(email: string, password: string): Promise<string> {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Trop de tentatives de connexion. Merci de réessayer dans quelques minutes.");
    }
    if (res.status === 403) {
      // Compte verrouillé après 5 échecs consécutifs (F37) — le corps
      // porte l'heure de déverrouillage exacte.
      let lockedUntil: string | null = null;
      try {
        const data: unknown = await res.json();
        if (data && typeof data === "object" && "lockedUntil" in data) {
          lockedUntil = (data as { lockedUntil: unknown }).lockedUntil as string;
        }
      } catch {
        // ignore
      }
      if (lockedUntil) {
        const heure = new Date(lockedUntil).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        throw new Error(
          `Compte temporairement verrouillé après plusieurs tentatives infructueuses. Réessayez après ${heure}.`
        );
      }
      throw new Error("Compte temporairement verrouillé. Merci de réessayer plus tard.");
    }
    throw new Error(await readErrorMessage(res, "Connexion impossible pour le moment."));
  }
  const data: unknown = await res.json();
  const token =
    data && typeof data === "object" && "accessToken" in data
      ? (data as { accessToken: unknown }).accessToken
      : undefined;
  if (typeof token !== "string" || !token) {
    throw new Error("Réponse de connexion invalide.");
  }
  return token;
}

export async function fetchMe(token: string): Promise<Me> {
  const res = await fetch(apiUrl("/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Session expirée, merci de vous reconnecter.");
  }
  return (await res.json()) as Me;
}

// --- Profil (D12, F35) et suppression de compte (F33) ---

export async function patchMe(
  token: string,
  payload: Partial<{ district: District; preferredLanguage: string; isVulnerable: boolean }>
): Promise<Me> {
  const res = await fetch(apiUrl("/me"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de mettre à jour votre profil."));
  }
  return res.json();
}

export async function changePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
  const res = await authFetch("/me/password", token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Mot de passe actuel incorrect.");
    }
    throw new Error(await readErrorMessage(res, "Impossible de modifier votre mot de passe."));
  }
  return res.json();
}

export async function deleteMyAccount(token: string, password: string): Promise<void> {
  const res = await fetch(apiUrl("/me"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Mot de passe incorrect.");
    }
    throw new Error(await readErrorMessage(res, "Impossible de supprimer votre compte."));
  }
}

function authFetch(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    },
  });
}

// --- Messages des habitants (Bloc 2 — D04, F22) ---

export type MessageStatus = "nouveau" | "en_cours" | "traite";
export type MessageType = "question" | "signalement";

export type MessageHistoryItem = {
  id: number;
  status: MessageStatus;
  note: string | null;
  changedAt: string;
  changedBy?: { id: string; firstName: string; lastName: string } | null;
};

export type CitizenMessage = {
  id: number;
  reference: string;
  type?: MessageType;
  subject: string;
  body: string;
  category: string;
  district?: string;
  preciseLocation?: string;
  status: MessageStatus;
  supportCount?: number;
  supportedByMe?: boolean;
  isMine?: boolean;
  createdAt: string;
  updatedAt: string;
  history?: MessageHistoryItem[];
};

export type MessageAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type AgentMessage = CitizenMessage & { author: MessageAuthor };

export type MessageCounts = Record<MessageStatus, number>;

export async function postMessage(
  token: string,
  payload: {
    type?: MessageType;
    subject: string;
    body: string;
    category: string;
    district?: District;
    preciseLocation?: string;
  }
): Promise<CitizenMessage> {
  const res = await authFetch("/messages", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible d'envoyer votre message pour le moment."));
  }
  return res.json();
}

export async function fetchMyMessages(token: string): Promise<CitizenMessage[]> {
  const res = await authFetch("/messages/mine", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer vos messages."));
  }
  return res.json();
}

// Signalements des autres citoyens, anonymisés, pour soutien communautaire (F52).
export async function fetchPublicMessages(token: string): Promise<CitizenMessage[]> {
  const res = await authFetch("/messages/public", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les signalements du quartier."));
  }
  return res.json();
}

export async function fetchMyMessage(token: string, id: number | string): Promise<CitizenMessage> {
  const res = await authFetch(`/messages/mine/${id}`, token);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Cette demande n'existe pas.");
    throw new Error(await readErrorMessage(res, "Impossible de récupérer cette demande."));
  }
  return res.json();
}

export async function toggleMessageSupport(
  token: string,
  id: number | string
): Promise<{ supported: boolean; supportCount: number }> {
  const res = await authFetch(`/messages/${id}/support`, token, { method: "POST" });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Ce message n'existe pas.");
    throw new Error(await readErrorMessage(res, "Impossible d'enregistrer votre soutien."));
  }
  return res.json();
}

export async function fetchAgentMessages(
  token: string,
  options?: { status?: MessageStatus; type?: "question" | "signalement"; sort?: "recent" | "supports" } | MessageStatus
): Promise<{ messages: AgentMessage[]; counts: MessageCounts }> {
  let qs = "";
  if (typeof options === "string") {
    qs = `?status=${options}`;
  } else if (options) {
    const params = new URLSearchParams();
    if (options.status) params.set("status", options.status);
    if (options.type) params.set("type", options.type);
    if (options.sort) params.set("sort", options.sort);
    const str = params.toString();
    if (str) qs = `?${str}`;
  }
  const res = await authFetch(`/agent/messages${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les messages."));
  }
  return res.json();
}

export async function patchMessageStatus(
  token: string,
  id: number,
  status: MessageStatus
): Promise<AgentMessage> {
  const res = await authFetch(`/agent/messages/${id}/status`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de changer le statut de ce message."));
  }
  return res.json();
}

// --- Espace agent + API Webcup (Bloc 3 — D19, F22, D17, F50) ---

export type AgentDashboardMetrics = {
  byCategory?: Record<string, number>;
  byDistrict?: Record<string, number>;
  totalSupports?: number;
  upcomingAppointmentsCount?: number;
  activeAlertsCount?: number;
};

export type AgentDashboard = {
  citizensCount: number;
  messagesByStatus: MessageCounts;
  recentMessages: AgentMessage[];
  metrics?: AgentDashboardMetrics;
};

export async function fetchAgentDashboard(token: string): Promise<AgentDashboard> {
  const res = await authFetch("/agent/dashboard", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de charger le tableau de bord."));
  }
  return res.json();
}

export type WebcupRequestsResponse = {
  // Forme brute renvoyée par l'API Webcup, non reformatée par notre API —
  // volontairement non typée en détail (voir docs/API.md).
  data: unknown;
  cache: { hit: boolean; ageSeconds: number };
};

export async function fetchWebcupRequests(token: string): Promise<WebcupRequestsResponse> {
  const res = await authFetch("/agent/webcup/requests", token);
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error("Le flux Webcup est momentanément indisponible.");
    }
    throw new Error(await readErrorMessage(res, "Impossible de récupérer le flux Webcup."));
  }
  return res.json();
}

// --- Contenu de la ville : services + annonces (Bloc 4 — D05, D06) ---

export type ServiceCategory =
  | "sante"
  | "securite"
  | "administratif"
  | "culture"
  | "education"
  | "voirie"
  | "eau-energie"
  | "tourisme";

export type ServiceAvailability = "disponible" | "maintenance" | "incident";

export type Service = {
  id: number;
  slug: string;
  name: string;
  category: ServiceCategory;
  description: string;
  details: string;
  contact: string;
  horaires: string;
  district: string;
  address: string;
  latitude: string;
  longitude: string;
  featured: boolean;
  isEmergency: boolean;
  availability: ServiceAvailability;
  availabilityMessage: string | null;
  availableAgainAt: string | null;
  alternative: string | null;
};

export async function fetchServices(params?: {
  q?: string;
  category?: string;
  district?: string;
  featured?: boolean;
  emergency?: boolean;
}): Promise<Service[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.category) qs.set("category", params.category);
  if (params?.district) qs.set("district", params.district);
  if (params?.featured !== undefined) qs.set("featured", String(params.featured));
  if (params?.emergency !== undefined) qs.set("emergency", String(params.emergency));
  const query = qs.toString();
  const res = await fetch(apiUrl(`/services${query ? `?${query}` : ""}`));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les services municipaux."));
  }
  return res.json();
}

export async function patchServiceAvailability(
  token: string,
  idOrSlug: string | number,
  payload: {
    availability: ServiceAvailability;
    availabilityMessage?: string | null;
    availableAgainAt?: string | null;
    alternative?: string | null;
  }
): Promise<Service> {
  const res = await authFetch(`/services/${idOrSlug}/availability`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de mettre à jour la disponibilité."));
  }
  return res.json();
}

export async function fetchService(slug: string): Promise<Service> {
  const res = await fetch(apiUrl(`/services/${slug}`));
  if (!res.ok) {
    if (res.status === 404) throw new Error("Ce service n'existe pas.");
    throw new Error(await readErrorMessage(res, "Impossible de récupérer ce service."));
  }
  return res.json();
}

export type Announcement = {
  id: number;
  title: string;
  body: string;
  category: string;
  isImportant?: boolean;
  publishedAt: string;
};

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(apiUrl("/announcements"));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les annonces."));
  }
  return res.json();
}

export async function fetchAnnouncement(id: number | string): Promise<Announcement> {
  const res = await fetch(apiUrl(`/announcements/${id}`));
  if (!res.ok) {
    if (res.status === 404) throw new Error("Cette annonce n'existe pas.");
    throw new Error(await readErrorMessage(res, "Impossible de récupérer cette annonce."));
  }
  return res.json();
}

export async function postAnnouncement(
  token: string,
  payload: { title: string; body: string; category: string; isImportant?: boolean }
): Promise<Announcement> {
  const res = await authFetch("/announcements", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de créer l'annonce."));
  }
  return res.json();
}

export async function patchAnnouncement(
  token: string,
  id: number,
  payload: Partial<{ title: string; body: string; category: string; isImportant: boolean }>
): Promise<Announcement> {
  const res = await authFetch(`/announcements/${id}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de modifier cette annonce."));
  }
  return res.json();
}

export async function deleteAnnouncement(token: string, id: number): Promise<void> {
  const res = await authFetch(`/announcements/${id}`, token, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de supprimer cette annonce."));
  }
}

// --- Alertes municipales (Bloc Alertes — D18, F29, F30, F31) ---

export type AlertSeverity = "info" | "important" | "urgent";
export type AlertTarget = "all" | "district" | "vulnerable";

export type Alert = {
  id: number;
  title: string;
  body: string;
  instructions: string;
  severity: AlertSeverity;
  target: AlertTarget;
  targetDistrict: string | null;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAlertPayload = {
  title: string;
  body: string;
  instructions: string;
  severity: AlertSeverity;
  target: AlertTarget;
  targetDistrict?: string | null;
  startsAt: string;
  expiresAt: string;
};

export async function fetchActiveAlerts(token?: string | null): Promise<Alert[]> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiUrl("/alerts/active"), { headers });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les alertes actives."));
  }
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(apiUrl("/alerts"));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer l'historique des alertes."));
  }
  return res.json();
}

export async function fetchAlert(id: number | string): Promise<Alert> {
  const res = await fetch(apiUrl(`/alerts/${id}`));
  if (!res.ok) {
    if (res.status === 404) throw new Error("Cette alerte n'existe pas.");
    throw new Error(await readErrorMessage(res, "Impossible de récupérer cette alerte."));
  }
  return res.json();
}

export async function createAlert(token: string, payload: CreateAlertPayload): Promise<Alert> {
  const res = await authFetch("/alerts", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de publier l'alerte."));
  }
  return res.json();
}

export async function patchAlert(
  token: string,
  id: number,
  payload: Partial<CreateAlertPayload>
): Promise<Alert> {
  const res = await authFetch(`/alerts/${id}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de modifier cette alerte."));
  }
  return res.json();
}

export async function terminateAlert(token: string, id: number): Promise<Alert> {
  const res = await authFetch(`/alerts/${id}/terminate`, token, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de clore cette alerte."));
  }
  return res.json();
}

export async function deleteAlert(token: string, id: number): Promise<void> {
  const res = await authFetch(`/alerts/${id}`, token, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de supprimer cette alerte."));
  }
}

// --- Recommandations IA pour les alertes (F31) ---

export type AiRecommendationsPayload = {
  situation: string;
  district?: string;
  targetAudience?: string;
};

export type AiRecommendationsResponse = {
  situation: string;
  recommendations: string[];
  suggestedInstructions: string;
  model: string;
};

export async function generateAiAlertRecommendations(
  token: string,
  payload: AiRecommendationsPayload
): Promise<AiRecommendationsResponse> {
  const res = await authFetch("/agent/alerts/ai-recommendations", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error("Le service IA n'est pas configuré sur le serveur (clé API manquante).");
    }
    if (res.status === 504) {
      throw new Error("L'assistant IA a mis trop de temps à répondre (délai dépassé).");
    }
    if (res.status === 502) {
      throw new Error("Le fournisseur de service IA est temporairement indisponible.");
    }
    throw new Error(await readErrorMessage(res, "Échec de génération des recommandations IA."));
  }
  return res.json();
}

// --- Notifications (D18, F30) ---

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export async function fetchNotifications(token: string): Promise<AppNotification[]> {
  const res = await authFetch("/notifications", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les notifications."));
  }
  return res.json();
}

export async function markNotificationAsRead(token: string, id: number): Promise<AppNotification> {
  const res = await authFetch(`/notifications/${id}/read`, token, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de marquer la notification comme lue."));
  }
  return res.json();
}

// --- Sécurité & Administration (F37) ---

export type SecurityLoginAttempt = {
  id: number;
  ip: string;
  date: string;
  success?: boolean;
};

export type MySecurity = {
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  recentFailures: SecurityLoginAttempt[];
  history: SecurityLoginAttempt[];
};

export async function fetchMySecurity(token: string): Promise<MySecurity> {
  const res = await authFetch("/me/security", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer vos informations de sécurité."));
  }
  return res.json();
}

export type TargetedAccount = {
  email: string;
  failedAttemptsCount: number;
  lastFailedAt: string;
};

export async function fetchTargetedAccounts(token: string): Promise<TargetedAccount[]> {
  const res = await authFetch("/agent/security/targeted-accounts", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les comptes ciblés."));
  }
  return res.json();
}

// --- Rendez-vous municipaux (F39, F40) ---

export type AppointmentSlot = {
  id: number;
  startsAt: string;
  endsAt?: string;
  isAvailable: boolean;
  location?: string;
  agent?: { firstName: string; lastName: string } | null;
};

export type AppointmentStatus = "confirme" | "annule";

export type Appointment = {
  id: number;
  status: AppointmentStatus;
  reason: string;
  requiredDocuments?: string | null;
  startsAt: string;
  endsAt?: string;
  location?: string;
  service?: { id: number; name: string; slug: string };
  agent?: { id: string; firstName: string; lastName: string } | null;
  user?: { id: string; firstName: string; lastName: string; email: string };
  slot?: AppointmentSlot;
  createdAt: string;
};

export async function fetchAppointmentSlots(serviceSlugOrId: string | number): Promise<AppointmentSlot[]> {
  const res = await fetch(apiUrl(`/appointments/slots?service=${encodeURIComponent(String(serviceSlugOrId))}`));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les créneaux disponibles."));
  }
  return res.json();
}

export async function bookAppointment(
  token: string,
  slotId: number,
  payload: { reason: string; requiredDocuments?: string }
): Promise<Appointment> {
  const res = await authFetch(`/appointments/book/${slotId}`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 409) {
      throw new Error("Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.");
    }
    if (res.status === 404) {
      throw new Error("Ce créneau n'existe plus.");
    }
    throw new Error(await readErrorMessage(res, "Impossible de réserver ce rendez-vous."));
  }
  return res.json();
}

export async function fetchMyAppointments(token: string): Promise<Appointment[]> {
  const res = await authFetch("/appointments/mine", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer vos rendez-vous."));
  }
  return res.json();
}

export async function cancelAppointment(token: string, id: number): Promise<Appointment> {
  const res = await authFetch(`/appointments/${id}/cancel`, token, { method: "PATCH" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible d'annuler ce rendez-vous."));
  }
  return res.json();
}

// Télécharge le .ics via fetch (authentifié) puis déclenche l'enregistrement
// côté client — la route exige un Bearer token, donc un simple lien <a>
// ne fonctionnerait pas (voir docs/API.md).
export async function downloadAppointmentIcs(token: string, id: number): Promise<void> {
  const res = await authFetch(`/appointments/${id}/ics`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de télécharger ce rendez-vous."));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rendez-vous-${id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchAgentAppointments(token: string, serviceId?: number): Promise<Appointment[]> {
  const qs = serviceId ? `?serviceId=${serviceId}` : "";
  const res = await authFetch(`/agent/appointments${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les rendez-vous."));
  }
  return res.json();
}


// --- Journal d'Audit & Traçabilité Administrative (Chantier 1 — F47, F48) ---

export type AuditLogAction =
  | "message_status_updated"
  | "citizen_account_activated"
  | "citizen_account_deactivated"
  | "citizen_account_deleted"
  | "service_availability_updated"
  | "alert_created"
  | "alert_updated"
  | "alert_terminated"
  | "alert_deleted"
  | string;

export type AuditLogEntityType =
  | "CitizenMessage"
  | "User"
  | "MunicipalService"
  | "Alert"
  | string;

export type AuditLogItem = {
  id: string;
  action: AuditLogAction;
  entityType: AuditLogEntityType;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  author: {
    id: number | string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  } | null;
};

export type AuditLogsResponse = {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuditLogsFilter = {
  action?: string;
  entityType?: string;
  authorId?: string | number;
  page?: number;
  limit?: number;
};

export async function fetchAuditLogs(
  token: string,
  filter?: AuditLogsFilter
): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  if (filter?.action) params.set("action", filter.action);
  if (filter?.entityType) params.set("entityType", filter.entityType);
  if (filter?.authorId) params.set("authorId", String(filter.authorId));
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/agent/audit-logs${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer le journal d'audit."));
  }
  return res.json();
}

// --- Transports Municipaux (Chantier 2 — F36) ---

export type TransportType = "navette" | "bus" | "tram" | "batelier";
export type TransportStatus = "normal" | "perturbe" | "interrompu";

export type TransportLine = {
  id: number;
  code: string;
  name: string;
  type: TransportType;
  origin: string;
  destination: string;
  status: TransportStatus;
  statusMessage: string;
  frequency: string;
  operatingHours: string;
  stops: string; // JSON array string
  nextDepartures: string; // JSON array string
  createdAt: string;
  updatedAt: string;
};

export async function fetchTransports(filter?: { type?: TransportType; q?: string }): Promise<TransportLine[]> {
  const params = new URLSearchParams();
  if (filter?.type) params.set("type", filter.type);
  if (filter?.q) params.set("q", filter.q);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(apiUrl(`/transports${qs}`));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de charger les transports."));
  }
  return res.json();
}

export async function fetchTransportDetail(codeOrId: string | number): Promise<TransportLine> {
  const res = await fetch(apiUrl(`/transports/${codeOrId}`));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Ligne de transport introuvable."));
  }
  return res.json();
}

export async function patchTransportStatus(
  token: string,
  codeOrId: string | number,
  payload: { status: TransportStatus; statusMessage: string }
): Promise<TransportLine> {
  const res = await authFetch(`/transports/${codeOrId}/status`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de modifier l'état du transport."));
  }
  return res.json();
}

// --- Protection des Données & Demandes RGPD (Chantier 3 — F51) ---

export type PrivacyInquiryType =
  | "acces"
  | "rectification"
  | "effacement"
  | "explication"
  | "opposition"
  | "autre";

export type PrivacyInquiryStatus = "en_attente" | "en_cours" | "traitee" | "fermee";

export type PrivacyInquiry = {
  id: number;
  reference: string;
  type: PrivacyInquiryType;
  subject: string;
  description: string;
  status: PrivacyInquiryStatus;
  responseNote: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  citizen?: {
    id: number | string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type CreatePrivacyInquiryPayload = {
  type: PrivacyInquiryType;
  subject: string;
  description: string;
};

export async function postPrivacyInquiry(
  token: string,
  payload: CreatePrivacyInquiryPayload
): Promise<PrivacyInquiry> {
  const res = await authFetch("/privacy/inquiries", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de transmettre votre demande relative aux données."));
  }
  return res.json();
}

export async function fetchMyPrivacyInquiries(token: string): Promise<PrivacyInquiry[]> {
  const res = await authFetch("/privacy/inquiries/mine", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer vos demandes relatives aux données."));
  }
  return res.json();
}

export async function fetchAgentPrivacyInquiries(
  token: string,
  status?: PrivacyInquiryStatus
): Promise<PrivacyInquiry[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await authFetch(`/agent/privacy/inquiries${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de charger les demandes relatives aux données personnelles."));
  }
  return res.json();
}

export async function patchAgentPrivacyInquiryStatus(
  token: string,
  id: number,
  payload: { status: PrivacyInquiryStatus; responseNote: string }
): Promise<PrivacyInquiry> {
  const res = await authFetch(`/agent/privacy/inquiries/${id}/status`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de mettre à jour cette demande."));
  }
  return res.json();
}

// --- Gestion des citoyens (F34) ---

export type CitizenUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  district?: string | null;
  preferredLanguage?: string | null;
  isVulnerable?: boolean;
  profileCompleted?: boolean;
  createdAt: string;
};

export type CitizensPaginationResponse = {
  data: CitizenUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchAgentCitizens(
  token: string,
  options?: { page?: number; limit?: number; q?: string }
): Promise<CitizensPaginationResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.q) params.set("q", options.q);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/agent/citizens${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de charger la liste des citoyens."));
  }
  return res.json();
}

export async function patchCitizenStatus(
  token: string,
  id: string,
  isActive: boolean
): Promise<CitizenUser> {
  const res = await authFetch(`/agent/citizens/${id}/status`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de modifier le statut de ce compte."));
  }
  return res.json();
}

// --- Gestion des comptes par l'administrateur (D08, D09) ---
// Même forme de pagination que /agent/citizens, mais sur tous les rôles.

export async function fetchAdminUsers(
  token: string,
  options?: { page?: number; limit?: number; q?: string; role?: Role }
): Promise<CitizensPaginationResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.q) params.set("q", options.q);
  if (options?.role) params.set("role", options.role);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/admin/users${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de charger la liste des comptes."));
  }
  return res.json();
}

export async function createAdminUser(
  token: string,
  payload: { email: string; password: string; firstName: string; lastName: string; role: Role; district?: District }
): Promise<CitizenUser> {
  const res = await authFetch("/admin/users", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de créer ce compte."));
  }
  return res.json();
}

export async function patchAdminUserRole(token: string, id: string, role: Role): Promise<CitizenUser> {
  const res = await authFetch(`/admin/users/${id}/role`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de modifier le rôle de ce compte."));
  }
  return res.json();
}

export async function patchAdminUserStatus(token: string, id: string, isActive: boolean): Promise<CitizenUser> {
  const res = await authFetch(`/admin/users/${id}/status`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de modifier le statut de ce compte."));
  }
  return res.json();
}

// --- Projets de la ville & consultations citoyennes (F65, F66, F67) ---

export type Consultation = {
  id: number;
  question: string;
  options: string[];
  endDate: string;
  totalResponses?: number;
  aggregatedResults?: Record<string, number>;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  district: string;
  status: string;
  startDate?: string;
  endDate?: string;
  consultations: Consultation[];
};

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(apiUrl("/projects"));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les projets de la ville."));
  }
  return res.json();
}

export async function fetchProject(id: number | string): Promise<Project> {
  const res = await fetch(apiUrl(`/projects/${id}`));
  if (!res.ok) {
    if (res.status === 404) throw new Error("Ce projet n'existe pas.");
    throw new Error(await readErrorMessage(res, "Impossible de récupérer ce projet."));
  }
  return res.json();
}

export type ConsultationResponsePayload = {
  option: string;
  comment?: string;
};

export type ConsultationResponseResult = {
  message: string;
  reference: string;
  response: {
    id: number;
    consultationId: number;
    citizenId: number;
    reference: string;
    option: string;
    comment: string | null;
  };
  aggregatedResults: Record<string, number>;
  totalResponses: number;
};

export async function postConsultationResponse(
  token: string,
  consultationId: number,
  payload: ConsultationResponsePayload
): Promise<ConsultationResponseResult> {
  const res = await authFetch(`/consultations/${consultationId}/responses`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible d'enregistrer votre avis."));
  }
  return res.json();
}

// --- Boîte à idées citoyenne (F68) ---

export type IdeaStatus = "soumise" | "en_etude" | "retenue" | "rejetee";

export type Idea = {
  id: number;
  reference: string;
  title: string;
  description: string;
  district: string;
  status: IdeaStatus;
  adminNote: string | null;
  citizenId?: number;
  createdAt: string;
};

export async function postIdea(
  token: string,
  payload: { title: string; description: string; district: District }
): Promise<Idea> {
  const res = await authFetch("/ideas", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible d'envoyer votre idée."));
  }
  return res.json();
}

export async function fetchMyIdeas(token: string): Promise<Idea[]> {
  const res = await authFetch("/ideas/mine", token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer vos idées."));
  }
  return res.json();
}

export type AgentIdea = Idea & {
  citizen?: {
    id: number | string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export async function fetchAgentIdeas(
  token: string,
  status?: IdeaStatus
): Promise<AgentIdea[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await authFetch(`/agent/ideas${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les idées citoyennes."));
  }
  return res.json();
}

export async function patchAgentIdea(
  token: string,
  id: number,
  payload: { status: IdeaStatus; adminNote?: string }
): Promise<AgentIdea> {
  const res = await authFetch(`/agent/ideas/${id}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de mettre à jour le statut de l'idée."));
  }
  return res.json();
}

// --- Avis sur les services municipaux (F76) ---

export type ServiceFeedbackPayload = {
  rating: number;
  comment?: string;
};

export type ServiceFeedbackResult = {
  message: string;
  reference: string;
  feedback: {
    id: number;
    serviceId: number;
    citizenId: number;
    rating: number;
    comment: string | null;
    reference: string;
  };
  averageRating: number;
  totalFeedbacks: number;
};

export async function postServiceFeedback(
  token: string,
  serviceId: number | string,
  payload: ServiceFeedbackPayload
): Promise<ServiceFeedbackResult> {
  const res = await authFetch(`/services/${serviceId}/feedback`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible d'enregistrer votre avis."));
  }
  return res.json();
}

export type AgentServiceFeedback = {
  id: number;
  serviceId: number;
  citizenId: number;
  rating: number;
  comment: string | null;
  reference: string;
  createdAt: string;
  service?: {
    id: number;
    name: string;
    slug?: string;
  };
  citizen?: {
    id: number | string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export async function fetchAgentServiceFeedbacks(
  token: string,
  serviceId?: number | string
): Promise<AgentServiceFeedback[]> {
  const qs = serviceId ? `?serviceId=${encodeURIComponent(String(serviceId))}` : "";
  const res = await authFetch(`/agent/service-feedbacks${qs}`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les avis sur les services."));
  }
  return res.json();
}

// --- Partenaires & associations locales (F74) ---

export type Partner = {
  id: number;
  name: string;
  description: string;
  address: string;
  district: string;
  openingHours: string;
  contact: string;
};

export async function fetchPartners(district?: string): Promise<Partner[]> {
  const qs = district ? `?district=${encodeURIComponent(district)}` : "";
  const res = await fetch(apiUrl(`/partners${qs}`));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les associations partenaires."));
  }
  return res.json();
}

// --- Détection de Demandes Similaires (IA) (F75) ---

export type SimilarMessageItem = {
  id: number;
  reference: string;
  subject: string;
  body: string;
  category: string;
  district?: string | null;
  status: MessageStatus;
  createdAt: string;
  similarityScore: number;
};

export type SimilarMessagesResponse = {
  targetMessage: {
    id: number;
    reference: string;
    subject: string;
    body: string;
    category: string;
    district?: string | null;
  };
  similarMessages: SimilarMessageItem[];
  explanation: string;
  aiEnhanced: boolean;
};

export async function fetchSimilarMessages(
  token: string,
  messageId: number | string
): Promise<SimilarMessagesResponse> {
  const res = await authFetch(`/agent/messages/${messageId}/similar`, token);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de charger les demandes similaires."));
  }
  return res.json();
}
