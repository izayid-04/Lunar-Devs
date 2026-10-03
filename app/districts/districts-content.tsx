"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchServices, type Service, type ServiceCategory } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Siren } from "lucide-react";
import LoadingSpinner from "@/components/ui/snow-ball-loading-spinner";
import { AvailabilityBadge } from "@/components/services/availability-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  sante: "Santé",
  securite: "Sécurité",
  administratif: "Administratif",
  culture: "Culture",
  education: "Éducation",
  voirie: "Voirie",
  "eau-energie": "Eau & Énergie",
  tourisme: "Tourisme",
};

function DistrictsContentInner() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch((err: Error) => setError(err.message));
  }, []);

  // Pré-sélection du quartier depuis un lien externe (ex. fiche service → "Localiser dans le quartier").
  useEffect(() => {
    const quartier = searchParams.get("quartier");
    if (quartier) Promise.resolve().then(() => setDistrict(quartier));
  }, [searchParams]);

  const districts = useMemo(() => {
    if (!services) return [];
    return Array.from(new Set(services.map((s) => s.district))).sort();
  }, [services]);

  // Les catégories réelles présentes dans les données (champ absent en prod
  // pour le moment, voir docs/BESOINS-API.md) — le filtre n'apparaît que
  // s'il y a au moins un service catégorisé, pour ne pas proposer un
  // sélecteur qui ne renverrait jamais rien.
  const categories = useMemo(() => {
    if (!services) return [];
    return Array.from(new Set(services.map((s) => s.category).filter(Boolean))).sort();
  }, [services]);

  const hasEmergencyServices = useMemo(
    () => services?.some((s) => s.isEmergency) ?? false,
    [services]
  );

  const filtered = useMemo(() => {
    if (!services) return [];
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (district !== "all" && s.district !== district) return false;
      if (category !== "all" && s.category !== category) return false;
      if (emergencyOnly && !s.isEmergency) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    });
  }, [services, search, district, category, emergencyOnly]);

  // Services mis en avant en tête de leur quartier (F28) — n'a d'effet
  // visible qu'une fois le champ `featured` renseigné côté API.
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      if (!map.has(s.district)) map.set(s.district, []);
      map.get(s.district)!.push(s);
    }
    for (const items of map.values()) {
      items.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
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
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              placeholder="Rechercher un service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
            {categories.length > 0 && (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasEmergencyServices && (
              <Button
                type="button"
                variant={emergencyOnly ? "default" : "outline"}
                className={emergencyOnly ? "gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90" : "gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"}
                onClick={() => setEmergencyOnly((v) => !v)}
              >
                <Siren className="size-4" />
                Urgences
              </Button>
            )}
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
                      <Card className={`h-full transition-colors hover:border-primary/50 ${s.featured ? "border-primary/40" : ""}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold">{s.name}</h3>
                            <AvailabilityBadge availability={s.availability} />
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {s.description}
                          </p>
                          {(s.featured || s.isEmergency) && (
                            <div className="mt-3 flex gap-2">
                              {s.featured && (
                                <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">
                                  Service prioritaire
                                </Badge>
                              )}
                              {s.isEmergency && (
                                <Badge variant="outline" className="border-destructive/40 text-destructive text-[11px] gap-1">
                                  <Siren className="size-3" />
                                  Urgence
                                </Badge>
                              )}
                            </div>
                          )}
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

export default function DistrictsContent() {
  return (
    <Suspense fallback={null}>
      <DistrictsContentInner />
    </Suspense>
  );
}
