"use client";

import { useEffect, useState } from "react";

type State =
  | { phase: "loading" }
  | { phase: "ok"; durationMs: number; body: string }
  | { phase: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const initialState: State = API_URL
  ? { phase: "loading" }
  : { phase: "error", message: "NEXT_PUBLIC_API_URL n'est pas définie." };

export default function HealthCheck() {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    if (!API_URL) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const started = performance.now();

    fetch(`${API_URL.replace(/\/$/, "")}/health`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const durationMs = Math.round(performance.now() - started);
        const body = await res.text();
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        setState({ phase: "ok", durationMs, body });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.name === "AbortError"
              ? "Délai dépassé (8s) — API injoignable."
              : err.message
            : "Erreur inconnue.";
        setState({ phase: "error", message });
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            state.phase === "ok"
              ? "bg-green-500"
              : state.phase === "error"
                ? "bg-red-500"
                : "bg-yellow-500 animate-pulse"
          }`}
        />
        <span className="font-medium">
          {state.phase === "ok" && "OK"}
          {state.phase === "error" && "Erreur"}
          {state.phase === "loading" && "Vérification en cours…"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <dt>URL appelée</dt>
        <dd className="font-mono break-all">
          {API_URL ? `${API_URL.replace(/\/$/, "")}/health` : "(non définie)"}
        </dd>

        {state.phase === "ok" && (
          <>
            <dt>Latence</dt>
            <dd>{state.durationMs} ms</dd>
            <dt>Réponse</dt>
            <dd className="font-mono break-all">{state.body || "(vide)"}</dd>
          </>
        )}

        {state.phase === "error" && (
          <>
            <dt>Détail</dt>
            <dd className="text-red-600 dark:text-red-400">
              {state.message}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
