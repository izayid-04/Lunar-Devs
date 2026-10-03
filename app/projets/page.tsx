import type { Metadata } from "next";
import Link from "next/link";
import { fetchProjects } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Vote } from "lucide-react";

export const metadata: Metadata = {
  title: "Projets de la ville — Nova Terra",
  description: "Les grands projets urbains de Nova Terra et leurs consultations citoyennes.",
};

// Le contenu (nouveaux projets, consultations) change côté backend sans
// rebuild front : ne pas figer cette liste au moment du `next build`.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  en_cours: "En cours",
  planifie: "Planifié",
  termine: "Terminé",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status.replace(/_/g, " ");
}

export default async function ProjetsPage() {
  let projects = [] as Awaited<ReturnType<typeof fetchProjects>>;
  let error: string | null = null;
  try {
    projects = await fetchProjects();
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de récupérer les projets de la ville.";
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 px-3 py-1 text-xs">
            <Building2 className="size-3" />
            Projets de la ville
          </Badge>
          <h1 className="mt-4">Les grands projets urbains de Nova Terra</h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Consultez les projets en cours et donnez votre avis sur les consultations citoyennes
            associées.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}
          {!error && projects.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucun projet publié pour le moment.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projets/${p.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{p.title}</h3>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {statusLabel(p.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {p.district}
                      </span>
                      {p.consultations.length > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <Vote className="size-3.5" />
                          {p.consultations.length} consultation{p.consultations.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
