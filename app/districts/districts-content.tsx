"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchServices, type Service } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DistrictsContent() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState<string>("all");

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch((err: Error) => setError(err.message));
  }, []);

  const districts = useMemo(() => {
    if (!services) return [];
    return Array.from(new Set(services.map((s) => s.district))).sort();
  }, [services]);

  const filtered = useMemo(() => {
    if (!services) return [];
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (district !== "all" && s.district !== district) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    });
  }, [services, search, district]);

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      if (!map.has(s.district)) map.set(s.district, []);
      map.get(s.district)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 text-xs">
            Services municipaux
          </Badge>
          <h1 className="mt-4">Les services de Nova Terra, par quartier</h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            {services
              ? `${districts.length} quartiers, ${services.length} services`
              : "Chargement…"}
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Rechercher un service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
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

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {!error && services === null && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}
          {!error && services !== null && filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucun service ne correspond à votre recherche.
            </p>
          )}

          <div className="space-y-10">
            {grouped.map(([districtName, items]) => (
              <div key={districtName}>
                <h2>{districtName}</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {items.map((s) => (
                    <Link key={s.id} href={`/services/${s.slug}`}>
                      <Card className="h-full transition-colors hover:border-primary/50">
                        <CardContent className="p-5">
                          <h3 className="font-semibold">{s.name}</h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {s.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
