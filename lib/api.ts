// Thin wrapper around the Nova Terra API (NestJS, separate deployment).
// Kept dependency-free on purpose (no axios/swr/react-query) for eco-conception.

export type Role = "citizen" | "agent" | "admin";

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
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
