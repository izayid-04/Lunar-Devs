import dynamic from "next/dynamic";
import Hero from "@/components/home/hero";
import QuickAccess from "@/components/home/quick-access";
import CitizenPrivileges from "@/components/home/citizen-privileges";
import DistrictMap from "@/components/home/district-map";
import HowItWorks from "@/components/home/how-it-works";
import Reveal from "@/components/home/reveal";
import ClosingCta from "@/components/home/closing-cta";

// F58 + F61 : Import dynamique différé pour le module PlanetShowcase (Globe 3D et images)
const PlanetShowcase = dynamic(() => import("@/components/home/planet-showcase"), {
  ssr: true,
  loading: () => (
    <div className="w-full py-24 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
      Chargement de la cartographie stellaire…
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />

      <QuickAccess />

      {/* Holographic Planet Showcase & Live Telemetry */}
      <PlanetShowcase />

      <HowItWorks />

      {/* Interactive District Map */}
      <section className="border-b border-border px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Carte de la ville
          </p>
          <h2 className="mt-2">
            Six quartiers, un seul espace
          </h2>
          <p className="mt-3 text-muted-foreground">
            Survolez ou touchez un quartier pour découvrir ses services et sa spécialisation.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <DistrictMap />
        </Reveal>
      </section>

      {/* Citizen Privileges & Call to Action */}
      <CitizenPrivileges />

      <section className="px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2>
            Prêt·e à rejoindre Nova Terra ?
          </h2>
          <p className="mt-3 text-muted-foreground">
            La création de compte prend moins d&apos;une minute.
          </p>
          <ClosingCta />
        </Reveal>
      </section>
    </div>
  );
}
