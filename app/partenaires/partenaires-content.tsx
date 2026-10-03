"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPartners, type Partner } from "@/lib/api";
import { DISTRICTS } from "@/lib/alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { HeartHandshake, MapPin, Clock, Phone } from "lucide-react";

function PartenairesContentInner() {
  const searchParams = useSearchParams();
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [district, setDistrict] = useState<string>("all");

  useEffect(() => {
    const quartier = searchParams.get("quartier");
    if (quartier) Promise.resolve().then(() => setDistrict(quartier));
  }, [searchParams]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setPartners(null);
      setError(null);
    });
    fetchPartners(district !== "all" ? district : undefined)
      .then(setPartners)
      .catch((err: Error) => setError(err.message));
  }, [district]);

  const districts = useMemo(() => Array.from(DISTRICTS), []);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 px-3 py-1 text-xs">
            <HeartHandshake className="size-3" />
            Associations partenaires
          </Badge>
          <h1 className="mt-4">Les associations partenaires de Nova Terra</h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Retrouvez les associations et acteurs locaux engagés auprès des habitants, quartier par
            quartier.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Tous les quartiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les quartiers</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}
          {!error && partners === null && (
            <div role="status" className="flex justify-center py-12">
              <LoadingSpinner />
              <span className="sr-only">Chargement des associations…</span>
            </div>
          )}
          {!error && partners !== null && partners.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucune association partenaire {district !== "all" ? "dans ce quartier" : "pour le moment"}.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(partners ?? []).map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
                      <MapPin className="size-3" />
                      {p.district}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      {p.address}
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Clock className="mt-0.5 size-3.5 shrink-0" />
                      {p.openingHours}
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Phone className="mt-0.5 size-3.5 shrink-0" />
                      {p.contact}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PartenairesContent() {
  return (
    <Suspense fallback={null}>
      <PartenairesContentInner />
    </Suspense>
  );
}
