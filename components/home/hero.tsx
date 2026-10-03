"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import Skyline from "@/components/home/skyline";
import Reveal from "@/components/home/reveal";
import { MapPin, Users, Gauge, Clock } from "lucide-react";

export default function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="border-b border-border px-6 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Ville de Nova Terra
        </p>
        <h1 className="mt-3">Les services de la ville, en un seul endroit</h1>
        <p className="mt-4 text-muted-foreground">
          Créez votre compte habitant pour accéder à votre espace personnel
          et suivre vos démarches auprès des services municipaux.
        </p>

        {!loading && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/espace">Accéder à mon espace</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/inscription">Créer un compte</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/connexion">Connexion</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </Reveal>

      <Reveal delay={0.1}>
        <Skyline className="mx-auto mt-16 w-full max-w-xl" />
      </Reveal>

      <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat icon={MapPin} value={6} label="Quartiers" />
        <Stat icon={Users} value={3} label="Profils" />
        <Stat icon={Clock} value={24} suffix="/7" label="Accès à l'espace" />
        <Stat icon={Gauge} value={100} suffix="%" label="Auto-hébergé" />
      </dl>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  suffix,
  label,
}: {
  icon: typeof MapPin;
  value: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      <p className="text-h2 font-semibold text-foreground dark:text-foreground">
        <NumberTicker
          value={value}
          className="text-foreground dark:text-foreground"
        />
        {suffix}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
