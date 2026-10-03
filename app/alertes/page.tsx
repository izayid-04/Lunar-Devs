import type { Metadata } from "next";
import Link from "next/link";
import { fetchAlerts } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  SEVERITY_BADGE,
  SEVERITY_LABEL,
  formatDateTime,
  isAlertActive,
  targetLabel,
} from "@/lib/alerts";
import { Siren, AlertTriangle, Info, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Alertes municipales — Nova Terra",
  description:
    "Historique et suivi en temps réel des alertes et consignes de sécurité à Nova Terra.",
};

export const dynamic = "force-dynamic";

const ICONS = {
  info: Info,
  important: AlertTriangle,
  urgent: Siren,
};

export default async function AlertesPage() {
  let alerts = [] as Awaited<ReturnType<typeof fetchAlerts>>;
  let error: string | null = null;

  try {
    alerts = await fetchAlerts();
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Impossible de récupérer les alertes pour le moment.";
  }

  const activeAlerts = alerts.filter((a) => isAlertActive(a));
  const pastAlerts = alerts.filter((a) => !isAlertActive(a));

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <Badge
            variant="outline"
            className="border-primary/40 text-primary gap-1.5 px-3 py-1 text-xs"
          >
            <Siren className="size-3" />
            Sécurité civile & Vigilance
          </Badge>
          <h1 className="mt-4">Alertes municipales</h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Consultez les alertes en cours et les consignes de sécurité émises par
            les autorités de Nova Terra.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {/* Alertes actives en cours */}
          <div>
            <div className="flex items-center justify-between">
              <h2>Alertes en cours</h2>
              <span className="text-xs text-muted-foreground">
                {activeAlerts.length} active{activeAlerts.length > 1 ? "s" : ""}
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <p className="mt-4 rounded-lg border border-border/80 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
                Aucune alerte active actuellement sur Nova Terra. Tous les dômes fonctionnent normalement.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {activeAlerts.map((alert) => {
                  const Icon = ICONS[alert.severity];
                  const urgent = alert.severity === "urgent";

                  return (
                    <Link
                      key={alert.id}
                      href={`/alertes/${alert.id}`}
                      className="block group"
                    >
                      <Card
                        className={`transition-all hover:border-primary/50 ${
                          urgent ? "border-destructive/60 bg-destructive/5" : ""
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                                  SEVERITY_BADGE[alert.severity]
                                }`}
                              >
                                <Icon className="size-3" aria-hidden="true" />
                                {SEVERITY_LABEL[alert.severity]}
                              </span>
                              <Badge variant="outline" className="text-[11px]">
                                {targetLabel(alert)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Depuis {formatDateTime(alert.startsAt)}
                            </span>
                          </div>

                          <h3 className="mt-3 group-hover:text-primary transition-colors">
                            {alert.title}
                          </h3>

                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {alert.body}
                          </p>

                          {alert.instructions && (
                            <div className="mt-3 rounded-md bg-muted/60 p-2.5 text-xs">
                              <span className="font-semibold text-foreground">
                                Quoi faire :{" "}
                              </span>
                              <span className="text-muted-foreground">
                                {alert.instructions}
                              </span>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-end text-xs font-medium text-primary">
                            Consulter les consignes complètes
                            <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historique des alertes passées */}
          <div>
            <div className="flex items-center justify-between border-t border-border pt-8">
              <h2>Historique des alertes</h2>
              <span className="text-xs text-muted-foreground">
                {pastAlerts.length} passée{pastAlerts.length > 1 ? "s" : ""}
              </span>
            </div>

            {pastAlerts.length === 0 ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Aucune alerte archivée dans le registre.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {pastAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/alertes/${alert.id}`}
                    className="block group"
                  >
                    <Card className="transition-colors hover:border-border/80">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Terminée le {formatDateTime(alert.expiresAt)}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {SEVERITY_LABEL[alert.severity]}
                            </Badge>
                          </div>
                          <p className="mt-1 font-medium text-sm text-foreground truncate group-hover:text-primary">
                            {alert.title}
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
