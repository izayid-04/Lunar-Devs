"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  loginRequest,
  registerRequest,
  type Me,
  type RegisterPayload,
} from "./api";

const TOKEN_KEY = "novaterra.token";

type Result = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (payload: RegisterPayload) => Promise<Result>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    Promise.resolve(token ? fetchMe(token) : null)
      .then((me) => setUser(me))
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    try {
      const token = await loginRequest(email, password);
      window.localStorage.setItem(TOKEN_KEY, token);
      const me = await fetchMe(token);
      setUser(me);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: messageOf(err, "Connexion impossible.") };
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<Result> => {
    try {
      await registerRequest(payload);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: messageOf(err, "Impossible de créer le compte.") };
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() doit être utilisé sous <AuthProvider>.");
  }
  return ctx;
}
