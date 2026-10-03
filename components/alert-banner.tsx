"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Info, Siren, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchActiveAlerts, type Alert, type AlertSeverity } from "@/lib/api";
import { SEVERITY_BANNER, SEVERITY_LABEL } from "@/lib/alerts";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "novaterra.dismissedAlerts";
// Rafraîchissement léger (éco-conception) : une requête toutes les 2 minutes,
// uniquement quand l'onglet est visible.
const REFRESH_MS = 120_000;

const DASHBOARD_PREFIXES = ["/dashboard", "/espace", "/agent", "/admin"];

const ICON: Record<AlertSeverity, typeof Info> = {
  info: Info,
  important: AlertTriangle,
  urgent: Siren,
};

const ORDER: Record<AlertSeverity, number> = { urgent: 0, important: 1, info: 2 };

function readDismissed(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(DISMISS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

/**
 * Bandeau d'alerte global (D18, F29). Affiché en haut de toutes les pages :
 * - `scope="public"` : rendu par le layout racine, masqué dans l'espace connecté ;
 * - `scope="dashboard"` : rendu dans `DashboardLayout`, à côté de la sidebar.
 * Les alertes urgentes ne peuvent pas être masquées et sont annoncées
 * immédiatement aux lecteurs d'écran (role="alert").
 */
export default function AlertBanner({ scope }: { scope: "public" | "dashboard" }) {
  const pathname = usePathname();
  const { token, loading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<number[]>(readDismissed);

  const isDashboardPath = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
  const hidden = scope === "public" ? isDashboardPath : !isDashboardPath;

  useEffect(() => {
    if (loading || hidden) return;
    let cancelled = false;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      fetchActiveAlerts(token)
        .then((data) => {
          if (!cancelled) setAlerts(data);
        })
        .catch(() => {
          // Bandeau non bloquant : en cas d'échec réseau on n'affiche rien.
        });
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", load);
    };
  }, [token, loading, hidden]);

  if (hidden) return null;

  const visible = alerts
    .filter((a) => a.severity === "urgent" || !dismissed.includes(a.id))
    .sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  if (visible.length === 0) return null;

  function dismiss(id: number) {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      // stockage indisponible : le masquage reste valable pour cette page.
    }
  }

  return (
    <section aria-label="Alertes en cours" className="flex flex-col">
      {visible.map((alert) => {
        const Icon = ICON[alert.severity];
        const urgent = alert.severity === "urgent";
        return (
          <div
            key={alert.id}
            role={urgent ? "alert" : "status"}
            className={cn("border-b px-4 py-3 sm:px-6", SEVERITY_BANNER[alert.severity])}
          >
            <div className="mx-auto flex max-w-5xl items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">
                  <span className="mr-2 inline-block rounded-sm border border-current/40 px-1.5 text-[11px] font-bold uppercase tracking-wide">
                    {SEVERITY_LABEL[alert.severity]}
                  </span>
                  {alert.title}
                </p>
                <p className="mt-1">{alert.body}</p>
                {alert.instructions && (
                  <p className="mt-1">
                    <strong>Que faire : </strong>
                    {alert.instructions}
                  </p>
                )}
                <Link
                  href={`/alertes/${alert.id}`}
                  className="mt-1 inline-block text-xs font-medium underline underline-offset-2"
                >
                  Voir le détail de l&apos;alerte
                </Link>
              </div>
              {!urgent && (
                <button
                  type="button"
                  onClick={() => dismiss(alert.id)}
                  aria-label={`Masquer l'alerte « ${alert.title} »`}
                  className="shrink-0 rounded-md p-1 transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
