import type { Metadata } from "next";
import {
  Building2,
  ClipboardCheck,
  MessageSquare,
  Satellite,
  ShieldCheck,
  User,
} from "lucide-react";
import Reveal from "@/components/home/reveal";
import ClosingCta from "@/components/home/closing-cta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "À propos — Nova Terra",
  description: "La plateforme numérique de la ville de Nova Terra",
};

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Démarches en ligne",
    text: "Créez votre compte et effectuez vos démarches sans vous déplacer.",
  },
  {
    icon: Building2,
    title: "Services municipaux",
    text: "Retrouvez les services de vos six quartiers au même endroit.",
  },
  {
    icon: MessageSquare,
    title: "Un contact direct",
    text: "Une administration plus proche de ses habitants, en ligne.",
  },
];

const ROLES = [
  {
    icon: User,
    title: "Habitant",
    text: "Crée un compte, accède à son espace personnel et à ses démarches.",
  },
  {
    icon: Satellite,
    title: "Agent municipal",
    text: "Suit et traite les demandes transmises par les habitants.",
  },
  {
    icon: ShieldCheck,
    title: "Administrateur",
    text: "Supervise la plateforme et gère les profils sensibles.",
  },
];

const ROADMAP = [
  "Contacter directement les services municipaux",
  "Annonces et actualités de la mairie",
  "Présentation détaillée de chaque service",
  "Outils de traitement des demandes pour les agents",
];

export default function AProposPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-border px-6 py-20 text-center">
        <Reveal className="mx-auto max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-nova-2">
            À propos
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-wide sm:text-4xl">
            Nova Terra, la ville qui se construit en ligne
          </h1>
          <p className="mt-4 text-muted-foreground">
            Nova Terra est la plateforme numérique de la ville : un seul
            espace pour que chaque habitant puisse créer son compte, suivre
            ses démarches, et retrouver les services municipaux qui le
            concernent — sans paperasse ni file d&apos;attente.
          </p>
        </Reveal>
      </section>

      <section className="border-b border-border px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-wide sm:text-3xl">
            Ce que vous pouvez déjà faire
          </h2>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <f.icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="font-heading text-sm font-semibold tracking-wide">
                    {f.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-b border-border px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-wide sm:text-3xl">
            Qui utilise la plateforme
          </h2>
          <p className="mt-2 text-muted-foreground">
            Trois profils, chacun avec ses propres outils.
          </p>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
          {ROLES.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.1}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-nova-2/10 text-nova-2">
                    <r.icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="font-heading text-sm font-semibold tracking-wide">
                    {r.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-b border-border px-6 py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-nova-2">
            Prochaines étapes
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-wide sm:text-3xl">
            La plateforme continue de grandir
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto mt-8 max-w-md">
          <ul className="flex flex-col gap-3">
            {ROADMAP.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="shrink-0">
                  à venir
                </Badge>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="px-6 py-20 text-center">
        <Reveal className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold tracking-wide sm:text-3xl">
            Rejoignez Nova Terra
          </h2>
          <ClosingCta />
        </Reveal>
      </section>
    </main>
  );
}
