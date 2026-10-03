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
import Link from "next/link";
import { Clock, Mail, MapPin, Siren } from "lucide-react";
import { AvailabilityBadge, AvailabilityDetails } from "@/components/services/availability-badge";
import AvailabilityManager from "@/components/services/availability-manager";
import AppointmentBooking from "@/components/services/appointment-booking";
import ContactServiceButton from "@/components/services/contact-service-button";

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
        <Link href={`/districts?quartier=${encodeURIComponent(service.district)}`}>
          <Badge
            variant="outline"
            className="border-primary/40 text-primary gap-1.5 transition-colors hover:bg-primary/10"
          >
            <MapPin className="size-3" />
            {service.district}
          </Badge>
        </Link>
        <AvailabilityBadge availability={service.availability} />
        {service.isEmergency && (
          <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 gap-1.5">
            <Siren className="size-3" />
            Service d&apos;urgence
          </Badge>
        )}
      </div>
      <h1 className="mt-3">{service.name}</h1>
      <p className="mt-3 text-muted-foreground">{service.description}</p>

      <div className="mt-4">
        <AvailabilityManager service={service} />
      </div>

      <div className="mt-4">
        <AvailabilityDetails service={service} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <AppointmentBooking service={service} />
        <ContactServiceButton service={service} />
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
            {service.address && (
              <div className="flex items-start gap-2 text-sm sm:col-span-2">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <span>{service.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
