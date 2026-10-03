import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchAlert } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SEVERITY_BADGE,
  SEVERITY_LABEL,
  formatDateTime,
  isAlertActive,
  targetLabel,
} from "@/lib/alerts";
import { Siren, AlertTriangle, Info, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getAlert(id: string) {
  try {
    return await fetchAlert(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/alertes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const alert = await getAlert(id);
  return {
    title: alert ? `${alert.title} — Nova Terra` : "Alerte introuvable — Nova Terra",
  };
}

const ICONS = {
  info: Info,
  important: AlertTriangle,
  urgent: Siren,
};

export default async function AlertDetailPage({ params }: PageProps<"/alertes/[id]">) {
  const { id } = await params;
  const alert = await getAlert(id);

  if (!alert) {
    notFound();
  }

  const active = isAlertActive(alert);
  const Icon = ICONS[alert.severity];
  const urgent = alert.severity === "urgent";

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Nova Terra</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/alertes">Alertes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{alert.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
              SEVERITY_BADGE[alert.severity]
            }`}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {SEVERITY_LABEL[alert.severity]}
          </span>
          <Badge variant="outline" className="text-xs">
            {targetLabel(alert)}
          </Badge>
        </div>

        <Badge
          variant={active ? "default" : "secondary"}
          className="text-xs"
        >
          {active ? "Alerte active" : "Alerte terminée"}
        </Badge>
      </div>

      <h1 className="mt-4">{alert.title}</h1>

      <div className="mt-2 text-xs text-muted-foreground">
        Diffusée le {formatDateTime(alert.startsAt)} •{" "}
        {active ? `Expire le ${formatDateTime(alert.expiresAt)}` : `Clôturée le ${formatDateTime(alert.expiresAt)}`}
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold">Description de la situation</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {alert.body}
          </p>
        </div>

        {alert.instructions && (
          <div
            className={`rounded-xl border p-6 shadow-sm ${
              urgent
                ? "border-destructive/40 bg-destructive/5"
                : "border-primary/40 bg-primary/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Instructions et conduite à tenir</h2>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground font-medium">
              {alert.instructions}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <Button variant="outline" asChild>
          <Link href="/alertes" className="gap-2">
            <ArrowLeft className="size-4" />
            Retour aux alertes
          </Link>
        </Button>
      </div>
    </div>
  );
}
