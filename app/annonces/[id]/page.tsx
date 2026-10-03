import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAnnouncement } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

async function getAnnouncement(id: string) {
  try {
    return await fetchAnnouncement(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/annonces/[id]">): Promise<Metadata> {
  const { id } = await params;
  const announcement = await getAnnouncement(id);
  return {
    title: announcement ? `${announcement.title} — Nova Terra` : "Annonce introuvable — Nova Terra",
  };
}

export default async function AnnonceDetailPage({ params }: PageProps<"/annonces/[id]">) {
  const { id } = await params;
  const announcement = await getAnnouncement(id);

  if (!announcement) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Nova Terra</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/annonces">Annonces</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{announcement.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary" className="text-xs">
          {announcement.category}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(announcement.publishedAt).toLocaleDateString("fr-FR", {
            dateStyle: "long",
          })}
        </span>
      </div>

      <h1 className="mt-3">{announcement.title}</h1>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {announcement.body}
      </p>
    </main>
  );
}
