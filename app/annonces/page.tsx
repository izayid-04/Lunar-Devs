import type { Metadata } from "next";
import Link from "next/link";
import { fetchAnnouncements } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Annonces — Nova Terra",
  description: "Annonces et actualités de la mairie de Nova Terra.",
};

// Le contenu change à la demande (création/édition/suppression côté
// agent) : ne pas figer cette liste au moment du `next build`.
export const dynamic = "force-dynamic";

export default async function AnnoncesPage() {
  let announcements = [] as Awaited<ReturnType<typeof fetchAnnouncements>>;
  let error: string | null = null;
  try {
    announcements = await fetchAnnouncements();
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de récupérer les annonces.";
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 px-3 py-1 text-xs">
            <Megaphone className="size-3" />
            Annonces
          </Badge>
          <h1 className="mt-4">Actualités de la mairie</h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Les dernières annonces publiées par les services municipaux.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-2xl">
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {!error && announcements.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucune annonce pour le moment.
            </p>
          )}
          <div className="space-y-4">
            {announcements.map((a) => (
              <Link key={a.id} href={`/annonces/${a.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {a.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.publishedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <h3 className="mt-3">{a.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
