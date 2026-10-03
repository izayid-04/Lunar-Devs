"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchServices, fetchAnnouncements, type Service, type Announcement } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Megaphone } from "lucide-react";
import Reveal from "@/components/home/reveal";

export default function QuickAccess() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  useEffect(() => {
    fetchServices().then(setServices).catch(() => setServices([]));
    fetchAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([]));
  }, []);

  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
        <Reveal>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Compass className="size-4 text-primary" />
            Services principaux
          </div>
          <div className="mt-3 space-y-2">
            {(services ?? Array.from({ length: 3 })).slice(0, 4).map((s, i) =>
              s ? (
                <Link key={s.id} href={`/services/${s.slug}`}>
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="flex items-center justify-between p-3">
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.district}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <div key={i} className="h-[52px] animate-pulse rounded-xl bg-muted" />
              )
            )}
            {services?.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun service disponible.</p>
            )}
          </div>
          <Link href="/districts" className="mt-3 inline-block text-xs text-primary underline">
            Tous les services →
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Megaphone className="size-4 text-primary" />
            Annonces &amp; alertes récentes
          </div>
          <div className="mt-3 space-y-2">
            {(announcements ?? Array.from({ length: 3 })).slice(0, 3).map((a, i) =>
              a ? (
                <Link key={a.id} href={`/annonces/${a.id}`}>
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium line-clamp-1">{a.title}</span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {a.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <div key={i} className="h-[52px] animate-pulse rounded-xl bg-muted" />
              )
            )}
            {announcements?.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
            )}
          </div>
          <Link href="/annonces" className="mt-3 inline-block text-xs text-primary underline">
            Toutes les annonces →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
