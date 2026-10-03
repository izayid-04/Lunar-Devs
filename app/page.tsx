import Hero from "@/components/home/hero";
import DistrictMap from "@/components/home/district-map";
import Reveal from "@/components/home/reveal";
import ClosingCta from "@/components/home/closing-cta";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />

      <section className="border-b border-border px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-nova-2">
            Carte de la ville
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-wide sm:text-3xl">
            Six quartiers, un seul espace
          </h2>
          <p className="mt-3 text-muted-foreground">
            Survolez ou touchez un quartier pour découvrir ses services.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <DistrictMap />
        </Reveal>
      </section>

      <section className="px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-wide sm:text-3xl">
            Prêt·e à rejoindre Nova Terra ?
          </h2>
          <p className="mt-3 text-muted-foreground">
            La création de compte prend moins d&apos;une minute.
          </p>
          <ClosingCta />
        </Reveal>
      </section>
    </main>
  );
}
