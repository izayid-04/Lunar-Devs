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
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (payload: RegisterPayload) => Promise<Result>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    Promise.resolve(stored ? fetchMe(stored) : null)
      .then((me) => {
        setUser(me);
        setToken(me ? stored : null);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    try {
      const newToken = await loginRequest(email, password);
      window.localStorage.setItem(TOKEN_KEY, newToken);
      const me = await fetchMe(newToken);
      setUser(me);
      setToken(newToken);
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
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const me = await fetchMe(token);
    setUser(me);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser]
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
