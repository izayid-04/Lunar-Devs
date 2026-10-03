// Thin wrapper around the Nova Terra API (NestJS, separate deployment).
// Kept dependency-free on purpose (no axios/swr/react-query) for eco-conception.

export type Role = "citizen" | "agent" | "admin";

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
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

export type CitizenMessage = {
  id: number;
  reference: string;
  subject: string;
  body: string;
  category: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
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
  payload: { subject: string; body: string; category: string }
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

export async function fetchAgentMessages(
  token: string,
  status?: MessageStatus
): Promise<{ messages: AgentMessage[]; counts: MessageCounts }> {
  const qs = status ? `?status=${status}` : "";
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

// --- Espace agent + API Webcup (Bloc 3 — D19, F22, D17) ---

export type AgentDashboard = {
  citizensCount: number;
  messagesByStatus: MessageCounts;
  recentMessages: AgentMessage[];
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

export type Service = {
  id: number;
  slug: string;
  name: string;
  description: string;
  details: string;
  contact: string;
  horaires: string;
  district: string;
};

export async function fetchServices(): Promise<Service[]> {
  const res = await fetch(apiUrl("/services"));
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Impossible de récupérer les services municipaux."));
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
