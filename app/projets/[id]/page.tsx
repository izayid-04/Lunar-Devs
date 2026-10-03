import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProject } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MapPin, Calendar } from "lucide-react";
import ConsultationVote from "@/components/projects/consultation-vote";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  en_cours: "En cours",
  planifie: "Planifié",
  termine: "Terminé",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status.replace(/_/g, " ");
}

async function getProject(id: string) {
  try {
    return await fetchProject(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/projets/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return {
    title: project ? `${project.title} — Nova Terra` : "Projet introuvable — Nova Terra",
  };
}

export default async function ProjetDetailPage({ params }: PageProps<"/projets/[id]">) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Nova Terra</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/projets">Projets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/40 text-primary gap-1.5">
          <MapPin className="size-3" />
          {project.district}
        </Badge>
        <Badge variant="outline">{statusLabel(project.status)}</Badge>
      </div>
      <h1 className="mt-3">{project.title}</h1>
      <p className="mt-3 text-muted-foreground">{project.description}</p>

      {(project.startDate || project.endDate) && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          {project.startDate &&
            new Date(project.startDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
          {project.startDate && project.endDate && " → "}
          {project.endDate &&
            new Date(project.endDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
        </p>
      )}

      {project.consultations.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Aucune consultation citoyenne n&apos;est associée à ce projet pour le moment.
        </p>
      ) : (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Consultations citoyennes
          </h2>
          {project.consultations.map((c) => (
            <ConsultationVote key={c.id} consultation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
