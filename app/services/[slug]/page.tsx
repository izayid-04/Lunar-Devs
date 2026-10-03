import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchService } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Clock, Mail, MapPin } from "lucide-react";
import { AvailabilityBadge, AvailabilityDetails } from "@/components/services/availability-badge";
import AvailabilityManager from "@/components/services/availability-manager";

async function getService(slug: string) {
  try {
    return await fetchService(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  return {
    title: service ? `${service.name} — Nova Terra` : "Service introuvable — Nova Terra",
  };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
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
            <BreadcrumbLink href="/districts">Services</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{service.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/40 text-primary gap-1.5">
          <MapPin className="size-3" />
          {service.district}
        </Badge>
        <AvailabilityBadge availability={service.availability} />
      </div>
      <h1 className="mt-3">{service.name}</h1>
      <p className="mt-3 text-muted-foreground">{service.description}</p>

      <div className="mt-4">
        <AvailabilityManager service={service} />
      </div>

      <div className="mt-4">
        <AvailabilityDetails service={service} />
      </div>

      <Card className="mt-8">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{service.details}</p>

          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div className="flex items-start gap-2 text-sm">
              <Mail className="mt-0.5 size-4 text-muted-foreground" />
              <span>{service.contact}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="mt-0.5 size-4 text-muted-foreground" />
              <span>{service.horaires}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
