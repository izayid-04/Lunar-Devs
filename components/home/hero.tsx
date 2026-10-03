"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/home/reveal";
import HeroCockpitPreview from "@/components/home/hero-cockpit-preview";

export default function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-border px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Cité Spatiale de Nova Terra
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Les services de la ville, en un seul endroit
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
          Créez votre passeport habitant pour accéder à votre cockpit personnel,
          suivre vos démarches et piloter vos accès aux dômes en temps réel.
        </p>

        {!loading && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Accéder au Cockpit Urbain</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/inscription">Créer mon passeport résident</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/connexion">Connexion</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </Reveal>

      {/* Remplacement des stats basiques par la Console Cockpit 3D Interactive */}
      <Reveal delay={0.15}>
        <HeroCockpitPreview />
      </Reveal>
    </section>
  );
}
